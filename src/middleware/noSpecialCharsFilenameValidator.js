const validator = {
  validate: (folderName) => {
    const regex = /^[a-z0-9_-]+$/i;
    return !(folderName === null || folderName === undefined) && regex.test(`${folderName}`);
  }
};

module.exports = validator;