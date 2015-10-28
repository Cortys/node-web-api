"use strict";

const expect = require("expect.js");

const owe = require("../src");

describe(".reroute", () => {

	const o = owe({
		param: "crazy"
	}, function(destination) {
		this.value.derp = Math.random();

		return owe(Object.create(this.value, {
			param: {
				value: destination
			}
		}), this.binding);
	}, function(data) {
		this.value.derp = Math.random();

		return `${this.value.param.toUpperCase()} ${data}`;
	});

	it("should return an object with a router and a closer function", () => {
		const result = owe.reroute({});

		expect(result).to.be.an("object");
		expect(result.router).to.be.a("function");
		expect(result.closer).to.be.a("function");
	});

	it("result should be accepted by owe-function", () => {
		expect(owe).withArgs(null, owe.reroute({})).not.to.throwError();
	});

	describe(".call() result", () => {
		it("should contain empty router if mode = closer", () => {
			expect(owe.reroute({}, {
				mode: "closer"
			}).router).to.be(undefined);
		});

		it("should contain empty closer if mode = router", () => {
			expect(owe.reroute({}, {
				mode: "router"
			}).closer).to.be(undefined);
		});

		const rerouting = owe.reroute(o);

		describe(".router", () => {
			const dummy = owe({}, rerouting.router, () => {});

			it("should return routing result of the rerouting target", () => {
				return owe.api(dummy).route("foo").route("hello").close("WORLD").then(result => {
					expect(result).to.be("HELLO WORLD");
					expect(dummy).to.eql({});
				});
			});

		});

		describe(".closer", () => {
			const dummy = owe({}, () => {}, rerouting.closer);

			it("should return closing result of the rerouting target", () => {
				return owe.api(dummy).close("STUFF").then(result => {
					expect(result).to.be("CRAZY STUFF");
					expect(dummy).to.eql({});
				});
			});

		});

	});

});
