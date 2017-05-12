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

  describe("Loading entities", () => {
    it("should load entity's content", () => {
      const mock = createEntityWithNewMock();
      return mock.read()
        .then((entity) => {
          should(entity).not.be.undefined();
          entity.content.should.equal("main entity");
          entity.id.should.equal(1);
        })
        .catch((exception) => {
          should.fail(exception, "no error");
        });
    });
    it("should return sub-resources", () => {
      const mock = createEntityWithNewMock();
      return mock.listResources()
        .then((subResources) => {
            should(subResources).not.be.undefined();
            subResources.should.containEql("subresource1");
            subResources.should.containEql("subresource2");
          }
        )
        .catch((error) => {
          should.fail(error, "no error");
        });
    });
    it("should return sub-resource entities", () => {
      const mock = createEntityWithNewMock();
      const resourceName = "subresource1";
      return mock.listResourceEntities(resourceName)
        .then((entities) => {
            should(entities).not.be.undefined();
            entities.should.containEql("1");
            entities.should.containEql("2");
          }
        )
        .catch((error) => {
          should.fail(error, "no error");
        });
    });
  });
  describe("Saving entities", () => {
    it("should write content correctly", () => {
      const entityProvider = createEntityWithNewMock();
      const value = "rtjkwgelfbmvdlksmfww";
      const key = "something";
      return entityProvider.read()
        .then((entity) => {
          entity[key] = value;
          entityProvider.write(entity);
        })
        .then(() => {
          const file = JSON.parse(entityProvider.fileStructure.files["entity.json"]);
          file[key].should.equal(value);
        })
        .catch((error) => {
          should.fail(error, "no error");
        });
    });

    function testCreatingResourceEntity(resourceName) {
      const entity = createEntityWithNewMock();
      it("should create correctly", () => {
        return entity.createResourceEntity(resourceName)
          .then((id) => {
            should(id).not.be.undefined();
            id.length.should.be.greaterThan(10);
            should(entity.fileStructure.directories[resourceName]).not.be.undefined("Resource is undefined");
            should(entity.fileStructure.directories[resourceName].directories).not.be.undefined("Directories is undefined");
            should(entity.fileStructure.directories[resourceName].directories[id]).not.be.undefined("Directories[id] is undefined");
            should(entity.fileStructure.directories[resourceName].directories[id].files["entity.json"]).be.undefined();
          })
          .catch((exception) => {
            should.fail(exception, "no error");
          });
      });
    }

    context("create entities in existing sub resource", () => {
      testCreatingResourceEntity("subresource1");
    });

    context("create entities in new sub resource", () => {
      testCreatingResourceEntity("newsubresource");
    });
  });
});