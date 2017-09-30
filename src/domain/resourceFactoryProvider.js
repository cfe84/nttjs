const uuid = require("uuid");
const rmrf = require("../middleware/rmrf");

const resourceFactoryProvider = (serializer, entityFactoryProvider) => {
  return {
    create: (fileAdapter) => {
      const toString = (resourceName) => `${resourceName}`;

      const resourceProvider = {
        listEntities: () => {
          return fileAdapter.listDirectories();
        },

        iterateEntities: async () => {
          const entitiesIdList = await resourceProvider.listEntities();
          let i = 0;
          // This is returning something resembling a JS iterator, but asynchronous.
          // You need to await the "next"
          const iterator = {
            next: async () => {
              const done = i >= entitiesIdList.length;
              let entity;
              if (!done) {
                const entityId = entitiesIdList[i];
                entity = await resourceProvider.getEntity(entityId);
              }
              const element = {
                value: entity,
                done: done
              };
              i++;
              return element;
            }
          };
          return iterator;
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
        },

        delete: async () => {
          const entities = await resourceProvider.listEntities();
          if (entities.length > 0) {
            throw Error("Resource not empty");
          }
          await rmrf(fileAdapter);
        }
      };
      return resourceProvider;
    }
  };
};

module.exports = resourceFactoryProvider;