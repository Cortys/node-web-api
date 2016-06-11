"use strict";

const expect = require("chai").expect;

const owe = require("owe-core");
const router = owe.serve.router;
const Binding = owe.Binding;

describe(".router", () => {
	it("should return a function", () => {
		expect(router()).to.be.a("function");
	});

	it("should only accept objects or functions as State#value when called", () => {
		expect(() => router()(undefined, {
			value: "not an object"
		})).to.throw(TypeError, "Router expected object or function but got 'not an object'.");
	});

	testRouter(router);
});

function testRouter(routerGenerator) {
	const closer = function(value) {
		// Change the value if another one was given:
		if(value !== undefined)
			this.value = value;

		return this.value; // Just output the given input.
	};

	describe("default", () => {
		const router = routerGenerator();

		it("should route functions at root as objects", () => {
			const f = () => "test";
			const api = owe.api(f, router, closer);

			f.path = 42;

			return expect(api.route("path")).to.eventually.equal(42);
		});

		it("should route objects as objects", () => {
			const api = owe.api({
				path: "Hello World!"
			}, router, closer);

			return expect(api.route("path")).to.eventually.equal("Hello World!");
		});

		it("should not traverse objects deeply", () => {
			const o = {
				foo: {
					bar: {
						baz: 42
					}
				}
			};
			const api = owe.api(o, router, closer);

			return Promise.all([
				expect(api.route("foo")).to.eventually.equal(o.foo),
				api.route("foo").route("bar").route("baz").then(() => {
					expect().fail("Traversing into an object should be disabled.");
				}, err => {
					expect(err.message).to.equal("Object at position 'foo' is an end point and cannot be routed.");
					expect(err.type).to.equal("route");
					expect(err.route).to.deep.equal(["foo", "bar"]);
				})
			]);
		});

		it("should output member functions bound to the object they came from", () => {
			const o = {
				test() {
					if(arguments.length)
						return arguments.length;

					return this;
				}
			};
			const api = owe.api(o, router, closer);

			return api.route("test").then(result => {
				expect(result(1, 2, 9, 4, null, 6, "7")).to.equal(7);
				expect(result()).to.equal(o);
			});
		});

		it("should not traverse object prototypes", () => {
			const o = {
				__proto__: {
					a: "test"
				}
			};
			const api = owe.api(o, router, closer);

			expect(o.a).to.equal("test");

			return api.route("a").then(r => {
				console.log("xxx", r);

				expect().fail("Object prototype should not be traversed.");
			}, err => {
				expect(err.type).to.equal("route");
				expect(err.message).to.equal("'a' could not be routed.");
				expect(err.route).to.deep.equal(["a"]);
			});
		});

		it("should handle object with null prototype routes", () => {
			return owe.api({}, router, closer).route({
				__proto__: null
			}).then(() => {
				expect().fail("'[object Object]' should not be routed.");
			}, err => {
				expect(err.type).to.equal("route");
				expect(err.message).to.equal("'[object Object]' could not be routed.");
				expect(err.route).to.deep.equal([{}]);
			});
		});

		it("should handle symbol routes", () => {
			const symb = Symbol("test");

			return owe.api({}, router, closer).route(symb).then(() => {
				expect().fail("'Symbol(test)' should not be routed.");
			}, err => {
				expect(err.type).to.equal("route");
				expect(err.message).to.equal("'Symbol(test)' could not be routed.");
				expect(err.route).to.deep.equal([symb]);
			});
		});
	});

	describe("prototype traversing", () => {
		const router = routerGenerator({
			traversePrototype: true
		});

		it("should traverse object prototypes", () => {
			const o = {
				__proto__: {
					a: "hello"
				},

				b: "world"
			};
			const api = owe.api(o, router, closer);

			expect(o.a).to.equal("hello");
			expect(o.b).to.equal("world");

			return Promise.all([
				expect(api.route("a")).to.eventually.equal("hello"),
				expect(api.route("b")).to.eventually.equal("world")
			]);
		});
	});

	describe("deep traversing", () => {
		function defaultRequirements(router, options) {
			if(options.objects)
				it("should traverse normal objects", () => {

					const o = {
						foo: {
							bar: {
								baz: Symbol("test")
							}
						}
					};
					const api = owe.api(o, router, closer).route("foo");

					return Promise.all([
						expect(api).to.eventually.equal(o.foo),
						expect(api.route("bar")).to.eventually.equal(o.foo.bar),
						expect(api.route("bar").route("baz")).to.eventually.equal(o.foo.bar.baz)
					]);
				});

			if(options.arrays)
				it("should not traverse arrays", () => {
					const o = {
						foo: [1, 2, 3.4, [5, 6]]
					};
					const api = owe.api(o, router, closer).route("foo");

					return Promise.all([
						api.route(0).then(() => {
							expect().fail("Arrays should not be traversed.");
						}, err => {
							expect(err.message).to.equal("Object at position 'foo' is an end point and cannot be routed.");
							expect(err.type).to.equal("route");
							expect(err.route).to.deep.equal(["foo", 0]);
						}),
						api.then(result => {
							expect(result).to.equal(o.foo);
						})
					]);
				});

			if(options.functions)
				it("should not traverse functions", () => {
					const o = {
						f() {}
					};
					const api = owe.api(o, router, closer);

					o.f.path = "test";

					return api.route("f").route("path").then(() => {
						expect().fail("Functions should not be traversed.");
					}, err => {
						expect(err.message).to.equal("Object at position 'f' is an end point and cannot be routed.");
						expect(err.type).to.equal("route");
						expect(err.route).to.deep.equal(["f", "path"]);
					});
				});

			if(options.deepen)
				it("should not deepen objects", () => {
					const o = {
						foo: {
							bar: {
								baz: Symbol("test")
							}
						}
					};
					const api = owe.api(o, router, closer).route("foo").route("bar");

					return api.route("baz").then(() => {
						expect(Binding.isBound(o)).to.equal(true);
						expect(Binding.isBound(o.foo)).to.equal(false);
						expect(Binding.isBound(o.foo.bar)).to.equal(false);
						expect(Binding.isBound(o.foo.bar.baz)).to.equal(false);
					});
				});
		}

		describe("default", () => {
			const router = routerGenerator({
				deep: true
			});

			defaultRequirements(router, {
				objects: true,
				arrays: true,
				functions: true,
				deepen: true
			});
		});

		describe("deep arrays", () => {
			const router = routerGenerator({
				deep: true,
				deepArrays: true
			});

			defaultRequirements(router, {
				objects: true,
				functions: true,
				deepen: true
			});

			it("should traverse arrays", () => {

				const o = {
					foo: [1, 2, 3.4, [5, 6]]
				};
				const api = owe.api(o, router, closer).route("foo");

				return Promise.all([
					expect(api.route(0)).to.eventually.equal(o.foo[0]),
					expect(api.route(1 + 2).route("0")).to.eventually.equal(o.foo[3][0]),
					expect(api).to.eventually.equal(o.foo)
				]);
			});

		});

		describe("deep functions", () => {
			const router = routerGenerator({
				deep: true,
				deepFunctions: true,
				mapFunctions: "direct"
			});

			defaultRequirements(router, {
				objects: true,
				arrays: true,
				deepen: true
			});

			it("should traverse functions", () => {
				const o = function o() {};
				const api = owe.api(o, router, closer);

				o.f = function a() {};

				o.f.g = function b() {};

				o.f.g.h = 42;

				return Promise.all([
					expect(api).to.eventually.equal(o),
					expect(api.route("f")).to.eventually.equal(o.f),
					expect(api.route("f").route("g")).to.eventually.equal(o.f.g),
					expect(api.route("f").route("g").route("h")).to.eventually.equal(o.f.g.h)
				]);
			});
		});

		describe("deepen objects", () => {
			const router = routerGenerator({
				deep: true,
				deepen: true,
				deepFunctions: true,
				deepArrays: true
			});

			defaultRequirements(router, {
				objects: true
			});

			it("should deepen objects", () => {
				const o = {
					foo: {
						bar: {
							baz: ["a", "b", "c"],
							fuz: 42
						},
						buz() {
							return this;
						}
					}
				};
				const api = owe.api(o, router, closer).route("foo");

				return Promise.all([
					api.route("bar").route("baz").route(1),
					api.route("buz")
				]).then(results => {
					expect(Binding.isBound(o)).to.equal(true);
					expect(Binding.isBound(o.foo)).to.equal(true);
					expect(Binding.isBound(o.foo.bar)).to.equal(true);
					expect(Binding.isBound(o.foo.bar.baz)).to.equal(true);

					// non-object types cannot be deepened:
					expect(Binding.isBound(o.foo.bar.fuz)).to.equal(false);

					// buz-function is routed to its .bind(o.foo) result and thus not deepened:
					expect(Binding.isBound(o.foo.buz)).to.equal(false);

					expect(results[0]).to.equal("b");
					expect(results[1]()).to.equal(o.foo);
				});
			});
		});

		describe("max depth", () => {
			const o = {
				foo: {
					bar: {
						baz: {
							far: {
								faz: {
									boo: true
								}
							}
						}
					}
				}
			};

			const apiA = owe.api(o, routerGenerator({
					deep: true,
					maxDepth: -Infinity
				}), closer, true),
				apiB = owe.api(o, routerGenerator({
					deep: true,
					maxDepth: 0
				}), closer, true),
				apiC = owe.api(o, routerGenerator({
					deep: true,
					maxDepth: "1"
				}), closer, true),
				apiD = owe.api(o, routerGenerator({
					deep: true,
					maxDepth: Math.PI
				}), closer, true),
				apiE = owe.api(o, routerGenerator({
					deep: true,
					maxDepth: "derp"
				}), closer, true);

			it("should forbid deep traversing for non-numeric or negative numbers", () => {
				return Promise.all([
					apiA.then(result => {
						expect(result).to.equal(o);
					}),
					apiA.route("foo").route("bar").then(() => {
						expect().fail("Deep routing should not be allowed for apiA.");
					}, err => {
						expect(err.type).to.equal("route");
						expect(err.message).to.equal("Object at position 'foo' is an end point and cannot be routed.");
						expect(err.route).to.deep.equal(["foo", "bar"]);
					}),
					apiB.route("foo").route("bar").then(() => {
						expect().fail("Deep routing should not be allowed for apiB.");
					}, err => {
						expect(err.type).to.equal("route");
						expect(err.message).to.equal("Object at position 'foo' is an end point and cannot be routed.");
						expect(err.route).to.deep.equal(["foo", "bar"]);
					}),
					apiE.route("foo").route("bar").then(() => {
						expect().fail("Deep routing should not be allowed for apiE.");
					}, err => {
						expect(err.type).to.equal("route");
						expect(err.message).to.equal("Object at position 'foo' is an end point and cannot be routed.");
						expect(err.route).to.deep.equal(["foo", "bar"]);
					})
				]);
			});

			it("should allow less or exactly maxDepth deep traversals", () => {
				return Promise.all([
					apiC.close(),
					apiC.route("foo").close(),
					apiC.route("foo").route("bar").close(),
					apiC.route("foo").route("bar").route("baz").then(() => {
						expect().fail("Deep routing should not be allowed for apiC after depth 1.");
					}, err => {
						expect(err.type).to.equal("route");
						expect(err.message).to.equal("The maximum routing depth of 1 has been exceeded.");
						expect(err.route).to.deep.equal(["foo", "bar", "baz"]);
					}),
					apiD.close(),
					apiD.route("foo").close(),
					apiD.route("foo").route("bar").close(),
					apiD.route("foo").route("bar").route("baz").close(),
					apiD.route("foo").route("bar").route("baz").route("far").close()
				]);
			});

			it("should floor(maxDepth) if maxDepth is not integer", () => {
				return apiD.route("foo").route("bar").route("baz").route("far").route("faz").route("boo").then(() => {
					expect().fail("Deep routing should not be allowed for apiD after depth 3.");
				}, err => {
					expect(err.type).to.equal("route");
					expect(err.message).to.equal("The maximum routing depth of 3 has been exceeded.");
					expect(err.route).to.deep.equal(["foo", "bar", "baz", "far", "faz"]);
				});
			});
		});
	});

	describe("function mapping", () => {
		it("disabled: should reject all functions", () => {
			const router = routerGenerator({
				mapFunctions: false
			});
			const router2 = routerGenerator({
				mapFunctions: "none"
			});

			const api = owe.api({
				a() {}
			}, router, closer);
			const api2 = owe.api({
				a() {}
			}, router2, closer);

			return Promise.all([
				expect(api.route("a")).to.be.rejectedWith("'a' could not be routed."),
				expect(api2.route("a")).to.be.rejectedWith("'a' could not be routed.")
			]);
		});

		it("direct: should map functions as they are", () => {
			const router = routerGenerator({
				mapFunctions: "direct",
				mapRootFunction: "direct"
			});

			const o = () => {};
			const api = owe.api(o, router, closer);

			o.a = () => {};

			return api.route("a").then(result => {
				expect(result).to.equal(o.a);
			});
		});

		it("call: should map functions to their .call() result", () => {
			const router = routerGenerator({
				mapFunctions: "call",
				mapRootFunction: "call",
				deep: true
			});

			const o = () => ({
				prop: "test",
				a() {
					return this.prop;
				},
				b() {
					return {
						foo: "bar"
					};
				}
			});
			const api = owe.api(o, router, closer);

			return Promise.all([
				expect(api.route("a")).to.eventually.equal("test"),
				expect(api.route("b").route("foo")).to.eventually.equal("bar")
			]);
		});

		it("router: should map functions to be a router", () => {
			const router = routerGenerator({
				mapFunctions: "router",
				mapRootFunction: "router",
				deep: true
			});

			const o = {
				props: {
					a: 42,
					b: "test",
					c: false,
					d: Symbol("foo"),
					e() {},
					f: {
						bar: "baz"
					}
				},
				router(key) {
					return this.props[key];
				}
			};
			const api = owe.api(o, router, closer).route("router");

			const promises = [];

			for(const key of Object.keys(o.props))
				promises.push(expect(api.route(key)).to.eventually.equal(o.props[key]));

			promises.push(expect(api.route("f").route("bar")).to.eventually.equal(o.props.f.bar));

			promises.push(owe.api(o.router.bind(o), router, closer).route("f").route("bar").then(result => {
				expect(result).to.equal(o.props.f.bar);
			}));

			return Promise.all(promises);
		});

		it("closer: should map functions to be a closer", () => {
			const router = routerGenerator({
				mapFunctions: "closer",
				mapRootFunction: "closer"
			});

			const o = {
				props: {
					a: 42,
					b: "test",
					c: false,
					d: Symbol("foo"),
					e() {},
					f: {
						bar: "baz"
					}
				},
				closer(key) {
					return this.props[key];
				}
			};
			const api = owe.api(o, router, closer).route("closer");

			const promises = [];

			for(const key of Object.keys(o.props))
				promises.push(expect(api.close(key)).to.eventually.equal(o.props[key]));

			promises.push(owe.api(() => {}, router, closer).route("test").then(() => {
				expect().fail("Routing a closer should not be possible.");
			}, err => {
				expect(err.type).to.equal("route");
				expect(err.route).to.deep.equal(["test"]);
				expect(err.message).to.equal("'test' could not be routed.");
			}));

			promises.push(api.route("test").then(() => {
				expect().fail("Routing a closer should not be possible.");
			}, err => {
				expect(err.type).to.equal("route");
				expect(err.route).to.deep.equal(["closer", "test"]);
				expect(err.message).to.equal("'test' could not be routed.");
			}));

			return Promise.all(promises);
		});

	});

	describe("filter", () => {
		let dest;

		const o = owe({
			a: "John Doe",
			b: "Adam Smith",
			foo: [1, 2, 3.4],
			baz: true
		}, routerGenerator({
			filter(destination) {
				expect(destination).to.equal(dest);
				expect(this.value).to.equal(o);
				expect(this.route).to.deep.equal([]);

				return destination.length === 1;
			}
		}), closer);

		it("should filter with functions", () => {
			const promises = [
				() => owe.api(o).route(dest = "a"),
				() => owe.api(o).route(dest = "b"),
				() => owe.api(o).route(dest = "c").then(() => {
					expect().fail("c should not be routed.");
				}, err => {
					expect(err.type).to.equal("route");
					expect(err.message).to.equal("'c' could not be routed.");
					expect(err.route).to.deep.equal(["c"]);
				}),
				() => owe.api(o).route(dest = "foo").then(() => {
					expect().fail("foo should not be routed.");
				}, err => {
					expect(err.type).to.equal("route");
					expect(err.message).to.equal("'foo' could not be routed.");
					expect(err.route).to.deep.equal(["foo"]);
				}),
				() => owe.api(o).route(dest = "baz").then(() => {
					expect().fail("baz should not be routed.");
				}, err => {
					expect(err.type).to.equal("route");
					expect(err.message).to.equal("'baz' could not be routed.");
					expect(err.route).to.deep.equal(["baz"]);
				})
			];

			let res;

			for(const p of promises) {
				if(!res) {
					res = p();
					continue;
				}
				res = res.then(p);
			}

			return res;
		});
	});

	describe("writable", () => {
		const o = owe({
			a: "John Doe",
			A: "Adam Smith"
		}, routerGenerator({
			writable(destination) {
				expect(this.value).to.equal(o);
				expect(this.route).to.deep.equal([]);

				return destination.toLowerCase() === destination;
			},
			filter: true
		}), closer);

		it("should filter with functions", () => {
			return owe.api(o).route("a").close("X").then(val => {
				expect(val).to.equal("X");
				expect(o.a).to.equal("X");

				return owe.api(o).route("A").close("Y");
			}).then(() => {
				console.log("x", o);

				expect().fail("A should not be writable.");
			}, err => {
				expect(o.a).to.equal("X");
				expect(err.type).to.equal("close");
				expect(err.route).to.deep.equal(["A"]);
			});
		});
	});

	describe("output", () => {
		it("should replace the output", () => {
			const o = owe({
				a: "John Doe",
				b: "Adam Smith",
				foo: [1, 2, 3.4],
				baz: true
			}, routerGenerator({
				output(value) {
					expect(this.value).to.equal(o);
					expect(this.route).to.deep.equal([]);

					if(typeof value === "string")
						return value.toUpperCase();
					if(typeof value === "boolean")
						throw "derp";

					return { value };
				}
			}), closer);

			return Promise.all([
				expect(owe.api(o).route("a")).to.eventually.equal("JOHN DOE"),
				expect(owe.api(o).route("b")).to.eventually.equal("ADAM SMITH"),
				expect(owe.api(o).route("foo")).to.become({
					value: o.foo
				}),
				owe.api(o).route("baz").then(() => {
					expect().fail("baz should not be returned");
				}, err => {
					expect(err).to.equal("derp");
				})
			]);
		});
	});
}

module.exports = testRouter;
