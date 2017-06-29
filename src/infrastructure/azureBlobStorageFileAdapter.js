const azure = require("azure-storage");
const validator = require("../middleware/noSpecialCharsFilenameValidator");

const DUMMY_FILE_NAME = "._";

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

const blobAdapter = (config, containerName) => {

  const blobService = azure.createBlobService(config.account, config.key);

  const blobDirectory = (path) => {

    const joinPath = (directoryPath, fileOrDirectoryName) => directoryPath.length
      ? `${directoryPath}/${fileOrDirectoryName}`
      : fileOrDirectoryName;
    const stripTrailingSlash = (directory) => directory.length > 0 && directory[directory.length - 1] === "/"
      ? directory.substr(0, directory.length - 1)
      : directory;
    const stripPath = (fileOrDirectoryName) => fileOrDirectoryName.indexOf(path + "/") === 0
      ? fileOrDirectoryName.substr(path.length + 1)
      : fileOrDirectoryName;

    const self = {

      readFile: (fileName) => {
        const fullFileName = joinPath(path, fileName);
        return new Promise((resolve, reject) => {
          try {
            blobService.getBlobToText(containerName, fullFileName, returnAsPromise(resolve, reject));
          } catch (error) {
            reject(error);
          }
        });
      },

      writeFile: (fileName, content) => {
        const fullFileName = joinPath(path, fileName);
        return new Promise((resolve, reject) => {
          try {
            blobService.createBlockBlobFromText(containerName, fullFileName, content, returnAsPromise(resolve, reject));
          } catch (error) {
            reject(error);
          }
        });
      },

      listFiles: () => {
        const options = {useFlatBlobListing: false}; // We use non flat because we don't want to go in folders
        return new Promise((resolve, reject) => {
          // TODO: Manage continuation tokens
            const processResult = (result) =>
              result.entries.map((blob) => {
                  let name = blob.name;
                  name = stripPath(name);
                  return name;
              });
            blobService.listBlobsSegmentedWithPrefix(containerName, path, null, options, returnAsPromise(resolve, reject, processResult));
        });
      },

      listDirectories: () => {
        const options = {};
        return new Promise((resolve, reject) => {
          // Todo: Manage continuation tokens.
          const processResult = (result) =>
            result.entries.map((directory) => {
              let name = directory.name;
              name = stripTrailingSlash(name);
              name = stripPath(name);
              return name;
            });
          blobService.listBlobDirectoriesSegmentedWithPrefix(containerName, path, null, options, returnAsPromise(resolve, reject, processResult));
        });
      },

      getDirectoryProvider: (directoryName) => {
        const directoryFullPath = joinPath(path, directoryName);
        const directoryProvider = blobDirectory(directoryFullPath);
        return Promise.resolve(directoryProvider);
      },

      createDirectory: (directoryName) => {
        return self.getDirectoryProvider(directoryName)
          .then((provider) => provider.writeFile(DUMMY_FILE_NAME, ""));
      },

      validate: (folderName) => validator.validate(folderName)
    };

    return self;
  };

  return blobDirectory("");
};

module.exports = blobAdapter;