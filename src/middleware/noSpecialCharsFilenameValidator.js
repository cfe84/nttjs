const isAString = (folderName) => folderName === `${folderName}`;
const hasValue = (folderName) => folderName !== null && folderName !== undefined;

const validator = {
  validate: (folderName) => {
    const regex = /^[a-z0-9_-]+$/i;
    return hasValue(folderName) &&
      isAString(folderName) &&
      regex.test(folderName);
  }
};

module.exports = validator;