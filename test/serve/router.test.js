"use strict";

const expect = require("expect.js");

const owe = require("owe-core");
const router = owe.serve.router;
const Binding = owe.Binding;

describe(".router", () => {
	it("should return a function", () => {
		expect(router()).to.be.a("function");
	});

	it("should only accept objects or functions as State#value when called", () => {
		expect(() => router().call({
			value: "not an object"
		})).to.throwError(new TypeError("Router expected object or function but got 'not an object'."));
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

			return api.route("path").then(result => {
				expect(result).to.be(42);
			});
		});

		it("should route objects as objects", () => {
			const api = owe.api({
				path: "Hello World!"
			}, router, closer);

			return api.route("path").then(result => {
				expect(result).to.be("Hello World!");
			});
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
				api.route("foo").then(result => {
					expect(result).to.be(o.foo);
				}),
				api.route("foo").route("bar").route("baz").then(() => {
					expect().fail("Traversing into an object should be disabled.");
				}, err => {
					expect(err.message).to.be("Object at position 'foo' is an end point and cannot be routed.");
					expect(err.type).to.be("route");
					expect(err.route).to.eql(["foo", "bar"]);
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
				expect(result(1, 2, 9, 4, null, 6, "7")).to.be(7);
				expect(result()).to.be(o);
			});
		});

		it("should handle object with null prototype routes", () => {
			return owe.api({}, router, closer).route({
				__proto__: null
			}).then(() => {
				expect().fail("'[object Object]' should not be routed.");
			}, err => {
				expect(err.type).to.be("route");
				expect(err.message).to.be("'[object Object]' could not be routed.");
				expect(err.route).to.eql([{}]);
			});
		});

		it("should handle symbol routes", () => {
			const symb = Symbol("test");

			return owe.api({}, router, closer).route(symb).then(() => {
				expect().fail("'Symbol(test)' should not be routed.");
			}, err => {
				expect(err.type).to.be("route");
				expect(err.message).to.be("'Symbol(test)' could not be routed.");
				expect(err.route).to.eql([symb]);
			});
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
						api.then(result => {
							expect(result).to.be(o.foo);
						}),
						api.route("bar").then(result => {
							expect(result).to.be(o.foo.bar);
						}),
						api.route("bar").route("baz").then(result => {
							expect(result).to.be(o.foo.bar.baz);
						})
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
							expect(err.message).to.be("Object at position 'foo' is an end point and cannot be routed.");
							expect(err.type).to.be("route");
							expect(err.route).to.eql(["foo", 0]);
						}),
						api.then(result => {
							expect(result).to.be(o.foo);
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
						expect(err.message).to.be("Object at position 'f' is an end point and cannot be routed.");
						expect(err.type).to.be("route");
						expect(err.route).to.eql(["f", "path"]);
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
						expect(Binding.isBound(o)).to.be(true);
						expect(Binding.isBound(o.foo)).to.be(false);
						expect(Binding.isBound(o.foo.bar)).to.be(false);
						expect(Binding.isBound(o.foo.bar.baz)).to.be(false);
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
					api.route(0).then(result => {
						expect(result).to.be(o.foo[0]);
					}),
					api.route(1 + 2).route("0").then(result => {
						expect(result).to.be(o.foo[3][0]);
					}),
					api.then(result => {
						expect(result).to.be(o.foo);
					})
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
					api.then(result => {
						expect(result).to.be(o);
					}),
					api.route("f").then(result => {
						expect(result).to.be(o.f);
					}),
					api.route("f").route("g").then(result => {
						expect(result).to.be(o.f.g);
					}),
					api.route("f").route("g").route("h").then(result => {
						expect(result).to.be(o.f.g.h);
					})
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
					expect(Binding.isBound(o)).to.be(true);
					expect(Binding.isBound(o.foo)).to.be(true);
					expect(Binding.isBound(o.foo.bar)).to.be(true);
					expect(Binding.isBound(o.foo.bar.baz)).to.be(true);

					// non-object types cannot be deepened:
					expect(Binding.isBound(o.foo.bar.fuz)).to.be(false);

					// buz-function is routed to its .bind(o.foo) result and thus not deepened:
					expect(Binding.isBound(o.foo.buz)).to.be(false);

					expect(results[0]).to.be("b");
					expect(results[1]()).to.be(o.foo);
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
						expect(result).to.be(o);
					}),
					apiA.route("foo").route("bar").then(() => {
						expect().fail("Deep routing should not be allowed for apiA.");
					}, err => {
						expect(err.type).to.be("route");
						expect(err.message).to.be("Object at position 'foo' is an end point and cannot be routed.");
						expect(err.route).to.eql(["foo", "bar"]);
					}),
					apiB.route("foo").route("bar").then(() => {
						expect().fail("Deep routing should not be allowed for apiB.");
					}, err => {
						expect(err.type).to.be("route");
						expect(err.message).to.be("Object at position 'foo' is an end point and cannot be routed.");
						expect(err.route).to.eql(["foo", "bar"]);
					}),
					apiE.route("foo").route("bar").then(() => {
						expect().fail("Deep routing should not be allowed for apiE.");
					}, err => {
						expect(err.type).to.be("route");
						expect(err.message).to.be("Object at position 'foo' is an end point and cannot be routed.");
						expect(err.route).to.eql(["foo", "bar"]);
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
						expect(err.type).to.be("route");
						expect(err.message).to.be("The maximum routing depth of 1 has been exceeded.");
						expect(err.route).to.eql(["foo", "bar", "baz"]);
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
					expect(err.type).to.be("route");
					expect(err.message).to.be("The maximum routing depth of 3 has been exceeded.");
					expect(err.route).to.eql(["foo", "bar", "baz", "far", "faz"]);
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
				api.route("a").then(() => {
					expect().fail("Routing functions should not be allowed if mapFunctions is disabled.");
				}, err => {
					expect(err.message).to.be("'a' could not be routed.");
				}),
				api2.route("a").then(() => {
					expect().fail("Routing functions should not be allowed if mapFunctions is disabled.");
				}, err => {
					expect(err.message).to.be("'a' could not be routed.");
				})
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
				expect(result).to.be(o.a);
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
				api.route("a").then(result => {
					expect(result).to.be("test");
				}),
				api.route("b").route("foo").then(result => {
					expect(result).to.be("bar");
				})
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

			for(const key in o.props)
				promises.push(api.route(key).then(result => {
					expect(result).to.be(o.props[key]);
				}));

			promises.push(api.route("f").route("bar").then(result => {
				expect(result).to.be(o.props.f.bar);
			}));

			promises.push(owe.api(o.router.bind(o), router, closer).route("f").route("bar").then(result => {
				expect(result).to.be(o.props.f.bar);
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

			for(const key in o.props)
				promises.push(api.close(key).then(result => {
					expect(result).to.be(o.props[key]);
				}));

			promises.push(owe.api(() => {}, router, closer).route("test").then(() => {
				expect().fail("Routing a closer should not be possible.");
			}, err => {
				expect(err.type).to.be("route");
				expect(err.route).to.eql(["test"]);
				expect(err.message).to.be("'test' could not be routed.");
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
				expect(destination).to.be(dest);
				expect(this.value).to.be(o);
				expect(this.route).to.eql([]);

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
					expect(err.type).to.be("route");
					expect(err.message).to.be("'c' could not be routed.");
					expect(err.route).to.eql(["c"]);
				}),
				() => owe.api(o).route(dest = "foo").then(() => {
					expect().fail("foo should not be routed.");
				}, err => {
					expect(err.type).to.be("route");
					expect(err.message).to.be("'foo' could not be routed.");
					expect(err.route).to.eql(["foo"]);
				}),
				() => owe.api(o).route(dest = "baz").then(() => {
					expect().fail("baz should not be routed.");
				}, err => {
					expect(err.type).to.be("route");
					expect(err.message).to.be("'baz' could not be routed.");
					expect(err.route).to.eql(["baz"]);
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

		it("should invert if filterInverse is set", () => {
			return owe.api(o, routerGenerator({
				filter: false,
				filterInverse: true
			}), closer, true).route("a");
		});
	});

	describe("writable", () => {
		const o = owe({
			a: "John Doe",
			A: "Adam Smith"
		}, routerGenerator({
			writable(destination) {
				expect(this.value).to.be(o);
				expect(this.route).to.eql([]);

				return destination.toLowerCase() === destination;
			},
			filter: true
		}), closer);

		it("should filter with functions", () => {
			return owe.api(o).route("a").close("X").then(val => {
				expect(val).to.be("X");
				expect(o.a).to.be("X");

				return owe.api(o).route("A").close("Y");
			}).then(() => {
				expect().fail("A should not be writable.");
			}, err => {
				expect(o.a).to.be("X");
				expect(err.type).to.be("close");
				expect(err.route).to.eql(["A"]);
			});
		});

		it("should invert if writableInverse is set", () => {
			return owe.api(o, routerGenerator({
				writable: false,
				writableInverse: true
			}), closer, true).route("a").close("Z").then(val => {
				expect(val).to.be("Z");
				expect(o.a).to.be("Z");
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
					expect(this.value).to.be(o);
					expect(this.route).to.eql([]);

					if(typeof value === "string")
						return value.toUpperCase();
					if(typeof value === "boolean")
						throw "derp";

					return { value };
				}
			}), closer);

			return Promise.all([
				owe.api(o).route("a").then(result => {
					expect(result).to.be("JOHN DOE");
				}),
				owe.api(o).route("b").then(result => {
					expect(result).to.be("ADAM SMITH");
				}),
				owe.api(o).route("foo").then(result => {
					expect(result).to.eql({
						value: o.foo
					});
				}),
				owe.api(o).route("baz").then(() => {
					expect().fail("baz should not be returned");
				}, err => {
					expect(err).to.be("derp");
				})
			]);
		});
	});
}

module.exports = testRouter;
