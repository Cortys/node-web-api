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
				api = owe(f, router, closer);

			f.path = 42;

			return api.route("path").close().then(function(result) {
				expect(result).to.be(42);
			});
		});

		it("should route objects as objects", function() {

			var api = owe({
				path: "Hello World!"
			}, router, closer);

			return api.route("path").close().then(function(result) {
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
				api = owe(o, router, closer);

			return Promise.all([
				api.route("foo").close().then(function(result) {
					expect(result).to.be(o.foo);
				}),
				api.route("foo").route("bar").route("baz").close().then(function() {
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
				api = owe(o, router, closer);

			return api.route("test").close().then(function(result) {
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
						api = owe(o, router, closer).route("foo");

					return Promise.all([
						api.close().then(function(result) {
							expect(result).to.be(o.foo);
						}),
						api.route("bar").close().then(function(result) {
							expect(result).to.be(o.foo.bar);
						}),
						api.route("bar").route("baz").close().then(function(result) {
							expect(result).to.be(o.foo.bar.baz);
						})
					]);
				});

			if(options.arrays)
				it("should not traverse arrays", function() {

					var o = {
							foo: [1, 2, 3.4, [5, 6]]
						},
						api = owe(o, router, closer).route("foo");

					return Promise.all([
						api.route(0).close().then(function() {
							expect().fail("Arrays should not be traversed.");
						}, function(err) {
							expect(err.message).to.be("Object at position 'foo' is an end point and cannot be routed.");
							expect(err.type).to.be("route");
							expect(err.location).to.eql(["foo", 0]);
						}),
						api.close().then(function(result) {
							expect(result).to.be(o.foo);
						})
					]);
				});

			if(options.functions)
				it("should not traverse functions", function() {
					var o = {
							f: function() {}
						},
						api = owe(o, router, closer);

					o.f.path = "test";

					return api.route("f").route("path").close().then(function() {
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
						api = owe(o, router, closer).route("foo").route("bar");

					return api.route("baz").close().then(function(result) {
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
					api = owe(o, router, closer).route("foo");

				return Promise.all([
					api.route(0).close().then(function(result) {
						expect(result).to.be(o.foo[0]);
					}),
					api.route(1 + 2).route("0").close().then(function(result) {
						expect(result).to.be(o.foo[3][0]);
					}),
					api.close().then(function(result) {
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
					api = owe(o, router, closer);

				o.f = function a() {};

				o.f.g = function b() {};

				o.f.g.h = 42;

				return Promise.all([
					api.close().then(function(result) {
						expect(result).to.be(o);
					}),
					api.route("f").close().then(function(result) {
						expect(result).to.be(o.f);
					}),
					api.route("f").route("g").close().then(function(result) {
						expect(result).to.be(o.f.g);
					}),
					api.route("f").route("g").route("h").close().then(function(result) {
						expect(result).to.be(o.f.g.h);
					})
				]);
			});
		});

		describe("deepen objects", function() {

		});

		describe("max depth", function() {

		});
	});

	describe("function mapping", function() {

	});

	describe("filters", function() {

	});
}

module.exports = testRouter;
