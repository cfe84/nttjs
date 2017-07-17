ntt is a low-tech REST persistence framework. It lets you persist a 
resource tree without all those fancy relational technologies, because 
quite frankly, you don’t need all that. Instead, it provides an 
abstraction layer over file systems (disk / cloud storage), which, in 
the day and age we live in, are dirt-cheap.

You can use ntt if your model is not strongly relational, or relations 
go only one way. If you need any form of indexation, you can also 
couple it with a search engine such as Azure Search, which also offer 
some good poor-man options.

ntt currently supports filesystem and Azure Blob Storage, planning
on adding S3 one day (pull requests welcome).

# Using

```sh
npm install nttjs
```

Then

```js
const ntt = require("nttjs");

const adapter = ntt.adapters.fs("./data");
const rootEntity = ntt.entity(adapter);

rootEntity.createResource("examples")
    .then((resource) => resource.createEntity("1"))
    .then((entity) => entity.save("HURRAY"))
    .then(() => root.getResource("examples")
    .then((resource) => resource.getEntity("1")
    .then((entity) => entity.load())
    .then((content) => console.log(content));
    // HURRAY
```

## FS Adapter

fs adapter is instantiated through `ntt.adapters.fs(rootFolder)`. There
really is nothing much more to it

## Azure blob storage adapter

Adapter needs to be configured. This is done by providing:

- account: the account name (e.g. mystorageaccount)
- key: one of the storage account keys.

```js
const containerName = "ntttest";
const configuration = {
  account: process.env.AZURE_STORAGE_ACCOUNT,
  key: process.env.AZURE_STORAGE_KEY
};
const fileAdapter = ntt.adapters.azure(config, containerName);
```

## In memory adapter

ntt also provides an "in-memory" storage adapter, mostly for test
purposes. The storage adapter can be instantiated with an optional
fake file structure.

```js
  const fileAdapter = ntt.adapters.inMemory(fakeFileStructure);
```

The fake file structure is an object, with two properties: `files` and
`directories`, each of which are objects. Files' property names are the
fake file's name, and its value is the entity content. The in memory 
adapter does not use serialization, so what you see is what you get. Put
in the entities directly, into files called `entity.json`.

Directory's property names are the fake directory's name. Its value is
an object with two properties: `files` and `directories`.

```js
{
    files: {
      "entity.json": { id: 1, prop: "main entity" }
    },
    directories: {
      "subresource1": {
        directories: {
          "1": {
            files: {
              "entity.json": { id: 2, stuff: "other entity" }
            }
          },
          "2": {
            files: {
              "entity.json": { id: 43, prop: "lolilol" }
            }
          }
        }
      }
}
```

## Entities and resources

ntt works with two intertwined classes: entities and resources. An 
entity has resources, a resource has entities, and so forth. Entities
also have a body, which you can load or save.

Model ressembles this:
```
rootEntity
|_> resource-1
|   |_> entity-1.1
|   |   |_> resource-1.1.1
|   |_> entity-1.2
|       |_> resource-1.2.1
|       |_> resource-1.2.2
|_> resource-2
    |_> entity-2.1
```

When loading ntt, your first object is the root **entity**, which you get
by simply passing the file adapter you picked to `ntt.entity`.

Entities are objects offering the following properties:

- `load()` returns a promise, whose callback has one parameter
  `content` containing the de-serialized content of the entity.
- `save(entity)` serializes, then saves the entity.
- `listResources()` lists all sub-resources of the entity. This returns
  a promise which only parameter is a list of **strings** representing
  the name of the sub-resources.
- `iterateResources()`: _async_, returns an iterator with only one
  method called `next()` which returns the next element in the list.
  Although it is resembling the javascript iterator, `next()` is async, 
  and therefore you need to await it. `next()` is returning an object
  containing two values:
  - `done`, a boolean indicating if the iteration is finished
  - `value`, containing the resource access object, or `undefined` if
    iterator reached the end.
- `getResource(resourceName)` returns a promise, whose only parameter
  is a resource object to manipulate the resource (see below).
- `createResource(resourceName)` creates a resource, and returns a
  resource object to manipulate it, as the only parameter to a promise.
  This method will _not_ crash if resource already exists, and then 
  just return the existing resource.
- `deleteResource(resourceName)` deletes corresponding resource. 
  To be deleted, the resource must have no sub-entities.
- `name` is a string, represents the name of the entity.
  
Resources are objects offering the following properties:

- `listEntities()` does the same thing as `listResources` but for 
  entities. Returns a list of string representing the ids of entities
  in the resource
- `iterateEntities()`: _async_, returns an iterator with only one
  method called `next()` which returns the next element in the list of
  entities.
  Although it is resembling the javascript iterator, `next()` is async, 
  and therefore you need to await it. `next()` is returning an object
  containing two values:
  - `done`, a boolean indicating if the iteration is finished
  - `value`, containing the entity access object, or `undefined` if
    iterator reached the end.
- `getEntity(entityId)` returns a promise, whose only parameter
  is an entity object to manipulate the entity (see above).
- `createEntity(entityId)` creates an entity with **optional** parameter
  to define its id. If no `entityId` is supplied, a new guid is 
  generated. This **will** crash if entity already exists, and will
  return a promise whose only parameter is an entity object.
- `deleteEntity(entityId)` deletes the corresponding entity. The 
  entity must have removed all its resources before you can delete it.

## Other considerations


**Serialization**

You can specify another serializer than JSON by providing a second 
attribute to `ntt.entity`. This second attribute should be an object with
two methods:

- `serialize(content)` serializes an object and returns a string
- `deserialize(object)` deserializes a string and returns an object.

**Name and id validation**

Ids and names are validated. Validation issues will trigger promise
rejection. Default validation accepts only `[ a-z0-9_-]+`, ignoring
case.

To change the default behavior of validation, you can override the
`validate` method of the file adapter you're using. `validate(string)`
takes the name or id to validate, and returns a promise, resolved
if the id or name is valid, and rejected with an error if it's not. 

## Storage model

Entities are sub-folders of resources, named after their id. 
Resources are sub-folders of entities, named after their resource name.
Entity body is stored in a `entity.json` file in the entity directory.

Azure file adapter also creates an empty file called `._` in new
resources to persist the folder.

# Building 

## Running the tests

Tests are run through `npm test`. Azure integration tests require to
create a storage account, a container called `ntttest` inside the 
container, then setting environment variables `AZURE_STORAGE_ACCOUNT`
and `AZURE_STORAGE_KEY`.

# Changelog

## 1.4.0

- Added delete entity and resources.

## 1.3.0

- Added entity iterator and resource iterator to ease the use of
  lists.