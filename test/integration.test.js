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
      .then((resource) => resource.write(RESOURCE_ENTITY))
      .then(() => {
        const entityFilename = path.join(resources.rootDirectory, RESOURCE_NAME, RESOURCE_ENTITY.id, "entity.json");
        fs.existsSync(entityFilename).should.be.true("Entity file was not created");
      });
  });

});