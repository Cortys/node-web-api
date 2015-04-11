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

		it("should not route functions", function() {

			var api = owe(function(a) {
					return "test";
				}, router, function() {
					return this.value; // Just output the given input.
				});

			return api.route("path").close().then(function() {
				expect().fail("Should not be routed.");
			}, function(err) {
				expect(err.message).to.be("'path' could not be routed.");
			});
		});



	});
}

module.exports = testRouter;
