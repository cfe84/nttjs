const uuid = require("uuid");
const ENTITY_FILENAME = "entity.json";

const entity = (fileAdapter, serializer) => {
  const toString = (resourceName) => `${resourceName}`;

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
    listResourceEntities: (resourceName) => {
      return validateName(resourceName)
        .then(() => fileAdapter.getDirectoryProvider(resourceName))
        .then((subfolderProvider) => subfolderProvider.listDirectories());
    },
    createResourceEntity: (resourceName, id) => {
      if (!id) {
        id = uuid() + "-" + uuid();
      }
      id = toString(id);
      return validateName(resourceName)
        .then(() => validateName(id))
        .then(() => fileAdapter.createDirectory(resourceName))
        .then(() => fileAdapter.getDirectoryProvider(resourceName))
        .then((subFolderProvider) => subFolderProvider.createDirectory(id))
        .then(() => entityProvider.getResourceEntity(resourceName, id));
    },
    getResourceEntity: (resourceName, id) => {
      id = toString(id);
      return validateName(resourceName)
        .then(() => validateName(id))
        .then(() => fileAdapter.getDirectoryProvider(resourceName))
        .then((resourceFsProvider) => resourceFsProvider.getDirectoryProvider(id))
        .then((entityFsProvider) => {
          const provider = entity(entityFsProvider, serializer);
          provider.id = id;
          return provider;
        });
    }
  };
  return entityProvider;
};

module.exports = entity;