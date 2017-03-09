"use strict";

const expect = require("./expect");

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
		expect(owe(null, owe.reroute({}))).to.be.ok;
	});

	it("should require a bindable object as argument", () => {
		expect(owe.reroute({})).to.be.ok;
		expect(owe.reroute(() => "test")).to.be.ok;
		expect(() => owe.reroute()).to.throw();
		expect(() => owe.reroute("test")).to.throw();
		expect(() => owe.reroute(123)).to.throw();
	});

	describe(".call() result", () => {
		it("should contain empty router if mode = closer", () => {
			expect(owe.reroute({}, {
				mode: "closer"
			}).router).to.equal(undefined);
		});

		it("should contain empty closer if mode = router", () => {
			expect(owe.reroute({}, {
				mode: "router"
			}).closer).to.equal(undefined);
		});

		const rerouting = owe.reroute(o);

		describe(".router", () => {
			it("should return routing result of the rerouting target", () => {
				const dummy = owe({}, rerouting.router, () => {});

				return owe.api(dummy).route("foo").route("hello").close("WORLD").then(result => {
					expect(result).to.equal("HELLO WORLD");
					expect(dummy).to.deep.equal({});
				});
			});

			it("should throw if rerouting target is not bound on route", () => {
				const api = owe.api({}, owe.reroute({}));

				return api.route().then(() => {
					expect().fail("Should not route.");
				}, err => {
					expect(err.message).to.deep.equal("Only bound objects can be a rerouting target.");
				});
			});
		});

		describe(".closer", () => {
			it("should return closing result of the rerouting target", () => {
				const dummy = owe({}, () => {}, rerouting.closer);

				return owe.api(dummy).close("STUFF").then(result => {
					expect(result).to.equal("CRAZY STUFF");
					expect(dummy).to.deep.equal({});
				});
			});

			it("should throw if rerouting target is not bound on close", () => {
				const api = owe.api({}, owe.reroute({}));

				return api.close().then(() => {
					expect().fail("Should not close.");
				}, err => {
					expect(err.message).to.deep.equal("Only bound objects can be a rerouting target.");
				});
			});
		});
	});
});
