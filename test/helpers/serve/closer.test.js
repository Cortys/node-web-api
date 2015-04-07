var expect = require("expect.js");

var owe = require("../../../src");

describe(".closer", function() {
	it("should return a function", function() {
		expect(owe.serve.closer()).to.be.a("function");
	});
});
