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

  describe("Loading content", () => {
    const mock = createEntityWithNewMock();

    it("should load entity's content", () => {
      return mock.load()
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

  describe("Listing resources", () => {
    const mock = createEntityWithNewMock();

    it("should return sub-resources", () => {
      return mock.listResources()
        .then((subResources) => {
            should(subResources).not.be.undefined();
            subResources.should.containEql("subresource1");
            subResources.should.containEql("subresource2");
          }
        );
    });
  });

  describe("Getting resources", () => {
    const entity = createEntityWithNewMock();

    it("should load resource correctly", () => {
      return entity.getResource("subresource1")
        .then((subResourceProvider) => {
          should(subResourceProvider).not.be.undefined();
          subResourceProvider.name.should.equal("subresource1");
          return subResourceProvider.getEntity(1);
        })
        .then((subEntity) => subEntity.load())
        .then((content) => {
          should(content).not.be.undefined();
          content.id.should.equal(11);
          content.content.should.equal("subresource1/1");
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