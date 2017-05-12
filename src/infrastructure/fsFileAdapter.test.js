const should = require("should");
const fs = require("fs");
const path = require("path");
const rmrf = require("rimraf");
const fileAdapter = require("./fsFileAdapter");

const prepareTestDir = (directoryPath) => {
  const SEP = path.sep;
  const rootDirectory = `${directoryPath}${SEP}fsFileAdapterTest`;
  const filesAndDirs = {
    rootDirectory: rootDirectory,
    file1: {
      name: "entity1.json",
      path: `${rootDirectory}${SEP}entity1.json`,
      content: "sdoifj204gvfe f 2e9fj v fe"
    },
    file2: {
      name: "entity2.json",
      path: `${rootDirectory}${SEP}entity2.json`,
      content: "2ijrfwlv sq0efm2mvvcok mv09 fd m"
    },
    nonexistingfile: {
      name: "entity3.json",
      path:`${rootDirectory}${SEP}entity3.json`,
      content: null
    },
    dir1: `${rootDirectory}${SEP}subdir1`,
    dir1name: `subdir1`,
    dir2: `${rootDirectory}${SEP}subdir2`,
    dir2name: `subdir2`,
    dir1file: {
      name: "subfile",
      path: `${rootDirectory}${SEP}subdir1${SEP}subfile`,
      content: "dspm22- 0wd -20 md 02mrvfm om2092rv0- fm"
    },
    nonexistingdir: `${rootDirectory}${SEP}subdir3`,
    nonexistingdirfile: `subdir3`,
  };

  clearTestDir(rootDirectory);
  fs.mkdirSync(rootDirectory);
  fs.writeFileSync(filesAndDirs.file1.path, filesAndDirs.file1.content);
  fs.writeFileSync(filesAndDirs.file2.path, filesAndDirs.file2.content);
  if (fs.existsSync(filesAndDirs.nonexistingfile)) {
    fs.unlinkSync(filesAndDirs.nonexistingfile);
  }
  fs.mkdirSync(filesAndDirs.dir1);
  fs.writeFileSync(filesAndDirs.dir1file.path, filesAndDirs.dir1file.content);
  fs.mkdirSync(filesAndDirs.dir2);
  return filesAndDirs;
};

const clearTestDir = (rootDirectory) => {
  if (fs.existsSync(rootDirectory)){
    rmrf.sync(rootDirectory);
  }
};

const FOLDER = "test";

const getFreshFileStructureAndAdapter = () => {
  const filesAndDirectories = prepareTestDir(FOLDER);
  const adapter = fileAdapter(filesAndDirectories.rootDirectory);
  return { adapter, filesAndDirectories };
};

describe("File system file adapter", () => {
  describe("Read files", () => {
    const { adapter, filesAndDirectories } = getFreshFileStructureAndAdapter();
    it("reads existing file content", () => {
      return adapter.readFile(filesAndDirectories.file1.name)
        .then((content) => should(content).equal(filesAndDirectories.file1.content));
    });
    it("rejects on non-existing file", () => {
      return adapter.readFile(filesAndDirectories.nonexistingfile.name)
        .then((content) => should.fail(content, "error expected"))
        .catch((error) => should(error).not.be.undefined());
    });
  });
  describe("List files", () => {
    const { adapter, filesAndDirectories } = getFreshFileStructureAndAdapter();
    it("lists files in the directory", () => {
      return adapter.listFiles()
        .then((files) => {
          should(files).not.be.undefined();
          files.length.should.be.equal(2);
          files.should.containEql(filesAndDirectories.file1.name);
          files.should.containEql(filesAndDirectories.file2.name);
        });
    });
    it("rejects on directory not existing", () => {
      return adapter.listFiles()
        .then((files) => should.fail(files, "error expected"))
        .catch((error) => should(error).not.be.undefined());
    });
  });
  describe("Write files", () => {
    const { adapter, filesAndDirectories } = getFreshFileStructureAndAdapter();
    it("writes new file", () => {
      const fileName = "dfnkjsnfuewnre.txt";
      const content = "sfjiwnwvrvien";
      return adapter.writeFile(fileName, content)
        .then(() => {
          const verifyContent = fs.readFileSync(path.join(filesAndDirectories.rootDirectory, fileName));
          should(verifyContent).not.be.undefined();
          ("" + verifyContent).should.equal(content);
        });
    });
    it("over-writes existing file", () => {
      const content = "sdfjgnwi w9eqfjwmvw d9vw9 vmwd9v w90e0f wisdvnm iwqa,cskvns knvw kn";
      return adapter.writeFile(filesAndDirectories.file1.name, content)
        .then(() => {
          const verifyContent = fs.readFileSync(path.join(filesAndDirectories.rootDirectory, filesAndDirectories.file1.name));
          should(verifyContent).not.be.undefined();
          ("" + verifyContent).should.equal(content);
        });
    });
    it("rejects on directory not existing", () => {
      return adapter.writeFile(filesAndDirectories.nonexistingdir, "owefwmodf")
        .then(() => should.fail("No error", "Expected error"))
        .catch((error) => should(error).not.be.undefined());
    });
  });
  describe("List directories", () => {
    const { adapter, filesAndDirectories } = getFreshFileStructureAndAdapter();
    it("rejects on directory not existing", () => {
      const nonExistingAdapter = fileAdapter(path.join(filesAndDirectories.rootDirectory, filesAndDirectories.nonexistingdir));
      return nonExistingAdapter.listDirectories()
        .then(() => should.fail("No error", "Expected error"))
        .catch((error) => should(error).not.be.undefined());
    });
    it("lists directories", () => {
      return adapter.listDirectories()
        .then((directories) => {
          should(directories).not.be.undefined();
          directories.length.should.equal(2);
          directories.should.containEql(filesAndDirectories.dir1name);
          directories.should.containEql(filesAndDirectories.dir2name);
        });
    });
  });
  describe("Creates directories", () => {
    const { adapter, filesAndDirectories } = getFreshFileStructureAndAdapter();
    it("rejects on root directory not existing", () => {
      const nonExistingAdapter = fileAdapter(path.join(filesAndDirectories.rootDirectory, filesAndDirectories.nonexistingdir));
      return nonExistingAdapter.createDirectory("whatever")
        .then(() => should.fail("No error", "Expected error"))
        .catch((error) => should(error).not.be.undefined());
    });
    it("works on non existing directories", () => {
      return adapter.createDirectory(filesAndDirectories.nonexistingdirfile)
        .then(() => {
          should(fs.existsSync(path.join(filesAndDirectories.rootDirectory, filesAndDirectories.nonexistingdirfile))).be.true();
        });
    });
    it("works on existing directories", () => {
      return adapter.createDirectory(filesAndDirectories.dir1name)
        .then(() => {
          should(fs.existsSync(path.join(filesAndDirectories.rootDirectory, filesAndDirectories.dir1name))).be.true();
          should(fs.existsSync(path.join(filesAndDirectories.rootDirectory, filesAndDirectories.dir1name, filesAndDirectories.dir1file.name))).be.true();
        });
    });
  });
  describe("Create subdir adapter", () => {
    const { adapter, filesAndDirectories } = getFreshFileStructureAndAdapter();
    it("just works", () => {
      return adapter.getDirectoryProvider(filesAndDirectories.dir1name)
        .then((sub) => {
          should(sub).not.be.undefined();
          return sub.readFile(filesAndDirectories.dir1file.name);
        })
        .then((content) => should(content).be.equal(filesAndDirectories.dir1file.content));
    });
  });
});