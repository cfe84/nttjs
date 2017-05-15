const validator = require("./noSpecialCharsFilenameValidator");

describe("Name validation", () => {
  it("should validate correct names", () => {
    validator.validate("kdsjfskdjfsk").should.be.true();
    validator.validate("sdf").should.be.true();
    validator.validate("sdSf992").should.be.true();
    validator.validate(1).should.be.true();
    validator.validate("00000000000").should.be.true();
  });
  it("should invalidate incorrect names", () => {
    validator.validate("sdf/").should.be.false();
    validator.validate("/").should.be.false();
    validator.validate("").should.be.false();
    validator.validate(null).should.be.false();
    validator.validate().should.be.false();
    validator.validate(undefined).should.be.false();
  });
});