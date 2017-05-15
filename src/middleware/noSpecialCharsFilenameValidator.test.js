const validator = require("./noSpecialCharsFilenameValidator");

describe("Name validation", () => {
  it("should validate correct names", () => {
    validator.validate("kdsjfskdjfsk").should.be.true("only lower case characters");
    validator.validate("sdSf992").should.be.true("mix of lower, upper and numbers");
    validator.validate("subresource1").should.be.true("subresource1");
    validator.validate("00000000000").should.be.true("string with only zeros");
  });
  it("should invalidate incorrect names", () => {
    validator.validate("sdf/").should.be.false("contains a forward slash");
    validator.validate("sdf\\*#&").should.be.false("contains special chars");
    validator.validate("/").should.be.false("only a forward slash");
    validator.validate("").should.be.false("empty string");
    validator.validate(1).should.be.false("number");
    validator.validate(null).should.be.false("null");
    validator.validate().should.be.false("nothing");
    validator.validate(undefined).should.be.false("undefined");
  });
});