const should = require("should");
const filenameValidator = require("../src/middleware/noSpecialCharsFilenameValidator");

/**
 *
 * @param files
 * @param directories
 * @returns {{readFile: (function(*)), writeFile: (function(*, *)), listFiles: (function()), listDirectories: (function()), getDirectoryProvider: (function(*)), createDirectory: (function(*))}}
 */
const mockFileAdapter  = ({files = {}, directories = {}}) => {
  return {
    readFile: (fileName) => {
      return new Promise((resolve, reject) => {
        if (fileName in files) {
          resolve(files[fileName]);
        }
        else {
          reject(Error(`File does not exist: ${fileName}`));
        }
      });
    },
    writeFile: (fileName, content) => {
      return new Promise((resolve, reject) => {
        files[fileName] = content;
        resolve();
      });
    },
    listFiles: () => {
      return new Promise((resolve, reject) => {
        const fileNames = [];
        for(const fileName in files) {
          fileNames.push(fileName);
        }
        resolve(fileNames);
      });
    },
    listDirectories: () => {
      return new Promise((resolve) => {
        const subDirectories = [];
        for(const subDirectory in directories) {
          subDirectories.push(subDirectory);
        }
        resolve(subDirectories);
      });
    },
    getDirectoryProvider: (directoryName) => {
      return new Promise((resolve, reject) => {
        if (directoryName in directories) {
          const adapter = mockFileAdapter(directories[directoryName]);
          adapter.directoryName = directoryName;
          resolve(adapter);
        }
        else {
          reject(Error(`Directory does not exist: ${directoryName}`));
        }
      });
    },
    createDirectory: (directoryName) => {
      return new Promise((resolve, reject) => {
        if(!directories[directoryName]){
          directories[directoryName] = {
            files: {},
            directories: {}
          };
        }
        resolve();
      });
    },
    validate: (folderName) => {
      return new Promise((resolve, reject) => {
        if (filenameValidator.validate(folderName)) {
          resolve();
        }
        else {
          reject(Error("Invalid identifier: " + folderName));
        }
      });
    }
  };
};


const entity = (id, content) => {
  return JSON.stringify({
    id: id,
    content: content
  });
};

const exampleFileStructure = () => {
  return {
    files: {
      "entity.json": entity(1, "main entity")
    },
    directories: {
      "subresource1": {
        directories: {
          "1": {
            files: {
              "entity.json": entity(11, "subresource1/1")
            }
          },
          "2": {
            files: {
              "entity.json": entity(12, "subresource1/2")
            }
          }
        }
      },
      "subresource2": {
        directories: {
          "1": {
            files: {
              "entity.json": entity(21, "subresource2/1")
            }
          }
        }
      }
    }
  };
};

describe("Mock file provider self diagnostic", () => {
  describe("Files", () => {
    it("should load", (done) => {
      const fileStructure = exampleFileStructure();
      const provider = mockFileAdapter(fileStructure);
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
      const provider = mockFileAdapter(fileStructure);
      function testWriting(fileName, content) {
        provider.writeFile(fileName, content).should.not.be.rejected();
        should(fileStructure.files[fileName]).be.equal(content);
      }
      it("should save", () => {
        testWriting("entity2.json", "tgjwroitjgeofjv02gwi0v0wmrw");
      });
      it("should be able to overwrite content", () => {
        testWriting("entity.json", "wr2409mvfm929mf2e9f029m");
      });
    });

    it("should list files", (done) => {
      const fileStructure = exampleFileStructure();
      const provider = mockFileAdapter(fileStructure);
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
      const provider = mockFileAdapter(fileStructure);
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
      const provider = mockFileAdapter(fileStructure);
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
      it("should create subdirs", () => {
        const fileStructure = exampleFileStructure();
        const provider = mockFileAdapter(fileStructure);
        const directoryName = "testDir";
        should(provider.createDirectory(directoryName)).not.be.rejected();
        should(fileStructure.directories[directoryName]).not.be.undefined();
        fileStructure.directories[directoryName].files.should.not.be.undefined();
        fileStructure.directories[directoryName].directories.should.not.be.undefined();
      });
      it("should not overwrite subdirs", () => {
        const fileStructure = exampleFileStructure();
        const provider = mockFileAdapter(fileStructure);
        const directoryName = "subresource1";
        should(provider.createDirectory(directoryName)).not.be.rejected();
        should(fileStructure.directories[directoryName]).not.be.undefined();
        fileStructure.directories[directoryName].directories["1"].should.not.be.undefined();
      });
    });
  });

});

module.exports = {
  mockFileAdapter: mockFileAdapter,
  exampleFileStructure: exampleFileStructure
};