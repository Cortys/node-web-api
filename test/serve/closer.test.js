"use strict";

const expect = require("expect.js");

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
				expect(err.type).to.be("close");
				expect(err.message).to.be("This route could not be closed with the given data.");
				expect(o.foo).to.be("bar");
			});
		});

		it("should not output objects (except from Arrays)", () => {
			return Promise.all([
				owe.api(o).route("o").close().then(() => {
					expect().fail("o should not be closable.");
				}, err => {
					expect(err.type).to.be("close");
					expect(err.message).to.be("This route could not be closed.");
				}),
				owe.api(o).route("a").then(result => {
					expect(result).to.be(o.a);
				})
			]);
		});

		it("should call functions instead of returning them", () => {
			return owe.api(o).route("f").close("Hello World").then(result => {
				expect(result).to.be("Hello World!");
			});
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
				writable: false,
				writableInverse: true
			}));

			expect(o.foo).to.be("bar");

			return Promise.all([
				api.route("foo").close("baz").then(result => {
					expect(result).to.be("baz");
					expect(o.foo).to.be("baz");
				}),
				api.route("baz").close("x").then(() => {
					expect().fail("Should not be closed.");
				}, err => {
					expect(err.message).to.be("This route could not be closed with the given data.");
				}),
				api.route("qux").close("x").then(() => {
					expect().fail("Should not be closed.");
				}, err => {
					expect(err.message).to.be("a");
				})
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
					expect(data).to.be("baz");
					expect(this.value).to.be("bar");
					expect(this.route).to.eql(["foo"]);

					return Promise.resolve(true);
				}
			}));

			return api.route("foo").close("baz").then(result => {
				expect(result).to.be("baz");
				expect(o.foo).to.be("baz");
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
					expect(this.route.length).to.eql(1);
					expect(val).to.be(o[this.route[this.route.length - 1]]);

					if(typeof val === "function" || typeof val === "string")
						return true;
				}
			}), true);

			return Promise.all([
				api.route("f").close("test").then(result => {
					expect(result).to.be("test!");
				}),
				api.route("foo").then(result => {
					expect(result).to.be("bar");
				}),
				api.route("a").then(() => {
					expect().fail("a should not be closable.");
				}, err => {
					expect(err.type).to.be("close");
					expect(err.route).to.eql(["a"]);
					expect(err.message).to.be("This route could not be closed.");
				})
			]);
		});

		it("should invert if filterInverse is set", () => {
			return owe.api(o, router, closerGenerator({
				filter: false,
				filterInverse: true
			}), true).route("o");
		});

	});

	describe("output", () => {
		it("should replace output", () => {
			return owe.api({
				test: "foo"
			}, router, closerGenerator({
				output(val) {
					return val.toUpperCase();
				}
			})).route("test").then(result => {
				expect(result).to.be("FOO");
			});
		});
	});

	describe("callFunctions", () => {
		it("should allow returned functions if disabled", () => {
			const o = () => {
				return 42;
			};

			return owe.api(o, router, closerGenerator({
				callFunctions: false
			})).then(result => {
				expect(result).to.be(o);
			});
		});
	});

}

module.exports = testCloser;
