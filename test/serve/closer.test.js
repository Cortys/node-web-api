"use strict";

const expect = require("chai").expect;

const owe = require("owe-core");
const closer = owe.serve.closer;

describe(".closer", () => {
	it("should return a function", () => {
		expect(closer()).to.be.a("function");
	});

	testCloser(closer);
});

function testCloser(closerGenerator) {
	const router = owe.serve.router({
		writable: true,
		mapFunctions: "direct"
	});

	describe("default", () => {
		const o = owe({
			foo: "bar",
			o: {},
			a: [],
			f: input => Promise.resolve(`${input}!`)
		}, router, closerGenerator());

		it("should not be writable", () => {
			return owe.api(o).route("foo").close("baz").then(() => {
				expect().fail("foo should not be closable with data.");
			}, err => {
				expect(err.type).to.equal("close");
				expect(err.message).to.equal("This route could not be closed with the given data.");
				expect(o.foo).to.equal("bar");
			});
		});

		it("should not output objects (except from Arrays)", () => {
			return Promise.all([
				owe.api(o).route("o").close().then(() => {
					expect().fail("o should not be closable.");
				}, err => {
					expect(err.type).to.equal("close");
					expect(err.message).to.equal("This route could not be closed.");
				}),
				expect(owe.api(o).route("a")).to.eventually.equal(o.a)
			]);
		});

		it("should call functions instead of returning them", () => {
			return expect(owe.api(o).route("f").close("Hello World")).to.eventually.equal("Hello World!");
		});

	});

	describe("writable", () => {
		it("should write object properties if enabled", () => {
			const o = {
				foo: "bar",
				get baz() {
					return 1;
				},
				set baz(val) {
					throw "err";
				},
				get qux() {
					return 2;
				},
				set qux(val) {
					throw new owe.exposed.Error("a");
				}
			};
			const api = owe.api(o, router, closerGenerator({
				writable: true
			}));

			expect(o.foo).to.equal("bar");

			return Promise.all([
				api.route("foo").close("baz").then(result => {
					expect(result).to.equal("baz");
					expect(o.foo).to.equal("baz");
				}),
				expect(api.route("baz").close("x")).to.be.rejectedWith("This route could not be closed with the given data."),
				expect(api.route("qux").close("x")).to.be.rejectedWith("a")
			]);
		});

		it("should pass State and data of close to writable if it is a filter function", () => {
			let foo = "bar";

			const o = {
				get foo() {
					return foo;
				},
				set foo(val) {
					foo = val;
				}
			};
			const api = owe.api(o, router, closerGenerator({
				writable(data) {
					expect(data).to.equal("baz");
					expect(this.value).to.equal("bar");
					expect(this.route).to.deep.equal(["foo"]);

					return Promise.resolve(true);
				}
			}));

			return api.route("foo").close("baz").then(result => {
				expect(result).to.equal("baz");
				expect(o.foo).to.equal("baz");
			});
		});

	});

	describe("filter", () => {
		const o = {
			foo: "bar",
			o: {},
			a: [],
			f: input => Promise.resolve(`${input}!`)
		};

		it("should filter with functions", () => {
			const api = owe.api(o, router, closerGenerator({
				filter(val) {
					expect(o).to.have.property(this.route[this.route.length - 1]);
					expect(this.route.length).to.deep.equal(1);
					expect(val).to.equal(o[this.route[this.route.length - 1]]);

					if(typeof val === "function" || typeof val === "string")
						return true;
				}
			}), true);

			return Promise.all([
				expect(api.route("f").close("test")).to.eventually.equal("test!"),
				expect(api.route("foo")).to.eventually.equal("bar"),
				api.route("a").then(() => {
					expect().fail("a should not be closable.");
				}, err => {
					expect(err.type).to.equal("close");
					expect(err.route).to.deep.equal(["a"]);
					expect(err.message).to.equal("This route could not be closed.");
				}),
				api.route("a").close(null).then(() => {
					expect().fail("a should not be closable.");
				}, err => {
					expect(err.type).to.equal("close");
					expect(err.route).to.deep.equal(["a"]);
					expect(err.message).to.equal("This route could not be closed with the given data.");
				})
			]);
		});
	});

	describe("output", () => {
		it("should replace output", () => {
			return expect(owe.api({
				test: "foo"
			}, router, closerGenerator({
				output(val) {
					return val.toUpperCase();
				}
			})).route("test")).to.eventually.equal("FOO");
		});
	});

	describe("callFunctions", () => {
		it("should allow returned functions if disabled", () => {
			const o = () => {
				return 42;
			};

			return expect(owe.api(o, router, closerGenerator({
				callFunctions: false
			}))).to.eventually.equal(o);
		});
	});

}

module.exports = testCloser;
