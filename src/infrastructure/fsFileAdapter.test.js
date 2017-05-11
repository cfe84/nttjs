const should = require("should");
const fs = require("fs");
const path = require("path");
const fileAdapter = require("./fsFileAdapter");

const prepareTestDir = (directoryPath) => {
  const SEP = path.delimiter;
  const rootDirectory = `${directoryPath}${SEP}fsFileAdapterTest`;
  const filesAndDirs = {
    rootDirector: rootDirectory,
    file1: {
      path: `${rootDirectory}${SEP}entity1.json`,
      content: "sdoifj204gvfe f 2e9fj v fe"
    },
    file2: {
      path: `${rootDirectory}${SEP}entity2.json`,
      content: "2ijrfwlv sq0efm2mvvcok mv09 fd m"
    },
    nonexistingfile: {
      path:`${rootDirectory}${SEP}entity3.json`,
      content: null
    },
    dir1: `${rootDirectory}${SEP}subdir1`,
    dir2: `${rootDirectory}${SEP}subdir2`,
    dir1file: {
      path: `${this.dir1}${SEP}subfile`,
      content: "dspm22- 0wd -20 md 02mrvfm om2092rv0- fm"
    },
    nonexistingdir: `${rootDirectory}${SEP}"subdir3"`,
  };

  if (fs.existsSync(rootDirectory)){
    fs.rmdirSync(rootDirectory);
  }
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
    fs.rmdirSync(rootDirectory);
  }
};

describe("File system file adapter", () => {
  describe("Read files", () => {
    it("reads existing file content", () => {});
    it("rejects on non-existing file", () => {});
  });
  describe("List files", () => {
    it("lists files in the directory", () => {});
    it("rejects on directory not existing", () => {});
  });
  describe("Write files", () => {
    it("writes new file", () => {});
    it("over-writes existing file", () => {});
    it("rejects on directory not existing", () => {});
  });
  describe("List directories", () => {
    it("rejects on directory not existing", () => {});
    it("lists directories", () => {});
  });
  describe("Creates directories", () => {
    it("rejects on directory not existing", () => {});
    it("rejects on directory not existing", () => {});
  });
  describe("Create subdir adapter", () => {});
});