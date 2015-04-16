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

	var routerTest = require("./serve/router.test.js"),
		closerTest = require("./serve/closer.test.js");

	describe(".call() result", function() {

		it("should contain empty router if mode = closer", function() {
			expect(owe.serve({
				mode: "closer"
			}).router.toString()).to.eql(function() {}.toString());
		});

		it("should contain empty closer if mode = router", function() {
			expect(owe.serve({
				mode: "router"
			}).closer.toString()).to.eql(function() {}.toString());
		});

		describe(".router", function() {
			routerTest(function(options) {
				return owe.serve({
					router: options
				}).router;
			});
		});

		describe(".closer", function() {
			closerTest(function(options) {
				return owe.serve({
					closer: options
				}).closer;
			});
		});

	});

});
