const JSONSerializer = {
  serialize: (object) => JSON.stringify(object),
  deserialize: (string) => JSON.parse(string)
};

module.exports = JSONSerializer;