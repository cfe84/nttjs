const validator = require("./noSpecialCharsFilenameValidator");
const should = require("should");

describe("Name validation", () => {
  describe("should validate correct names", () => {
    it("only lower case characters", () => validator.validate("kdsjfskdjfsk"));
    it("spaces are valid", () => validator.validate("kdsjfs kdjfsk"));
    it("mix of lower, upper and numbers", () => validator.validate("sdSf992"));
    it("subresource1", () => validator.validate("subresource1"));
    it("string with only zeros", () => validator.validate("00000000000"));
  });
  describe("should invalidate incorrect names", () => {
    it("contains a forward slash", () => should(validator.validate("sdf/"))
      .be.rejectedWith(validator.errors.invalidCharacters));
    it("contains special chars", () => should(validator.validate("sdf\\*#&"))
      .be.rejectedWith(validator.errors.invalidCharacters));
    it("only a forward slash", () => should(validator.validate("/"))
      .be.rejectedWith(validator.errors.invalidCharacters));
    it("empty string", () => should(validator.validate(""))
      .be.rejectedWith(validator.errors.empty));
    it("number", () => should(validator.validate(1))
      .be.rejectedWith(validator.errors.notAString));
    it("object", () => should(validator.validate({}))
      .be.rejectedWith(validator.errors.notAString));
    it("null", () => should(validator.validate(null))
      .be.rejectedWith(validator.errors.empty));
    it("nothing", () => should(validator.validate())
      .be.rejectedWith(validator.errors.empty));
    it("undefined", () => should(validator.validate(undefined))
      .be.rejectedWith(validator.errors.empty));
  });
});