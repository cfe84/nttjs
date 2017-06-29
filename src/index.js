const entityFactoryProvider = require("./domain/entityFactoryProvider");
const resourceProviderFactory = require("./domain/resourceFactoryProvider");
const fsFileAdapter = require("./infrastructure/fsFileAdapter");
const azureBlobStorageAdapter = require("./infrastructure/azureBlobStorageFileAdapter");
const JSONSerializer = require("./middleware/JSONSerializer");

/**
 * @type {{ntt: entity, adapters: {fs: fsFileAdapter}}}
 */
const ntt =  {
  ntt: (adapter, serializer = JSONSerializer) => {
    const entityFactory = entityFactoryProvider(serializer, resourceProviderFactory);
    return entityFactory.create(adapter);
  },
  adapters: {
    fs: fsFileAdapter,
    azure: azureBlobStorageAdapter
  }
};

module.exports = ntt;