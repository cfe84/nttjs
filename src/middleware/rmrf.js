const rmrf = async (folderProvider) => {
  const directories = await folderProvider.listDirectories();
  for (directory of directories) {
    const subProvider = await folderProvider.getDirectoryProvider(directory);
    await rmrf(subProvider);
  }
  const files = await folderProvider.listFiles();
  for (file of files) {
    await folderProvider.deleteFile(file);
  }
  await folderProvider.deleteDirectory();
};

module.exports = rmrf;