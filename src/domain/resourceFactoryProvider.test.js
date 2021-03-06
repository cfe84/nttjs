const should = require("should");
const resourceFactoryProvider = require("./resourceFactoryProvider");
const JSONSerializer = require("../middleware/JSONSerializer");
const { inMemoryFileAdapter, exampleFileStructure } = require("../infrastructure/inMemoryFileAdapter");


describe("Resource provider", () => {

  const entityFactoryProviderStub = (subResources) => (serializer, resourceFactoryProvider) => {
    return {
      create: (fsAdapter) => {
        return {
          directoryName: fsAdapter.directoryName,
          serializer: serializer,
          resourceFactoryProvider: resourceFactoryProvider,
          listResources: async () => subResources
        };
      }
    };
  };

  const createResourceWithNewMock = (subResources) => {
    const fileStructure = exampleFileStructure()
      .directories
      .subresource1;
    const mockProvider = inMemoryFileAdapter(fileStructure);
    const resourceFactory = resourceFactoryProvider(JSONSerializer, entityFactoryProviderStub(subResources));
    const newResource = resourceFactory.create(mockProvider);
    newResource.fileStructure = fileStructure;
    return newResource;
  };

  function validatesId(promiseGenerator) {
    it("should reject incorrect entity id", () => {
      const invalidValue = "something/someone";
      return promiseGenerator(invalidValue).should.be.rejectedWith("File or folder name contains invalid characters");
    });
  }

  describe("Listing entities", () => {
    const resource = createResourceWithNewMock();

    it("should return entities", () => {
      return resource.listEntities()
        .then((entities) => {
            should(entities).not.be.undefined();
            entities.should.containEql("1");
            entities.should.containEql("2");
          }
        );
    });
  });

  describe("Getting entities", () => {
    const resource = createResourceWithNewMock();

    it("should fail on non existing sub entity", () => {
      return resource.getEntity("3434")
        .should.be.rejectedWith("Directory does not exist: 3434");
    });

    it("should load entity correctly", () => {
      return resource.getEntity("1")
        .then((entity) => entity.id.should.equal("1"));
    });

    it("should load entity with numerical id correctly", () => {
      return resource.getEntity(1)
        .then((entity) => entity.id.should.equal("1"));
    });
  });

  describe("Creating entities", () => {
    function testCreatingEntity(specifiedId) {
      const resource = createResourceWithNewMock();
      it("should create correctly", () => {
        return resource.createEntity(specifiedId)
          .then((entity) => {
            should(entity).not.be.undefined();
            const id = entity.id;
            should(id).not.be.undefined();
            if (specifiedId) {
              id.should.equal(`${specifiedId}`);
            } else {
              id.length.should.be.greaterThan(10);
            }
            should(resource.fileStructure.directories[id]).not.be.undefined("Directories[id] is undefined");
            should(resource.fileStructure.directories[id].files["resource.json"]).be.undefined();
            should(entity.directoryName).equal(specifiedId);
            should(entity.serializer).equal(JSONSerializer);
            should(entity.resourceFactoryProvider).equal(resourceFactoryProvider);
          });
      });
    }

    context("create entities with specifying an id", () => {
      testCreatingEntity("newsubresource", "an-ID");
    });

    context("create entities with a numerical id", () => {
      testCreatingEntity("newsubresource", 109);
    });

    const resource = createResourceWithNewMock();
    validatesId(resource.createEntity);
  });

  describe("Iterating entities", () => {
    it("iterates through 2 entities", async () => {
      const resource = createResourceWithNewMock();
      const entities = [];

      const iterator = await resource.iterateEntities();
      while(!(element = await iterator.next()).done) {
        entities.push(element.value);
      }

      entities.length.should.equal(2);
      should(entities[0].id).equal("1");
      entities[0].directoryName.should.equal("1");
      entities[1].id.should.equal("2");
      entities[1].directoryName.should.equal("2");
    });
  });

  describe("Deleting resources", () => {
    it("should not delete existing entities when not empty", async () => {
      // prepare
      const resource = createResourceWithNewMock();
      // run
      return should(resource.delete())
      // assess
        .be.rejectedWith("Resource not empty");
    });
    it("should delete existing resources when empty", async () => {
      // prepare
      const fileStructure = exampleFileStructure();
      fileStructure.directories.subresource1.directories = {};
      const mockProvider = inMemoryFileAdapter(fileStructure);
      const resourceDirProvider = await mockProvider
        .getDirectoryProvider("subresource1");
      const resourceFactory = resourceFactoryProvider(JSONSerializer, entityFactoryProviderStub([]));
      const resource = resourceFactory.create(resourceDirProvider);
      // run
      await resource.delete();
      // assess
      should(fileStructure).not.have.key("subresource1");
    });
  });
});

