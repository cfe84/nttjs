const uuid = require("uuid");
const ENTITY_FILENAME = "entity.json";

const entity = (fileAdapter, serializer) => {

  const validateName = (resourceName) => {
    if(resourceName !== null && resourceName !== undefined && fileAdapter.validate(resourceName)) {
      return Promise.resolve();
    }
    else {
      return Promise.reject(Error(`Invalid identifier: ${resourceName}`));
    }
  };

  return {
    read: () => {
      return fileAdapter.readFile(ENTITY_FILENAME)
        .then((content) => {
          return serializer.deserialize(content);
        });
    },
    write: (content) => {
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
      return validateName(resourceName)
        .then(() => validateName(id))
        .then(() => fileAdapter.createDirectory(resourceName))
        .then(() => fileAdapter.getDirectoryProvider(resourceName))
        .then((subFolderProvider) => subFolderProvider.createDirectory(id))
        .then(() => id);
    },
    getResourceEntity: (resourceName, id) => {
      return validateName(resourceName)
        .then(() => validateName(id))
        .then(() => fileAdapter.getDirectoryProvider(resourceName))
        .then((resourceFsProvider) => resourceFsProvider.getDirectoryProvider(id))
        .then((entityFsProvider) => entity(entityFsProvider, serializer));
    }
  };
};

module.exports = entity;