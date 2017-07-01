const filenameValidator = require("../middleware/noSpecialCharsFilenameValidator");

/**
 *
 * @param files
 * @param directories
 * @returns {{readFile: (function(*)), writeFile: (function(*, *)), listFiles: (function()), listDirectories: (function()), getDirectoryProvider: (function(*)), createDirectory: (function(*))}}
 */
const inMemoryFileAdapter  = ({files = {}, directories = {}} = {}) => {
  return {
    readFile: (fileName) => {
      return new Promise((resolve, reject) => {
        if (fileName in files) {
          resolve(files[fileName]);
        }
        else {
          reject(Error(`File does not exist: ${fileName}`));
        }
      });
    },
    writeFile: (fileName, content) => {
      return new Promise((resolve, reject) => {
        files[fileName] = content;
        resolve();
      });
    },
    listFiles: () => {
      return new Promise((resolve, reject) => {
        const fileNames = [];
        for(const fileName in files) {
          fileNames.push(fileName);
        }
        resolve(fileNames);
      });
    },
    listDirectories: () => {
      return new Promise((resolve) => {
        const subDirectories = [];
        for(const subDirectory in directories) {
          subDirectories.push(subDirectory);
        }
        resolve(subDirectories);
      });
    },
    getDirectoryProvider: (directoryName) => {
      return new Promise((resolve, reject) => {
        if (directoryName in directories) {
          const adapter = inMemoryFileAdapter(directories[directoryName]);
          adapter.directoryName = directoryName;
          resolve(adapter);
        }
        else {
          reject(Error(`Directory does not exist: ${directoryName}`));
        }
      });
    },
    createDirectory: (directoryName) => {
      return new Promise((resolve, reject) => {
        if(!directories[directoryName]){
          directories[directoryName] = {
            files: {},
            directories: {}
          };
        }
        resolve();
      });
    },
    validate: (folderName) => {
      return filenameValidator.validate(folderName);
    }
  };
};


const entity = (id, content) => {
  return JSON.stringify({
    id: id,
    content: content
  });
};

const exampleFileStructure = () => {
  return {
    files: {
      "entity.json": entity(1, "main entity")
    },
    directories: {
      "subresource1": {
        directories: {
          "1": {
            files: {
              "entity.json": entity(11, "subresource1/1")
            }
          },
          "2": {
            files: {
              "entity.json": entity(12, "subresource1/2")
            }
          }
        }
      },
      "subresource2": {
        directories: {
          "1": {
            files: {
              "entity.json": entity(21, "subresource2/1")
            }
          }
        }
      }
    }
  };
};

module.exports = {
  inMemoryFileAdapter: inMemoryFileAdapter,
  exampleFileStructure: exampleFileStructure
};