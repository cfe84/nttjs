const should = require("should");
const resourceProvider = require("./resource");
const JSONSerializer = require("../middleware/JSONSerializer");
const { mockFileAdapter, exampleFileStructure } = require("../../test/mockFileAdapter");


describe("Resource provider", () => {

  const createResourceWithNewMock = () => {
    const fileStructure = exampleFileStructure()
      .directories
      .subresource1;
    const mockProvider = mockFileAdapter(fileStructure);
    const newResource = resourceProvider(mockProvider, JSONSerializer);
    newResource.fileStructure = fileStructure;
    return newResource;
  };

  function validatesId(promiseGenerator) {
    it("should reject incorrect entity id", () => {
      const invalidValue = "something/someone";
      return promiseGenerator(invalidValue).should.be.rejectedWith(`Invalid identifier: ${invalidValue}`);
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
          .then((provider) => {
            should(provider).not.be.undefined();
            const id = provider.id;
            should(id).not.be.undefined();
            if (specifiedId) {
              id.should.equal(`${specifiedId}`);
            } else {
              id.length.should.be.greaterThan(10);
            }
            should(resource.fileStructure.directories[id]).not.be.undefined("Directories[id] is undefined");
            should(resource.fileStructure.directories[id].files["resource.json"]).be.undefined();
            return provider.load();
          })
          .should.be.rejectedWith("File does not exist: entity.json");
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

});

