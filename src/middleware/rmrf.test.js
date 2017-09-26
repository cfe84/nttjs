const should = require("should");
const rmrf = require("./rmrf");
const {inMemoryFileAdapter, exampleFileStructure} = require("../infrastructure/inMemoryFileAdapter");

describe("rmrf directories", async () => {
  // prepare
  const DELETED_RESOURCE = "subresource1";
  const NON_DELETED_RESOURCE = "subresource2";
  const fileStructure = exampleFileStructure();
  fileStructure.directories[DELETED_RESOURCE].files["something.json"] = "balflkslfksflsk";
  const directoryProvider = inMemoryFileAdapter(fileStructure, fileStructure);
  const deletedResourceBackup = fileStructure.directories[DELETED_RESOURCE];

  before(async () => {
    // execute
    const subDir = await directoryProvider.getDirectoryProvider(DELETED_RESOURCE);
    await rmrf(subDir);
  });

  it("deletes sub-directories", () => {
    Object.keys(deletedResourceBackup.directories).should.be.empty();
  });
  it("deletes files", () => {
    Object.keys(deletedResourceBackup.files).should.be.empty();
  });
  it("deletes root directory", () => {
    fileStructure.directories.should.not.have.ownProperty(DELETED_RESOURCE);
  });
  it("doesn't delete upstage of root directory", () => {
    should(fileStructure.directories[NON_DELETED_RESOURCE]).not.be.undefined();
    Object.keys(fileStructure.directories[NON_DELETED_RESOURCE].directories).should.have.length(1);
    Object.keys(fileStructure.directories).should.have.length(1);
  });
});