var expect = require("expect.js");

var owe = require("../../../src"),
	router = owe.serve.router,
	Binding = require("../../../src/Binding");

describe(".router", function() {
	it("should return a function", function() {
		expect(router()).to.be.a("function");
	});

	testRouter(router);

});

function testRouter(routerGenerator) {

	var closer = function() {
		return this.value; // Just output the given input.
	};

	describe("default", function() {

		var router = routerGenerator();

		it("should route functions at root as objects", function() {

			var f = function(a) {
					return "test";
				},
				api = owe.api(f, router, closer);

			f.path = 42;

			return api.route("path").then(function(result) {
				expect(result).to.be(42);
			});
		});

		it("should route objects as objects", function() {

			var api = owe.api({
				path: "Hello World!"
			}, router, closer);

			return api.route("path").then(function(result) {
				expect(result).to.be("Hello World!");
			});

		});

		it("should not traverse objects deeply", function() {

			var o = {
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
			var o = {
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

					var o = {
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

					var o = {
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
					var o = {
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
					var o = {
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
			var router = routerGenerator({
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
			var router = routerGenerator({
				deep: true,
				deepArrays: true
			});

			defaultRequirements(router, {
				objects: true,
				functions: true,
				deepen: true
			});

			it("should traverse arrays", function() {

				var o = {
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
			var router = routerGenerator({
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
				var o = function o() {},
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
			var router = routerGenerator({
				deep: true,
				deepen: true,
				deepFunctions: true,
				deepArrays: true
			});

			defaultRequirements(router, {
				objects: true
			});

			it("should deepen objects", function() {
				var o = {
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

		});
	});

	describe("function mapping", function() {

		it("direct: should map functions as they are", function() {

			var router = routerGenerator({
				mapFunctions: "direct"
			});

			var o = {
					a: function() {}
				},
				api = owe.api(o, router, closer);

			return api.route("a").then(function(result) {
				expect(result).to.be(o.a);
			});
		});

		it("call: should map functions to their .call() result", function() {

			var router = routerGenerator({
				mapFunctions: "call",
				deep: true
			});

			var o = {
					prop: "test",
					a: function() {
						return this.prop;
					},
					b: function() {
						return {
							foo: "bar"
						};
					}
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

			var router = routerGenerator({
				mapFunctions: "router",
				deep: true
			});

			var o = {
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

			var promises = [];

			for(let key in o.props)
				promises.push(api.route(key).then(function(result) {
					expect(result).to.be(o.props[key]);
				}));

			return Promise.all(promises);
		});
	});

	describe("filters", function() {

	});
}

module.exports = testRouter;
