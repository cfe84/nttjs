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
      return new Promise((resolve, reject) => {
        resolve(fsFileAdapter(path.join(directoryPath, directoryName)));
      });
    },
    createDirectory: (directoryName) => {
      return new Promise((resolve, reject) => {
        const newDirectoryPath = path.join(directoryPath, directoryName);
        if (!fs.existsSync(newDirectoryPath)) {
          fs.mkdir(path.join(directoryPath, directoryName), returnAsPromise(resolve, reject));
        }
        else {
          resolve();
        }
      });
    },
    validate: (folderName) => validator.validate(folderName)
  };
};

module.exports = fsFileAdapter;