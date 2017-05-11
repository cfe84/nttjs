const should = require("should");
const entity = require("./entity");

const { mockFileProvider, exampleFileStructure } = require("../../test/mockFileProvider");

describe("Entities", () => {
  const createEntityWithNewMock = () => {
    const fileStructure = exampleFileStructure();
    const mockProvider = mockFileProvider(fileStructure);
    const newEntity = entity(mockProvider);
    newEntity.fileStructure = fileStructure;
    return newEntity;
  };

  describe("Loading entities", () => {
    it("should load entity's content", () => {
      const mock = createEntityWithNewMock();
      should(mock.entity).not.be.undefined();
      mock.entity.content.should.equal("main entity");
      mock.entity.id.should.equal(1);
    });
    it("should return sub-resources", () => {
      const mock = createEntityWithNewMock();
      mock.listResources()
        .then((subResources) => {
            should(subResources).not.be.undefined();
            should(subResources["subresource1"]).not.be.undefined();
            should(subResources["subresource2"]).not.be.undefined();
          }
        )
        .catch((error) => {
          should.fail(error, "no error");
        });
    });
  });
  describe("Saving entities", () => {
    it("should save content correctly", () => {
      const mock = createEntityWithNewMock();
      const value = "rtjkwgelfbmvdlksmfww";
      mock.entity.something = value;
      mock.save();
      mock.fileStructure.files["entity.json"].something.should.equal(value);
    });
    function testCreatingSubResource(resourceName) {
      const mock = createEntityWithNewMock();
      mock.createSubResourceEntity(resourceName)
        .then((id) => {
          it("should create a new id", () => {
            should(id).not.be.undefined();
            id.length.should.be.greaterThan(10);
          });
          it("should have created resource if not existing", () => {
            should(mock.fileStructure[resourceName]).not.be.undefined();
            should(mock.fileStructure[resourceName].directories).not.be.undefined();
          });
          it("should add entity subfolder", () => {
            should(mock.fileStructure[resourceName].directories[id]).not.be.undefined();
          });
          it("should not create entity file yet", () => {
            should(mock.fileStructure[resourceName].directories[id].files["entity.json"]).be.undefined();
          });
        })
        .catch((exception) => {
          should.fail(exception, "no error");
        });
    }

    context("create entities in existing sub resource", () => {
      testCreatingSubResource("subresource1");
    });

    context("create entities in new sub resource", () => {
      testCreatingSubResource("newsubresource");
    });
  });
});