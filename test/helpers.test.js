var expect = require("expect.js");

var nwa = require("../src"),
	helpers = require("../src/helpers");

describe("helpers", function() {
	describe(".fallthrough", function() {
		it("should returns a function", function() {
			expect(helpers.fallthrough(undefined)).to.be.a("function");
			expect(helpers.fallthrough(null)).to.be.a("function");
			expect(helpers.fallthrough(function() {})).to.be.a("function");
			expect(helpers.fallthrough([])).to.be.a("function");
			expect(helpers.fallthrough([function() {}, "test"])).to.be.a("function");
		});
		it("should throw for non-function, non-array, not-null values", function() {
			expect(helpers.fallthrough).withArgs(true).to.throwError();
			expect(helpers.fallthrough).withArgs(1).to.throwError();
			expect(helpers.fallthrough).withArgs({}).to.throwError();
			expect(helpers.fallthrough).withArgs("test").to.throwError();
			expect(helpers.fallthrough).withArgs(Symbol()).to.throwError();
		});
	});
});
