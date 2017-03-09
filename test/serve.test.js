"use strict";

const expect = require("./expect");

const owe = require("../src");

describe(".serve", () => {
	it("should return an object with a router and a closer function", () => {
		const result = owe.serve();

		expect(result).to.be.an("object");
		expect(result.router).to.be.a("function");
		expect(result.closer).to.be.a("function");
	});

	it("result should be accepted by owe-function", () => {
		expect(owe(null, owe.serve())).to.be.ok;
	});

	const routerTest = require("./serve/router.test.js");
	const closerTest = require("./serve/closer.test.js");

	describe(".call() result", () => {
		it("should contain empty router if mode = closer", () => {
			expect(owe.serve({
				mode: "closer"
			}).router).to.equal(undefined);
		});

		it("should contain empty closer if mode = router", () => {
			expect(owe.serve({
				mode: "router"
			}).closer).to.equal(undefined);
		});

		describe(".router", () => {
			routerTest(options => {
				return owe.serve({
					router: options
				}).router;
			});
		});

		describe(".closer", () => {
			closerTest(options => {
				return owe.serve({
					closer: options
				}).closer;
			});
		});
	});
});
