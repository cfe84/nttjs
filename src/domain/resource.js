const uuid = require("uuid");

const resourceFactoryProvider = (serializer, entityFactoryProvider) => {
  return {
    create: (fileAdapter) => {
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
              const entityFactory = entityFactoryProvider(serializer, resourceFactoryProvider);
              const entity = entityFactory.create(fsProvider);
              entity.id = id;
              return entity;
            });
        }
      };
      return resourceProvider;
    }
  };
};

module.exports = resourceFactoryProvider;