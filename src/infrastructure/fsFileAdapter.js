const path = require("path");
const fs = require("fs");
const validator = require("../middleware/noSpecialCharsFilenameValidator");


const returnAsPromise = (resolve, reject, processResult) => (error, result) => {
  if (error) {
    return reject(error);
  }
  let processedResult = result;
  if (processResult) {
    processedResult = processResult(result);
  }
  resolve(processedResult);
};

const fsFileAdapter = (directoryPath) => {
  return {
    readFile: (fileName) => {
      const fullPath = path.join(directoryPath, fileName);
      return new Promise((resolve, reject) => {
        try {
          fs.readFile(fullPath, returnAsPromise(resolve, reject, (buff) => buff.toString()));
        } catch (error) {
          reject(error);
        }
      });
    },
    writeFile: (fileName, content) => {
      const fullPath = path.join(directoryPath, fileName);
      return new Promise((resolve, reject) => {
        fs.writeFile(fullPath, content, returnAsPromise(resolve, reject));
      });
    },
    deleteFile: (fileName) => {
      const fullPath = path.join(directoryPath, fileName);
      return new Promise((resolve, reject) => {
        if (fs.existsSync(fullPath)) {
          fs.unlink(fullPath, returnAsPromise(resolve, reject));
        }
        else {
          resolve();
        }
      });
    },
    listFiles: () => {
      return new Promise((resolve, reject) => {
        fs.readdir(directoryPath, returnAsPromise(resolve, reject, (elements) =>
          elements.filter((file) => !fs.lstatSync(path.join(directoryPath, file)).isDirectory())
        ));
      });
    },
    listDirectories: () => {
      return new Promise((resolve, reject) => {
        fs.readdir(directoryPath, returnAsPromise(resolve, reject, (elements) =>
          elements.filter((file) => fs.lstatSync(path.join(directoryPath, file)).isDirectory())
        ));
      });
    },
    getDirectoryProvider: (directoryName) => {
      return Promise.resolve(fsFileAdapter(path.join(directoryPath, directoryName)));
    },
    createDirectory: (directoryName) => {
      const newDirectoryPath = path.join(directoryPath, directoryName);
      if (!fs.existsSync(newDirectoryPath)) {
        try {
          fs.mkdirSync(newDirectoryPath);
        }
        catch(error) {
          return Promise.reject(error);
        }
      }
      return Promise.resolve();
    },
    deleteDirectory: (directoryName) => {
      const fullPath = directoryName !== undefined ? path.join(directoryPath, directoryName) : directoryPath;
      return new Promise((resolve, reject) => {
        fs.rmdir(fullPath, returnAsPromise(resolve, reject));
      });
    },
    validate: (folderName) => validator.validate(folderName)
  };
};

module.exports = fsFileAdapter;