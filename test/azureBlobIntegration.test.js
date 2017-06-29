const azure = require("azure-storage");
const should = require("should");
const ntt = require("../src/index");

const TEST_CONTAINER = "ntttest";

const config = {
  account: process.env.AZURE_STORAGE_ACCOUNT,
  key: process.env.AZURE_STORAGE_KEY
};

const clearTestContainer = (config, callback) => {
  const blobService = azure.createBlobService(config.account, config.key);
  const options = {useFlatBlobListing: true};
  blobService.listBlobsSegmented(TEST_CONTAINER, null, options, (error, result) => {
    if (error) {
      throw error;
    }
    let i = result.entries.length;
    if (i === 0) {
      return callback();
    }
    result.entries.forEach((blob) => {
      blobService.deleteBlobIfExists(TEST_CONTAINER, blob.name, (error, result) => {
        if (--i <= 0) {
          callback();
        }
      });
    });
  });
};

// TODO: Factor that with the fsIntegration tests.
describe("Azure end to end integration test", () => {
  before((done) => clearTestContainer(config, done));

  const fileAdapter = ntt.adapters.azure(config, TEST_CONTAINER);
  const rootEntity = ntt.entity(fileAdapter);

  it("creates resources and reads correctly", () => {
    const RESOURCE_NAME = "myresource";
    const RESOURCE_ENTITY = {
      id: 1,
      name: "YOU"
    };
    return rootEntity.createResource(RESOURCE_NAME)
      .then((resource) => resource.createEntity(RESOURCE_ENTITY.id))
      .then((entity) => entity.save(RESOURCE_ENTITY))
      .then(() => rootEntity.getResource(RESOURCE_NAME))
      .then((resource) => resource.getEntity(RESOURCE_ENTITY.id))
      .then((entity) => entity.load())
      .then((ent) => {
        should(ent).not.be.undefined();
        ent.name.should.equal(RESOURCE_ENTITY.name);
      });
  });

  it("creates complex stuff", () => {
    const RESOURCE = "hello";
    const SUBRESOURCE = "hi";
    const SUBSUBRESOURCE = "YO";
    const ENTITY1 = {
      something: "HEY"
    };
    const ENTITY2 = {
      somethingElse: "HEY"
    };
    const SUBSUBSUBENTITYID1 = 4;
    const SUBSUBSUBENTITYID2 = "jerwijrw";
    let subEntityId, subSubEntityId;

    /*
     Works in two steps.
     1) Create this tree:

     rootEntity
     |_> RESOURCE
     |_> subEntity
     |_> SUBRESOURCE
     |_> subSubEntity
     |_> SUBSUBRESOURCE
     |_> subSubSubEntity1
     |_> subSubSubEntity2

     2) Inspect the result of that creation.
     */

    // 1) Create the tree
    return rootEntity.createResource(RESOURCE)
    // Create entity in RESOURCE without specifying an id
      .then((resource) => resource.createEntity())
      .then((subEntity) => {
        subEntityId = subEntity.id;
        // Create a sub-resource in that sub entity
        return subEntity.createResource(SUBRESOURCE);
      })
      // Then create an entity in RESOURCE/SUBENTITY/SUBRESOURCE
      .then((subResource) => subResource.createEntity())
      .then((subSubEntity) => {
        subSubEntityId = subSubEntity.id;
        // Then we create a sub-sub-resource in RESOURCE/SUBENTITY/SUBRESOURCE/SUBSUBENTITY/
        return subSubEntity.createResource(SUBSUBRESOURCE);
      })
      .then((subSubResource) =>
        // Then we branch, and create two entities in that sub-sub-resource
        subSubResource.createEntity(SUBSUBSUBENTITYID1)
          .then((subSubSubEntity1) => {
            subSubSubEntity1.id.should.equal(`${SUBSUBSUBENTITYID1}`);
            ENTITY1.id = subSubSubEntity1.id;
            return subSubSubEntity1.save(ENTITY1);
          })
          .then(() => subSubResource.createEntity(SUBSUBSUBENTITYID2)
            .then((subSubSubEntity2) => {
              subSubSubEntity2.id.should.equal(`${SUBSUBSUBENTITYID2}`);
              ENTITY2.id = subSubSubEntity2.id;
              return subSubSubEntity2.save(ENTITY2);
            })
          )
      )
      // 2) At this point we created a tree. We start inspecting it.
      .then(() => rootEntity.getResource(RESOURCE))
      .then((resource) => resource.getEntity(subEntityId))
      .then((subEntity) => subEntity.getResource(SUBRESOURCE))
      .then((subResource) => subResource.getEntity(subSubEntityId))
      .then((subSubEntity) => subSubEntity.getResource(SUBSUBRESOURCE))
      .then((subSubResource) =>
        // Then we're back to the branching in the tree so we validate both sides
        subSubResource.getEntity(SUBSUBSUBENTITYID1)
          .then((subresource) => subresource.load())
          .then((content) => {
            content.something.should.equal(ENTITY1.something);
            content.id.should.equal(`${SUBSUBSUBENTITYID1}`);
          })
          .then(() => subSubResource.getEntity(SUBSUBSUBENTITYID2)
            .then((subresource) => subresource.load())
            .then((content) => {
              content.somethingElse.should.equal(ENTITY2.somethingElse);
              content.id.should.equal(`${SUBSUBSUBENTITYID2}`);
            })
        )
      );
  });
});