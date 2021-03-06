const should = require("should");
const entityFactoryProvider = require("./entityFactoryProvider");
const JSONSerializer = require("../middleware/JSONSerializer");
const { inMemoryFileAdapter, exampleFileStructure } = require("../infrastructure/inMemoryFileAdapter");

describe("Entities", () => {
  const resourceFactoryProviderStub = (entities) => (serializer, entityFactoryProvider) => {
    return {
      create: (fsAdapter) => {
        return {
          listEntities: async () => {
            return entities
          },
          directoryName: fsAdapter.directoryName,
          serializer: serializer,
          entityFactoryProvider: entityFactoryProvider
        };
      }
    };
  };
  const createEntityWithNewMock = (entities) => {
    const fileStructure = exampleFileStructure();
    const mockProvider = inMemoryFileAdapter(fileStructure);
    const entityFactory = entityFactoryProvider(JSONSerializer, resourceFactoryProviderStub(entities));
    const newEntity = entityFactory.create(mockProvider);
    newEntity.fileStructure = fileStructure;
    return newEntity;
  };

  function validatesResourceName(promiseGenerator) {
    it("should reject incorrect resource name", () => {
      const invalidValue = "something/someone";
      return promiseGenerator(invalidValue).should.be.rejectedWith("File or folder name contains invalid characters");
    });
  }

  describe("Loading content", () => {
    const entity = createEntityWithNewMock();

    it("should load entity's content", () => {
      return entity.load()
        .then((entity) => {
          should(entity).not.be.undefined();
          entity.content.should.equal("main entity");
          entity.id.should.equal(1);
        });
    });
  });

  describe("Saving content", () => {

    it("should save content correctly", () => {
      const entityProvider = createEntityWithNewMock();
      const value = "rtjkwgelfbmvdlksmfww";
      const key = "something";
      return entityProvider.load()
        .then((entity) => {
          entity[key] = value;
          entityProvider.save(entity);
        })
        .then(() => {
          const encodedFile = entityProvider.fileStructure.files["entity.json"];
          const file = JSON.parse(encodedFile);
          file[key].should.equal(value);
        });
    });

    it("should not save empty content", () => {
      const entityProvider = createEntityWithNewMock();
      return entityProvider.load()
        .then(() => entityProvider.save())
        .should.be.rejectedWith("Cannot save empty content");
    });

  });

  describe("Listing resources", () => {
    const entity = createEntityWithNewMock();

    it("should return sub-resources", () => {
      return entity.listResources()
        .then((subResources) => {
            should(subResources).not.be.undefined();
            subResources.should.containEql("subresource1");
            subResources.should.containEql("subresource2");
          }
        );
    });
  });

  describe("Deleting entities", () => {
    it("should not delete existing entities when not empty", async () => {
      // Prepare
      const entity = createEntityWithNewMock(["blerh"]);
      const EXISTING_SUBRESOURCE = "subresource1";

      // Run
      await entity.delete()

      // Assess
        .should.be.rejectedWith("Entity not empty");
      let subResources = await entity.listResources();
      subResources.should.containEql(EXISTING_SUBRESOURCE);
    });

    it("should delete entities when empty", async () => {
      // Prepare
      const fileStructure = exampleFileStructure();
      const mockProvider = inMemoryFileAdapter(fileStructure);
      const subresourceFolder = await mockProvider.getDirectoryProvider("subresource2");
      const entityFolder = await subresourceFolder.getDirectoryProvider("1");
      const entityFactory = entityFactoryProvider(JSONSerializer, resourceFactoryProviderStub([]));
      const entity = entityFactory.create(entityFolder);
        // empty folder
      let subResources = await entity.listResources();
      should(subResources).be.empty();

      // Run
      await entity.delete();

      // Assess
      (await subresourceFolder.listDirectories()).should.be.empty();
    });
  });

  describe("Iterating resources", () => {
    it("iterates through 2 resources", async () => {
      const entity = createEntityWithNewMock();
      const resources = [];

      const iterator = await entity.iterateResources();
      while(!(element = await iterator.next()).done) {
        resources.push(element.value);
      }

      resources.length.should.equal(2);
      should(resources[0].name).equal("subresource1");
      resources[0].directoryName.should.equal("subresource1");
      resources[1].name.should.equal("subresource2");
      resources[1].directoryName.should.equal("subresource2");
    });
  });

  describe("Getting resources", () => {
    const entity = createEntityWithNewMock();

    it("should load resource correctly", () => {
      return entity.getResource("subresource1")
        .then((resource) => {
          should(resource).not.be.undefined();
          should(resource.name).equal("subresource1");
          resource.serializer.should.equal(JSONSerializer);
          resource.entityFactoryProvider.should.equal(entityFactoryProvider);
        });
    });

    it("should fail on non existing sub resource", () => {
      return entity.getResource("subresource2324524")
        .should.be.rejectedWith("Directory does not exist: subresource2324524");
    });
  });

  describe("Creating sub resources", () => {
    function testCreatingResource(resourceName) {
      const entity = createEntityWithNewMock();
      it("should create correctly", () => {
        return entity.createResource(resourceName)
          .then((provider) => {
            should(provider).not.be.undefined();
            const name = provider.name;
            should(name).not.be.undefined();
            should(entity.fileStructure.directories[resourceName]).not.be.undefined("Resource is undefined");
            should(entity.fileStructure.directories[resourceName].directories).not.be.undefined("Directories is undefined");
          });
      });
    }

    describe("validates parameters", () => {
      const entity = createEntityWithNewMock();
      validatesResourceName(entity.createResource);
    });

    context("create existing sub resource without breaking", () => {
      testCreatingResource("subresource1");
    });

    context("create new sub resource", () => {
      testCreatingResource("newsubresource");
    });
  });
});