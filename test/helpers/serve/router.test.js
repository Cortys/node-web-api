var expect = require("expect.js");

var owe = require("../../../src");

describe(".router", function() {
	it("should return a function", function() {
		expect(owe.serve.router()).to.be.a("function");
	});
});
