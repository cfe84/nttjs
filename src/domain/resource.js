const uuid = require("uuid");
const entityProvider = require("./entity");

const resource = (fileAdapter, serializer) => {
  const toString = (resourceName) => `${resourceName}`;

  const resourceProvider = {
    listEntities: () => {
      return fileAdapter.listDirectories();
    },

    createEntity: (id) => {
      if (!id) {
        id = uuid() + "-" + uuid();
      }
      id = toString(id);
      return fileAdapter.createDirectory(id)
        .then(() => resourceProvider.getEntity(id));
    },

    getEntity: (id) => {
      id = toString(id);
      return fileAdapter.validate(id)
        .then(() => fileAdapter.getDirectoryProvider(id))
        .then((fsProvider) => {
          const provider = entityProvider(fsProvider, serializer);
          provider.id = id;
          return provider;
        });
    }
  };
  return resourceProvider;
};

module.exports = resource;