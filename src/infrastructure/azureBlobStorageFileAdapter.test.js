const adapterFactory = require("./azureBlobStorageFileAdapter");
const azure = require("azure-storage");
const should = require("should");

const TEST_CONTAINER = "ntttest";
const ACCOUNT = "picklockdemo";
const KEY = "AOm8hOLH8YOJDtEQO/ZNXVif5q9Q58f56dJnDiErsGgccWfKadzwH5VwQMImu4KyEZtoKFXOdj0tN6NMiUkm6g==";

process.env.AZURE_STORAGE_ACCOUNT = ACCOUNT;
process.env.AZURE_STORAGE_KEY = KEY;

const config = {
  account: process.env.AZURE_STORAGE_ACCOUNT,
  key: process.env.AZURE_STORAGE_KEY
};


const clearTestContainer = (config, callback) => {
  const blobService = azure.createBlobService(config.account, config.key);
  const options = {useFlatBlobListing: true};
  blobService.listBlobsSegmented(TEST_CONTAINER, null, options, (error, result) => {
    let i = result.entries.length;
    if (i === 0) {
      return callback();
    }
    result.entries.forEach((blob) => {
      blobService.deleteBlobIfExists(TEST_CONTAINER, blob.name, (error, result) => {
        console.log(`Deleting ${blob.name}`);
        if (--i <= 0) {
          callback();
        }
      });
    });
  });
};

const adapter = adapterFactory(config, TEST_CONTAINER);

describe("Azure blob storage adapter", () => {

  before((done) => clearTestContainer(config, done));

  it("writes and reads files correctly", () => {
    const CONTENT = "YOLO~!!!" + Math.ceil(Math.random() * 100192931);
    const FILENAME = "hello.txt";
    return adapter.writeFile(FILENAME, CONTENT)
      .then(() => adapter.readFile(FILENAME))
      .then((content) => content.should.equal(CONTENT));
  });

  it("creates and gets sub directories and list files", () => {
    const DIRECTORY = "smfdkglk";
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
});

