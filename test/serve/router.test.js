const expect = require("expect.js");

const owe = require("owe-core"),
	router = owe.serve.router,
	Binding = owe.Binding;

describe(".router", function() {
	it("should return a function", function() {
		expect(router()).to.be.a("function");
	});

	testRouter(router);

});

function testRouter(routerGenerator) {

	const closer = function() {
		return this.value; // Just output the given input.
	};

	describe("default", function() {

		const router = routerGenerator();

		it("should route functions at root as objects", function() {

			const f = function(a) {
					return "test";
				},
				api = owe.api(f, router, closer);

			f.path = 42;

			return api.route("path").then(function(result) {
				expect(result).to.be(42);
			});
		});

		it("should route objects as objects", function() {

			const api = owe.api({
				path: "Hello World!"
			}, router, closer);

			return api.route("path").then(function(result) {
				expect(result).to.be("Hello World!");
			});

		});

		it("should not traverse objects deeply", function() {

			const o = {
					foo: {
						bar: {
							baz: 42
						}
					}
				},
				api = owe.api(o, router, closer);

			return Promise.all([
				api.route("foo").then(function(result) {
					expect(result).to.be(o.foo);
				}),
				api.route("foo").route("bar").route("baz").then(function() {
					expect().fail("Traversing into an object should be disabled.");
				}, function(err) {
					expect(err.message).to.be("Object at position 'foo' is an end point and cannot be routed.");
					expect(err.type).to.be("route");
					expect(err.location).to.eql(["foo", "bar"]);
				})
			]);

		});

		it("should output member functions bound to the object they came from", function() {
			const o = {
					test: function() {
						if(arguments.length)
							return arguments.length;

						return this;
					}
				},
				api = owe.api(o, router, closer);

			return api.route("test").then(function(result) {
				expect(result(1, 2, 9, 4, null, 6, "7")).to.be(7);
				expect(result()).to.be(o);
			});
		});

	});

	describe("deep traversing", function() {

		function defaultRequirements(router, options) {

			if(options.objects)
				it("should traverse normal objects", function() {

					const o = {
							foo: {
								bar: {
									baz: Symbol("test")
								}
							}
						},
						api = owe.api(o, router, closer).route("foo");

					return Promise.all([
						api.then(function(result) {
							expect(result).to.be(o.foo);
						}),
						api.route("bar").then(function(result) {
							expect(result).to.be(o.foo.bar);
						}),
						api.route("bar").route("baz").then(function(result) {
							expect(result).to.be(o.foo.bar.baz);
						})
					]);
				});

			if(options.arrays)
				it("should not traverse arrays", function() {

					const o = {
							foo: [1, 2, 3.4, [5, 6]]
						},
						api = owe.api(o, router, closer).route("foo");

					return Promise.all([
						api.route(0).then(function() {
							expect().fail("Arrays should not be traversed.");
						}, function(err) {
							expect(err.message).to.be("Object at position 'foo' is an end point and cannot be routed.");
							expect(err.type).to.be("route");
							expect(err.location).to.eql(["foo", 0]);
						}),
						api.then(function(result) {
							expect(result).to.be(o.foo);
						})
					]);
				});

			if(options.functions)
				it("should not traverse functions", function() {
					const o = {
							f: function() {}
						},
						api = owe.api(o, router, closer);

					o.f.path = "test";

					return api.route("f").route("path").then(function() {
						expect().fail("Functions should not be traversed.");
					}, function(err) {
						expect(err.message).to.be("Object at position 'f' is an end point and cannot be routed.");
						expect(err.type).to.be("route");
						expect(err.location).to.eql(["f", "path"]);
					});
				});

			if(options.deepen)
				it("should not deepen objects", function() {
					const o = {
							foo: {
								bar: {
									baz: Symbol("test")
								}
							}
						},
						api = owe.api(o, router, closer).route("foo").route("bar");

					return api.route("baz").then(function(result) {
						expect(Binding.isBound(o)).to.be(true);
						expect(Binding.isBound(o.foo)).to.be(false);
						expect(Binding.isBound(o.foo.bar)).to.be(false);
						expect(Binding.isBound(o.foo.bar.baz)).to.be(false);
					});
				});
		}

		describe("default", function() {
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

		describe("deep arrays", function() {
			const router = routerGenerator({
				deep: true,
				deepArrays: true
			});

			defaultRequirements(router, {
				objects: true,
				functions: true,
				deepen: true
			});

			it("should traverse arrays", function() {

				const o = {
						foo: [1, 2, 3.4, [5, 6]]
					},
					api = owe.api(o, router, closer).route("foo");

				return Promise.all([
					api.route(0).then(function(result) {
						expect(result).to.be(o.foo[0]);
					}),
					api.route(1 + 2).route("0").then(function(result) {
						expect(result).to.be(o.foo[3][0]);
					}),
					api.then(function(result) {
						expect(result).to.be(o.foo);
					})
				]);
			});

		});

		describe("deep functions", function() {
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

			it("should traverse functions", function() {
				const o = function o() {},
					api = owe.api(o, router, closer);

				o.f = function a() {};

				o.f.g = function b() {};

				o.f.g.h = 42;

				return Promise.all([
					api.then(function(result) {
						expect(result).to.be(o);
					}),
					api.route("f").then(function(result) {
						expect(result).to.be(o.f);
					}),
					api.route("f").route("g").then(function(result) {
						expect(result).to.be(o.f.g);
					}),
					api.route("f").route("g").route("h").then(function(result) {
						expect(result).to.be(o.f.g.h);
					})
				]);
			});
		});

		describe("deepen objects", function() {
			const router = routerGenerator({
				deep: true,
				deepen: true,
				deepFunctions: true,
				deepArrays: true
			});

			defaultRequirements(router, {
				objects: true
			});

			it("should deepen objects", function() {
				const o = {
						foo: {
							bar: {
								baz: ["a", "b", "c"],
								fuz: 42
							},
							buz: function() {
								return this;
							}
						}
					},
					api = owe.api(o, router, closer).route("foo");

				return Promise.all([
					api.route("bar").route("baz").route(1),
					api.route("buz")
				]).then(function(results) {
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

		describe("max depth", function() {

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

			it("should forbid deep traversing for non-numeric or negative numbers", function() {
				return Promise.all([
					apiA.then(function(result) {
						expect(result).to.be(o);
					}),
					apiA.route("foo").route("bar").then(function(result) {
						expect().fail("Deep routing should not be allowed for apiA.");
					}, function(err) {
						expect(err.type).to.be("route");
						expect(err.message).to.be("Object at position 'foo' is an end point and cannot be routed.");
						expect(err.location).to.eql(["foo", "bar"]);
					}),
					apiB.route("foo").route("bar").then(function(result) {
						expect().fail("Deep routing should not be allowed for apiB.");
					}, function(err) {
						expect(err.type).to.be("route");
						expect(err.message).to.be("Object at position 'foo' is an end point and cannot be routed.");
						expect(err.location).to.eql(["foo", "bar"]);
					}),
					apiE.route("foo").route("bar").then(function(result) {
						expect().fail("Deep routing should not be allowed for apiE.");
					}, function(err) {
						expect(err.type).to.be("route");
						expect(err.message).to.be("Object at position 'foo' is an end point and cannot be routed.");
						expect(err.location).to.eql(["foo", "bar"]);
					})
				]);
			});

			it("should allow less or exactly maxDepth deep traversals", function() {
				return Promise.all([
					apiC.close(),
					apiC.route("foo").close(),
					apiC.route("foo").route("bar").close(),
					apiC.route("foo").route("bar").route("baz").then(function(result) {
						expect().fail("Deep routing should not be allowed for apiC after depth 1.");
					}, function(err) {
						expect(err.type).to.be("route");
						expect(err.message).to.be("The maximum routing depth of 1 has been exceeded.");
						expect(err.location).to.eql(["foo", "bar", "baz"]);
					}),
					apiD.close(),
					apiD.route("foo").close(),
					apiD.route("foo").route("bar").close(),
					apiD.route("foo").route("bar").route("baz").close(),
					apiD.route("foo").route("bar").route("baz").route("far").close()
				]);
			});

			it("should floor(maxDepth) if maxDepth is not integer", function() {
				return apiD.route("foo").route("bar").route("baz").route("far").route("faz").route("boo").then(function(result) {
					expect().fail("Deep routing should not be allowed for apiD after depth 3.");
				}, function(err) {
					expect(err.type).to.be("route");
					expect(err.message).to.be("The maximum routing depth of 3 has been exceeded.");
					expect(err.location).to.eql(["foo", "bar", "baz", "far", "faz"]);
				});
			});
		});
	});

	describe("function mapping", function() {

		it("direct: should map functions as they are", function() {

			const router = routerGenerator({
				mapFunctions: "direct",
				mapRootFunction: "direct"
			});

			const o = function() {},
				api = owe.api(o, router, closer);

			o.a = function() {};

			return api.route("a").then(function(result) {
				expect(result).to.be(o.a);
			});
		});

		it("call: should map functions to their .call() result", function() {

			const router = routerGenerator({
				mapFunctions: "call",
				mapRootFunction: "call",
				deep: true
			});

			const o = function() {
					return {
						prop: "test",
						a: function() {
							return this.prop;
						},
						b: function() {
							return {
								foo: "bar"
							};
						}
					};
				},
				api = owe.api(o, router, closer);

			return Promise.all([
				api.route("a").then(function(result) {
					expect(result).to.be("test");
				}),
				api.route("b").route("foo").then(function(result) {
					expect(result).to.be("bar");
				})
			]);
		});

		it("router: should map functions to be a router", function() {

			"use strict";

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
						e: function() {},
						f: {
							bar: "baz"
						}
					},
					router: function(key) {
						return this.props[key];
					}
				},
				api = owe.api(o, router, closer).route("router");

			const promises = [];

			for(let key in o.props)
				promises.push(api.route(key).then(function(result) {
					expect(result).to.be(o.props[key]);
				}));

			promises.push(api.route("f").route("bar").then(function(result) {
				expect(result).to.be(o.props.f.bar);
			}));

			promises.push(owe.api(o.router.bind(o), router, closer).route("f").route("bar").then(function(result) {
				expect(result).to.be(o.props.f.bar);
			}));

			return Promise.all(promises);
		});

		it("closer: should map functions to be a closer", function() {

			"use strict";

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
						e: function() {},
						f: {
							bar: "baz"
						}
					},
					closer: function(key) {
						return this.props[key];
					}
				},
				api = owe.api(o, router, closer).route("closer");

			const promises = [];

			for(let key in o.props)
				promises.push(api.close(key).then(function(result) {
					expect(result).to.be(o.props[key]);
				}));

			promises.push(owe.api(function() {}, router, closer).route("test").then(function() {
				expect().fail("Routing a closer should not be possible.");
			}, function(err) {
				expect(err.type).to.be("route");
				expect(err.location).to.eql(["test"]);
				expect(err.message).to.be("'test' could not be routed.");
			}));

			return Promise.all(promises);
		});

	});

	describe("filter", function() {
		const o = owe({
			a: "John Doe",
			b: "Adam Smith",
			foo: [1, 2, 3.4],
			baz: true
		}, routerGenerator({
			filter: filter
		}), closer);

		var dest;

		function filter(destination) {
			expect(destination).to.be(dest);
			expect(this.value).to.be(o);
			expect(this.location).to.eql([]);

			return destination.length == 1;
		}

		it("should filter with functions", function() {
			return owe.api(o).route(dest = "a").then(function() {
				return owe.api(o).route(dest = "b");
			}).then(function() {
				return owe.api(o).route(dest = "c");
			}).then(function() {
				expect().fail("c should not be routed.");
			}, function(err) {
				expect(err.type).to.be("route");
				expect(err.message).to.be("'c' could not be routed.");
				expect(err.location).to.eql(["c"]);

				return owe.api(o).route(dest = "foo");
			}).then(function() {
				expect().fail("foo should not be routed.");
			}, function(err) {
				expect(err.type).to.be("route");
				expect(err.message).to.be("'foo' could not be routed.");
				expect(err.location).to.eql(["foo"]);

				return owe.api(o).route(dest = "baz");
			}).then(function() {
				expect().fail("baz should not be routed.");
			}, function(err) {
				expect(err.type).to.be("route");
				expect(err.message).to.be("'baz' could not be routed.");
				expect(err.location).to.eql(["baz"]);
			});
		});

		it("should invert if filterInverse is set", function() {
			return owe.api(o, routerGenerator({
				filter: false,
				filterInverse: true
			}), closer, true).route("a");
		});
	});

	describe("output", function() {
		it("should replace the output", function() {
			const o = owe({
				a: "John Doe",
				b: "Adam Smith",
				foo: [1, 2, 3.4],
				baz: true
			}, routerGenerator({
				output: function(value) {

					expect(this.value).to.be(o);
					expect(this.location).to.eql([]);

					if(typeof value === "string")
						return value.toUpperCase();
					if(typeof value === "boolean")
						throw "derp";

					return {
						value: value
					};
				}
			}), closer);

			return Promise.all([
				owe.api(o).route("a").then(function(result) {
					expect(result).to.be("JOHN DOE");
				}),
				owe.api(o).route("b").then(function(result) {
					expect(result).to.be("ADAM SMITH");
				}),
				owe.api(o).route("foo").then(function(result) {
					expect(result).to.eql({
						value: o.foo
					});
				}),
				owe.api(o).route("baz").then(function(result) {
					expect().fail("baz should not be returned");
				}, function(err) {
					expect(err).to.be("derp");
				})
			]);
		});
	});
}

module.exports = testRouter;
