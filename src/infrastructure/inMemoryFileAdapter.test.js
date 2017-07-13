const should = require("should");
const {inMemoryFileAdapter, exampleFileStructure} = require("./inMemoryFileAdapter");

describe("Mock file provider self diagnostic", () => {
  describe("Files", () => {
    it("should load", (done) => {
      const fileStructure = exampleFileStructure();
      const provider = inMemoryFileAdapter(fileStructure);
      provider.readFile("entity.json")
        .then((entity) => {
          const parsedEntity = JSON.parse(entity);
          parsedEntity.id.should.equal(1);
          done();
        })
        .catch((error) => should.fail(error, "no error"));
    });
    context("Writing", () => {
      const fileStructure = exampleFileStructure();
      const provider = inMemoryFileAdapter(fileStructure);
      function testWriting(fileName, content) {
        provider.writeFile(fileName, content).should.not.be.rejected();
        should(fileStructure.files[fileName]).be.equal(content);
      }
      it("should save", () => {
        return testWriting("entity2.json", "tgjwroitjgeofjv02gwi0v0wmrw");
      });
      it("should be able to overwrite content", () => {
        return testWriting("entity.json", "wr2409mvfm929mf2e9f029m");
      });
      it("should delete file", () => {
        const fileName = "entity.json";
        return provider.listFiles()
          .then((files) => files.should.containEql(fileName))
          .then(() => provider.deleteFile(fileName))
          .then(() => provider.listFiles())
          .then((files) => files.should.not.containEql(fileName));
      })
    });

    it("should list files", (done) => {
      const fileStructure = exampleFileStructure();
      const provider = inMemoryFileAdapter(fileStructure);
      provider.listFiles()
        .then((files) => {
          files.length.should.equal(1);
          files[0].should.equal("entity.json");
          done();
        })
        .catch((error) => {
          should.fail(error, "no error");
        });
    });
  });
  describe("Directories", () => {
    it("should list subdirs", (done) => {
      const fileStructure = exampleFileStructure();
      const provider = inMemoryFileAdapter(fileStructure);
      provider.listDirectories()
        .then((subDirectories) => {
          subDirectories.length.should.equal(2);
          subDirectories[0].should.equal("subresource1");
          subDirectories[1].should.equal("subresource2");
          done();
        })
        .catch((error) => {
          should.fail(error, "no error");
        });
    });
    it("should go into subdirs", (done) => {
      const fileStructure = exampleFileStructure();
      const provider = inMemoryFileAdapter(fileStructure);
      provider.getDirectoryProvider("subresource1")
        .then((directory) => {
          return directory.listDirectories();
        })
        .then((subDirectories) => {
          subDirectories.length.should.equal(2);
          subDirectories[0].should.equal("1");
          subDirectories[1].should.equal("2");
          done();
        })
        .catch((error) => {
          should.fail(error, "no error");
        });
    });
    context("creating subdirs", () => {
      it("should create and delete subdirs", () => {
        const fileStructure = exampleFileStructure();
        const provider = inMemoryFileAdapter(fileStructure);
        const directoryName = "testDir";
        should(provider.createDirectory(directoryName)).not.be.rejected();
        should(fileStructure.directories[directoryName]).not.be.undefined();
        fileStructure.directories[directoryName].files.should.not.be.undefined();
        fileStructure.directories[directoryName].directories.should.not.be.undefined();
        should(provider.deleteDirectory(directoryName)).not.be.rejected();
        should(fileStructure.directories[directoryName]).be.undefined();
      });
      it("should not overwrite subdirs", () => {
        const fileStructure = exampleFileStructure();
        const provider = inMemoryFileAdapter(fileStructure);
        const directoryName = "subresource1";
        should(provider.createDirectory(directoryName)).not.be.rejected();
        should(fileStructure.directories[directoryName]).not.be.undefined();
        fileStructure.directories[directoryName].directories["1"].should.not.be.undefined();
      });
    });
  });

});