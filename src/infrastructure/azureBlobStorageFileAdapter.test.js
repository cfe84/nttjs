const adapterFactory = require("./azureBlobStorageFileAdapter");
const azure = require("azure-storage");
const should = require("should");

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


describe("Azure blob storage adapter", () => {
  if (!config.account || !config.key) {
    throw Error("You need to define environment variables AZURE_STORAGE_ACCOUNT and AZURE_STORAGE_KEY" +
      " to define an integration test account");
  }

  const adapter = adapterFactory(config, TEST_CONTAINER);

  before(function (done) {
    this.timeout(60000);
    clearTestContainer(config, done);
  });

  it("writes and reads files correctly", function () {
    this.timeout(4000);
    const CONTENT = "YOLO~!!!" + Math.ceil(Math.random() * 100192931);
    const FILENAME = "hello.txt";
    return adapter.writeFile(FILENAME, CONTENT)
      .then(() => adapter.readFile(FILENAME))
      .then((content) => content.should.equal(CONTENT));
  });

  it("creates and gets directories and list files", function () {
    this.timeout(4000);
    const DIRECTORY = "dirtest";
    return adapter.createDirectory(DIRECTORY)
      .then(() => adapter.listDirectories())
      .then((directories) => {
        should(directories).not.be.undefined();
        directories.should.containEql(DIRECTORY);
        return adapter.getDirectoryProvider(DIRECTORY);
      })
      .then((provider) => provider.listFiles())
      .then((files) => {
        files.length.should.equal(1);
        files[0].should.equal("._");
      });
  });

  it("creates and gets sub-directories", async function () {
    this.timeout(4000);
    const DIRECTORY = "subdirtest";
    const SUBDIRECTORY = "subdir1";
    await adapter.createDirectory(DIRECTORY);
    const folderProvider = await adapter.getDirectoryProvider(DIRECTORY);
    await folderProvider.createDirectory(SUBDIRECTORY);
    const directories  = await folderProvider.listDirectories();
    should(directories).not.be.undefined();
    directories.should.containEql(SUBDIRECTORY);
  });

  // This is testing the continuation token for files.
  // It's ignored since it's taking forever.
  xit("gets 6000 files if they're there", function (done) {
    const DIRECTORY = "6000files";
    const CONTENT = "test file";
    const FILECOUNT = 6000;
    const PROCESSORS = 10;
    this.timeout(FILECOUNT * 100);

    adapter.createDirectory(DIRECTORY)
      .then(() => adapter.getDirectoryProvider(DIRECTORY))
      .then((provider) => {
        let written = 1;
        let total = FILECOUNT;

        const validate = async () => {
          if (written++ < total)
            return;
          const files = await provider.listFiles();
          try {
            files.length.should.equal(total + 1);
            total.should.be.greaterThan(FILECOUNT * .9);
            done();
          }
          catch(err) {
            done(err);
          }
        };
        const filesQueue = [];
        for(let i = 0; i < FILECOUNT; i++) {
          filesQueue.push(`test-${i}.txt`);
        }

        const processQueue = async () => {
          let file;
          while (file = filesQueue.pop()) {
            try {
              await provider.writeFile(file, CONTENT);
            }
            catch (err) {
              total--;
              console.warn(`File ${file} not created: ${err}`);
            }
            await validate();
          }
        };

        for (let i = 0; i < PROCESSORS; i++) {
          processQueue();
        }
      });
  });


  // This is testing the continuation token for folders.
  // It's ignored since it's taking forever.
  xit("gets 6000 folders if they're there", function (done) {
    const DIRECTORY = "6000folders";
    const DIRECTORYCOUNT = 6000;
    const PROCESSORS = 10;
    this.timeout(DIRECTORYCOUNT * 100);

    adapter.createDirectory(DIRECTORY)
      .then(() => adapter.getDirectoryProvider(DIRECTORY))
      .then((provider) => {
        let created = 1;
        let total = DIRECTORYCOUNT;

        const validate = async () => {
          if (created++ < total)
            return;
          const directories = await provider.listDirectories();
          try {
            directories.length.should.equal(total);
            total.should.be.greaterThan(DIRECTORYCOUNT * .9);
            done();
          }
          catch(err) {
            done(err);
          }
        };

        const directoriesQueue = [];
        for(let i = 0; i < DIRECTORYCOUNT; i++) {
          directoriesQueue.push(`testdir-${i}`);
        }

        const processQueue = async () => {
          let directory;
          while (directory = directoriesQueue.pop()) {
            try {
              await provider.createDirectory(directory);
            }
            catch (err) {
              total--;
              console.warn(`Directory ${directory} not created: ${err}`);
            }
            await validate();
          }
        };

        for (let i = 0; i < PROCESSORS; i++) {
          processQueue();
        }
      });
  })
});

