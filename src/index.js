const entityFactoryProvider = require("./domain/entityFactoryProvider");
const resourceProviderFactory = require("./domain/resourceFactoryProvider");
const fsFileAdapter = require("./infrastructure/fsFileAdapter");
const azureBlobStorageAdapter = require("./infrastructure/azureBlobStorageFileAdapter");
const JSONSerializer = require("./middleware/JSONSerializer");
const {inMemoryFileAdapter} = require("./infrastructure/inMemoryFileAdapter");

/**
 * @type {{ntt: entity, adapters: {fs: fsFileAdapter}}}
 */
const ntt =  {
  entity: (adapter, serializer = JSONSerializer) => {
    const entityFactory = entityFactoryProvider(serializer, resourceProviderFactory);
    return entityFactory.create(adapter);
  },
  adapters: {
    fs: fsFileAdapter,
    azure: azureBlobStorageAdapter,
    inMemory: inMemoryFileAdapter
  }
};

module.exports = ntt;