const isAString = (folderName) => folderName === `${folderName}`;
const hasValue = (folderName) => folderName !== null && folderName !== undefined && folderName !== "";

const errors = {
  empty: "File or folder name is empty",
  notAString: "File or folder name is not a string",
  invalidCharacters: "File or folder name contains invalid characters"
};

const validator = {
  validate: (folderName) => {
    const regex = /^[ a-z0-9_-]+$/i;
    if (!hasValue(folderName)) {
      return Promise.reject(Error(errors.empty));
    }
    if (!isAString(folderName)) {
      return Promise.reject(Error(errors.notAString));
    }
    if (!regex.test(folderName)) {
      return Promise.reject(Error(errors.invalidCharacters));
    }
    return Promise.resolve();
  },
  errors: errors
};

module.exports = validator;