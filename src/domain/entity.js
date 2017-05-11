const uuid = require("uuid");
const ENTITY_FILENAME = "entity.json";

const entity = (fileAdapter, serializer) => {
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
      return fileAdapter.getDirectoryProvider(resourceName)
        .then((subfolderProvider) => subfolderProvider.listDirectories());
    },
    createResourceEntity: (resourceName) => {
      let id;
      return fileAdapter.createDirectory(resourceName)
        .then(() => {
          return fileAdapter.getDirectoryProvider(resourceName);
        })
        .then((subFolderProvider) => {
          id = uuid() + "-" + uuid();
          return subFolderProvider.createDirectory(id);
        })
        .then(() => {
          return id;
        });
    }
  };
};

module.exports = entity;