const filenameValidator = require("../middleware/noSpecialCharsFilenameValidator");

/**
 *
 * @param files
 * @param directories
 * @returns {{readFile: (function(*)), writeFile: (function(*, *)), listFiles: (function()), listDirectories: (function()), getDirectoryProvider: (function(*)), createDirectory: (function(*))}}
 */
const inMemoryFileAdapter  = ({files = {}, directories = {}} = {}, parent = {}) => {
  const self = {
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
    deleteFile: (fileName) => {
      return new Promise((resolve, reject) => {
        if (!fileName in files) {
          reject(Error("File does not exist"));
        }
        else {
          delete files[fileName];
          resolve();
        }
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
          const adapter = inMemoryFileAdapter(directories[directoryName], directories);
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
    deleteDirectory: (dirName) => {
      return new Promise((resolve, reject) => {
        let directoryCollection = directories;
        let directoryName = dirName;
        if (!directoryName) {
          directoryCollection = parent;
          directoryName = self.directoryName;
        }
        if (!(directoryName in directoryCollection)) {
          console.error(directoryCollection);
          return reject(Error(`Directory does not exist: ${directoryName}`));
        }
        try {
          const subDirectoryHasFolders = directoryCollection[directoryName].directories &&
            Object.keys(directoryCollection[directoryName].directories).length > 0;
          const subDirectoryHasFiles = directoryCollection[directoryName].files &&
            Object.keys(directoryCollection[directoryName].files).length > 0;
          if (subDirectoryHasFiles || subDirectoryHasFolders) {
            console.log(directoryCollection[directoryName]);
            return reject(Error("Directory not empty"));
          }
        }
        catch(error) {
          console.error(error);
          console.error(directoryCollection);
          console.error(directoryName);
          console.error(directoryCollection[directoryName]);
          throw error;
        }
        delete directoryCollection[directoryName];
        resolve();
      });
    },
    validate: (folderName) => {
      return filenameValidator.validate(folderName);
    }
  };
  return self;
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
        },
        files: {

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