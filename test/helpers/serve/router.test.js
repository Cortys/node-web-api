var expect = require("expect.js");

var owe = require("../../../src"),
	router = owe.serve.router;

describe(".router", function() {
	it("should return a function", function() {
		expect(router()).to.be.a("function");
	});

	testRouter(router);

});

function testRouter(routerGenerator) {
	describe("default options", function() {

		var router = routerGenerator();

		it("should route functions", function() {

		});

	});
}

module.exports = testRouter;
