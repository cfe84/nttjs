Low-tech resource / entity persistence framework based on file systems
(disk / cloud storage).

# Using

```sh
npm install nttjs
```

Then

```js
const ntt = require("nttjs");

const adapter = ntt.adapters.fs("./data");
const root = ntt.ntt(adapter);

root.createResourceEntity("examples", "1")
    .then((entity) => entity.save("HURRAY"))
    .then(() => root.getResourceEntity("examples", "1")
    .then((entity) => entity.read())
    .then((content) => console.log(content));
    // HURRAY
```


# Building 

## Running the tests

Tests are run through `npm test`. Azure integration tests require to
create a storage account, a container called `ntttest` inside the 
container, then setting environment variables `AZURE_STORAGE_ACCOUNT`
and `AZURE_STORAGE_KEY`.