const should = require("should");
const entity = require("./entity");
const JSONSerializer = require("../middleware/JSONSerializer");

const { mockFileAdapter, exampleFileStructure } = require("../../test/mockFileAdapter");

describe("Entities", () => {
  const createEntityWithNewMock = () => {
    const fileStructure = exampleFileStructure();
    const mockProvider = mockFileAdapter(fileStructure);
    const newEntity = entity(mockProvider, JSONSerializer);
    newEntity.fileStructure = fileStructure;
    return newEntity;
  };


  function validatesResourceName(promiseGenerator) {
    it("should reject incorrect resource name", () => {
      const invalidValue = "something/someone";
      return promiseGenerator(invalidValue).should.be.rejectedWith(`Invalid identifier: ${invalidValue}`);
    });
  }

  function validatesId(promiseGenerator) {
    it("should reject incorrect entity id", () => {
      const invalidValue = "something/someone";
      return promiseGenerator("sdfsdfs", invalidValue).should.be.rejectedWith(`Invalid identifier: ${invalidValue}`);
    });
  }

  const validatesResourceNameAndId = (promiseGenerator) => {
    validatesResourceName(promiseGenerator);
    validatesId(promiseGenerator);
  };

  describe("Loading entities", () => {
    const mock = createEntityWithNewMock();
    it("should load entity's content", () => {
      return mock.load()
        .then((entity) => {
          should(entity).not.be.undefined();
          entity.content.should.equal("main entity");
          entity.id.should.equal(1);
        });
    });
    it("should return sub-resources", () => {
      return mock.listResources()
        .then((subResources) => {
            should(subResources).not.be.undefined();
            subResources.should.containEql("subresource1");
            subResources.should.containEql("subresource2");
          }
        );
    });

    validatesResourceName(mock.listResourceEntities);

    it("should return sub-resource entities", () => {
      const resourceName = "subresource1";
      return mock.listResourceEntities(resourceName)
        .then((entities) => {
            should(entities).not.be.undefined();
            entities.should.containEql("1");
            entities.should.containEql("2");
          }
        );
    });
  });

  describe("Saving entities", () => {
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
          const file = JSON.parse(entityProvider.fileStructure.files["entity.json"]);
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

  describe("Saving sub entities", () => {
    function testCreatingResourceEntity(resourceName, specifiedId) {
      const entity = createEntityWithNewMock();
      it("should create correctly", () => {
        return entity.createResourceEntity(resourceName, specifiedId)
          .then((provider) => {
            should(provider).not.be.undefined();
            const id = provider.id;
            should(id).not.be.undefined();
            if (specifiedId) {
              id.should.equal(`${specifiedId}`);
            } else {
              id.length.should.be.greaterThan(10);
            }
            should(entity.fileStructure.directories[resourceName]).not.be.undefined("Resource is undefined");
            should(entity.fileStructure.directories[resourceName].directories).not.be.undefined("Directories is undefined");
            should(entity.fileStructure.directories[resourceName].directories[id]).not.be.undefined("Directories[id] is undefined");
            should(entity.fileStructure.directories[resourceName].directories[id].files["entity.json"]).be.undefined();
            return provider.load();
          })
          .should.be.rejectedWith("File does not exist: entity.json");
      });
    }

    describe("validates parameters", () => {
      const entity = createEntityWithNewMock();
      validatesResourceNameAndId(entity.createResourceEntity);
    });

    context("create entities in existing sub resource", () => {
      testCreatingResourceEntity("subresource1");
    });

    context("create entities in new sub resource", () => {
      testCreatingResourceEntity("newsubresource");
    });

    context("create entities with specifying an id", () => {
      testCreatingResourceEntity("newsubresource", "an-ID");
    });

    context("create entities with a numerical id", () => {
      testCreatingResourceEntity("newsubresource", 109);
    });
  });

  describe("navigate to sub resources", () => {
    const entity = createEntityWithNewMock();
    it("should load entity correctly", () => {
      return entity.getResourceEntity("subresource1", 1)
        .then((subEntityProvider) => {
          should(subEntityProvider).not.be.undefined();
          subEntityProvider.id.should.equal("1");
          return subEntityProvider.load();
        })
        .then((subEntity) => {
          should(subEntity).not.be.undefined();
          subEntity.id.should.equal(11);
          subEntity.content.should.equal("subresource1/1");
        });
    });
    validatesResourceNameAndId(entity.getResourceEntity);
    it("should fail on non existing sub resource", () => {
      return entity.getResourceEntity("subresource2324524", "1342")
        .should.be.rejectedWith("Directory does not exist: subresource2324524");
    });
    it("should fail on non existing sub entity", () => {
      return entity.getResourceEntity("subresource1", "3434")
        .should.be.rejectedWith("Directory does not exist: 3434");
    });
  });
});