var expect = require("expect.js");

var owe = require("../../../src"),
	closer = owe.serve.closer;

describe(".closer", function() {
	it("should return a function", function() {
		expect(closer()).to.be.a("function");
	});

	testCloser(closer);

});

function testCloser(closerGenerator) {

}

module.exports = testCloser;
