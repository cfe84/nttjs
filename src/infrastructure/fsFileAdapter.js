const path = require("path");
const fs = require("fs");

const fsFileAdapter = (directoryPath) => {
  return {
    readFile: (fileName) => {
      const fullPath = path.join(directoryPath, fileName);
      return new Promise((resolve, reject) => {
        try {
          fs.readFile(fullPath, {}, (content) => {
            resolve(content);
          });
        } catch (error) {
          reject(error);
        }
      });
    },
    writeFile: (fileName, content) => {
      return new Promise((resolve, reject) => {
      });
    },
    listFiles: () => {
      return new Promise((resolve, reject) => {
      });
    },
    listDirectories: () => {
      return new Promise((resolve) => {
      });
    },
    getDirectoryProvider: (directoryName) => {
      return new Promise((resolve, reject) => {
      });
    },
    createDirectory: (directoryName) => {
      return new Promise((resolve, reject) => {
      });
    }
  };
};

module.exports = fsFileAdapter;