const rmrf = require("../middleware/rmrf");

const ENTITY_FILENAME = "entity.json";

const entityFactoryProvider = (serializer, resourceFactoryProvider) => {
  return {
    create: (fileAdapter) => {
      const validateName = (resourceName) => {
        if(resourceName !== null && resourceName !== undefined && fileAdapter.validate(resourceName)) {
          return Promise.resolve();
        }
        else {
          return Promise.reject(Error(`Invalid identifier: ${resourceName}`));
        }
      };

      const entityProvider = {
        load: () => {
          return fileAdapter.readFile(ENTITY_FILENAME)
            .then((content) => {
              return serializer.deserialize(content);
            });
        },
        save: (content) => {
          if (content === null || content === undefined || content === "") {
            return Promise.reject(Error("Cannot save empty content"));
          }
          const serializedContent = serializer.serialize(content);
          return fileAdapter.writeFile(ENTITY_FILENAME, serializedContent);
        },
        delete: async () => {
          const subResources = await entityProvider.listResources();
          if (subResources.length > 0) {
            throw Error("Entity not empty");
          }
          await rmrf(fileAdapter);
        },
        listResources: () => {
          return fileAdapter.listDirectories();
        },
        iterateResources: async () => {
          const resourceNamesList = await entityProvider.listResources();
          let i = 0;
          // This is returning something resembling a JS iterator, but asynchronous.
          // You need to await the "next"
          const iterator = {
            next: async () => {
              const done = i >= resourceNamesList.length;
              let resource;
              if (!done) {
                const resourceName = resourceNamesList[i];
                resource = await entityProvider.getResource(resourceName);
              }
              const element = {
                value: resource,
                done: done
              };
              i++;
              return element;
            }
          };
          return iterator;
        },
        getResource: (resourceName) => {
          return validateName(resourceName)
            .then(() => fileAdapter.getDirectoryProvider(resourceName))
            .then((directoryProvider) => {
              const resourceFactory = resourceFactoryProvider(serializer, entityFactoryProvider);
              const resource = resourceFactory.create(directoryProvider);
              resource.name = resourceName;
              return resource;
            });
        },
        createResource: (resourceName) => {
          return fileAdapter.validate(resourceName)
            .then(() => fileAdapter.createDirectory(resourceName))
            .then(() => entityProvider.getResource(resourceName));
        }
      };
      return entityProvider;
    }
  };
};

module.exports = entityFactoryProvider;