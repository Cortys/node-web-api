const expect = require("expect.js");

const owe = require("../src");

describe(".serve", function() {

	it("should return an object with a router and a closer function", function() {

		const result = owe.serve();

		expect(result).to.be.an("object");
		expect(result.router).to.be.a("function");
		expect(result.closer).to.be.a("function");
	});

	it("result should be accepted by owe-function", function() {
		expect(owe).withArgs(null, owe.serve()).not.to.throwError();
	});

	const routerTest = require("./serve/router.test.js"),
		closerTest = require("./serve/closer.test.js");

	describe(".call() result", function() {

		it("should contain empty router if mode = closer", function() {
			expect(owe.serve({
				mode: "closer"
			}).router).to.be(undefined);
		});

		it("should contain empty closer if mode = router", function() {
			expect(owe.serve({
				mode: "router"
			}).closer).to.be(undefined);
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
