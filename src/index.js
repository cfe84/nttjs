const entity = require("./domain/entity");
const fsFileAdapter = require("./infrastructure/fsFileAdapter");
const azureBlobStorageAdapter = require("./infrastructure/azureBlobStorageFileAdapter");
const JSONSerializer = require("./middleware/JSONSerializer");

/**
 * @type {{ntt: entity, adapters: {fs: fsFileAdapter}}}
 */
const ntt =  {
  ntt: (adapter, serializer = JSONSerializer) => {
    return entity(adapter, serializer);
  },
  adapters: {
    fs: fsFileAdapter,
    azureBlobStorage: azureBlobStorageAdapter
  }
};

module.exports = ntt;