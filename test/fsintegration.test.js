const ntt = require("../src/index");
const rmrf = require("rimraf");
const path = require("path");
const fs = require("fs");
const should = require("should");

const prepareTestDir = (directoryPath) => {
  const SEP = path.sep;
  const rootDirectory = `${directoryPath}${SEP}fsIntegrationTest`;
  const resources = {
    rootDirectory: rootDirectory,
    entity: { name: "Tomas" },
    resourcename: `subresource1`,
    resourceentityId: "3242omfo235rt2t",
    resourceentity: { name: "Peter" }
  };

  clearTestDir(rootDirectory);
  fs.mkdirSync(rootDirectory);
  fs.writeFileSync(path.join(rootDirectory, "entity.json"), JSON.stringify(resources.entity));
  fs.mkdirSync(path.join(rootDirectory, resources.resourcename));
  fs.mkdirSync(path.join(rootDirectory, resources.resourcename, resources.resourceentityId));
  fs.writeFileSync(path.join(rootDirectory, resources.resourcename, resources.resourceentityId, "entity.json"), JSON.stringify(resources.resourceentity));
  return resources;
};

const clearTestDir = (rootDirectory) => {
  if (fs.existsSync(rootDirectory)){
    rmrf.sync(rootDirectory);
  }
};

describe("FS Integration test", () => {
  const resources = prepareTestDir("./test");

  const fileAdapter = ntt.adapters.fs(resources.rootDirectory);
  const rootEntity = ntt.entity(fileAdapter);

  it("reads entity correctly", () => {
    return rootEntity.load()
      .then((ent) => {
        should(ent).not.be.undefined();
        ent.name.should.equal(resources.entity.name);
      });
  });

  it("creates resources", () => {
    const RESOURCE_NAME = "myresource";
    const RESOURCE_ENTITY = {
      id: 1,
      name: "YOU"
    };
    return rootEntity.createResource(RESOURCE_NAME)
      .then((resource) => resource.createEntity(RESOURCE_ENTITY.id))
      .then((entity) => entity.save(RESOURCE_ENTITY))
      .then(() => {
        const entityFilename = path.join(resources.rootDirectory, RESOURCE_NAME, `${RESOURCE_ENTITY.id}`, "entity.json");
        fs.existsSync(entityFilename).should.be.true("Entity file was not created");
        const content = fs.readFileSync(entityFilename);
        const deserializedEntity = JSON.parse(content);
        deserializedEntity.id.should.equal(RESOURCE_ENTITY.id);
        deserializedEntity.name.should.equal(RESOURCE_ENTITY.name);
      });
  });

  it("deletes entities", async () => {
    const RESOURCE_NAME = "resource-delete_entity";
    const RESOURCE_ENTITY = {
      id: 1,
      name: "YOU"
    };
    const resource = await rootEntity.createResource(RESOURCE_NAME);
    const entity = await resource.createEntity(RESOURCE_ENTITY.id);
    await entity.save(RESOURCE_ENTITY);
    await resource.deleteEntity(RESOURCE_ENTITY.id);
    const entityFolder = path.join(resources.rootDirectory, RESOURCE_NAME, `${RESOURCE_ENTITY.id}`);
    fs.existsSync(entityFolder).should.be.false("Entity was not deleted");
  });

  it("deletes resources", async () => {
    const RESOURCE_NAME = "resource-delete_resource";
    await rootEntity.createResource(RESOURCE_NAME);
    await rootEntity.deleteResource(RESOURCE_NAME);
    const resourceFolder = path.join(resources.rootDirectory, RESOURCE_NAME);
    fs.existsSync(resourceFolder).should.be.false("Resource was not deleted");
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
      .then((subSubResource) => {
        // Then we branch, and create two entities in that sub-sub-resource
        subSubResource.createEntity(SUBSUBSUBENTITYID1)
        .then((subSubSubEntity1) => {
          subSubSubEntity1.id.should.equal(`${SUBSUBSUBENTITYID1}`);
          ENTITY1.id = subSubSubEntity1.id;
          return subSubSubEntity1.save(ENTITY1);
        });
        subSubResource.createEntity(SUBSUBSUBENTITYID2)
          .then((subSubSubEntity2) => {
            subSubSubEntity2.id.should.equal(`${SUBSUBSUBENTITYID2}`);
            ENTITY2.id = subSubSubEntity2.id;
            return subSubSubEntity2.save(ENTITY2);
          });
      })
      // 2) At this point we created a tree. We start inspecting it.
      .then(() => rootEntity.getResource(RESOURCE))
      .then((resource) => resource.getEntity(subEntityId))
      .then((subEntity) => subEntity.getResource(SUBRESOURCE))
      .then((subResource) => subResource.getEntity(subSubEntityId))
      .then((subSubEntity) => subSubEntity.getResource(SUBSUBRESOURCE))
      .then((subSubResource) => {
        // Then we're back to the branching in the tree so we validate both sides
        subSubResource.getEntity(SUBSUBSUBENTITYID1)
          .then((subresource) => subresource.load())
          .then((content) => {
            content.something.should.equal(ENTITY1.something);
            content.id.should.equal(`${SUBSUBSUBENTITYID1}`);
          });
        subSubResource.getEntity(SUBSUBSUBENTITYID2)
          .then((subresource) => subresource.load())
          .then((content) => {
            content.somethingElse.should.equal(ENTITY2.somethingElse);
            content.id.should.equal(`${SUBSUBSUBENTITYID2}`);
          });
      });
  });

});