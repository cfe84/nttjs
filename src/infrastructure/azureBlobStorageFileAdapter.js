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
        const options = { useFlatBlobListing: false }; // We use non flat because we don't want to go in folders
        return new Promise((resolve, reject) => {
          let files = [];

          const processResult = (error, result) => {
            if (error) {
              reject(error);
            }
            const batch = result.entries.map((blob) => {
              let name = blob.name;
              name = stripPath(name);
              return name;
            });
            files = files.concat(batch);
            if (result.continuationToken) {
              crawl(result.continuationToken);
            }
            else {
              resolve(files);
            }
          };

          const crawl = (continuationToken) =>
            blobService.listBlobsSegmentedWithPrefix(containerName, path, continuationToken, options, processResult);

          crawl(null);
        });
      },

      listDirectories: () => {
        const options = {};
        const dirPath = path.length === 0 ? "" : stripTrailingSlash(path) + "/";
        return new Promise((resolve, reject) => {
          let directories = [];

          const processResult = (error, result) => {
            if (error) {
              reject(error);
            }
            const batch = result.entries.map((directory) => {
              let name = directory.name;
              name = stripTrailingSlash(name);
              name = stripPath(name);
              return name;
            });
            directories = directories.concat(batch);
            if (result.continuationToken) {
              crawl(result.continuationToken);
            }
            else {
              resolve(directories);
            }
          };

          const crawl = (continuationToken) =>
            blobService.listBlobDirectoriesSegmentedWithPrefix(containerName, dirPath, continuationToken, options, processResult);

          crawl(null);
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