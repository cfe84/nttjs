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
        console.log(`Deleting ${blob.name}`);
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

