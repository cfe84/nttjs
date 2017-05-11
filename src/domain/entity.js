const uuid = require("uuid");
const ENTITY_FILENAME = "entity.json";

const entity = (fileProvider, serializer) => {
  return {
    read: () => {
      return fileProvider.readFile(ENTITY_FILENAME)
        .then((content) => {
          return serializer.deserialize(content);
        });
    },
    write: (content) => {
      const serializedContent = serializer.serialize(content);
      return fileProvider.writeFile(ENTITY_FILENAME, serializedContent);
    },
    listResources: () => {
      return fileProvider.listDirectories();
    },
    listResourceEntities: (resourceName) => {
      return fileProvider.getDirectoryProvider(resourceName)
        .then((subfolderProvider) => subfolderProvider.listDirectories());
    },
    createResourceEntity: (resourceName) => {
      let id;
      return fileProvider.createDirectory(resourceName)
        .then(() => {
          return fileProvider.getDirectoryProvider(resourceName);
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