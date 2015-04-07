var expect = require("expect.js");

var owe = require("../../src");

describe(".serve", function() {

	it("should return an object with a router and a closer function", function() {

		var result = owe.serve();

		expect(result).to.be.an("object");
		expect(result.router).to.be.a("function");
		expect(result.closer).to.be.a("function");
	});

	it("result should be accepted by owe-function", function() {
		expect(owe).withArgs(null, owe.serve()).not.to.throwError();
	});

	require("./serve/router.test.js");

	require("./serve/closer.test.js");

});
