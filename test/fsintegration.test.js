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

  const entity = ntt.ntt(ntt.adapters.fs(resources.rootDirectory));

  it("reads entity correctly", () => {
    return entity.load()
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
    return entity.createResourceEntity(RESOURCE_NAME, RESOURCE_ENTITY.id)
      .then((resource) => resource.save(RESOURCE_ENTITY))
      .then(() => {
        const entityFilename = path.join(resources.rootDirectory, RESOURCE_NAME, `${RESOURCE_ENTITY.id}`, "entity.json");
        fs.existsSync(entityFilename).should.be.true("Entity file was not created");
        const content = fs.readFileSync(entityFilename);
        const deserializedEntity = JSON.parse(content);
        deserializedEntity.id.should.equal(RESOURCE_ENTITY.id);
        deserializedEntity.name.should.equal(RESOURCE_ENTITY.name);
      });
  });

  it("creates complex stuff", () => {
    const RESOURCE = "hello";
    const SUBRESOUCE = "hi";
    const SUBSUBRESOUCE = "YO";
    const ENTITY1 = {
      something: "HEY"
    };
    const ENTITY2 = {
      somethingElse: "HEY"
    };
    const SUBSUBRESOURCEID1 = 4;
    const SUBSUBRESOURCEID2 = "jerwijrw";
    let resourceID, subresourceid;

    return entity.createResourceEntity(RESOURCE)
      .then((subresourceProvider) => {
        resourceID = subresourceProvider.id;
        return subresourceProvider.createResourceEntity(SUBRESOUCE);
      })
      .then((subresourceProvider) => {
        subresourceid = subresourceProvider.id;
        subresourceProvider.createResourceEntity(SUBSUBRESOUCE, SUBSUBRESOURCEID1)
          .then((subresourceProvider) => {
            subresourceProvider.id.should.equal(`${SUBSUBRESOURCEID1}`);
            ENTITY1.id = subresourceProvider.id;
            return subresourceProvider.save(ENTITY1);
          });
        subresourceProvider.createResourceEntity(SUBSUBRESOUCE, SUBSUBRESOURCEID2)
          .then((subresourceProvider) => {
            subresourceProvider.id.should.equal(`${SUBSUBRESOURCEID2}`);
            ENTITY2.id = subresourceProvider.id;
            return subresourceProvider.save(ENTITY2);
          });
      })
      .then(() => entity.getResourceEntity(RESOURCE, resourceID))
      .then((subresource) => subresource.getResourceEntity(SUBRESOUCE, subresourceid))
      .then((subresource) => subresource.getResourceEntity(SUBSUBRESOUCE, SUBSUBRESOURCEID1))
      .then((subresource) => subresource.load())
      .then((content) => {
        content.something.should.equal(ENTITY1.something);
        content.id.should.equal(`${SUBSUBRESOURCEID1}`);
      });
  });

});