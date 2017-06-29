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
        listResources: () => {
          return fileAdapter.listDirectories();
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