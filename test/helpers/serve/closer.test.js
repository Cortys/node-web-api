var expect = require("expect.js");

var owe = require("../../../src"),
	closer = owe.serve.closer;

describe(".closer", function() {
	it("should return a function", function() {
		expect(closer()).to.be.a("function");
	});

	testCloser(closer);

});

function testCloser(closerGenerator) {

	var router = owe.serve.router();

	describe("default", function() {

		var o = owe({
			foo: "bar",
			o: {},
			a: [],
			f: function(input) {
				return Promise.resolve(input + "!");
			}
		}, router, closerGenerator());

		it("should not be writable", function() {
			return owe.api(o).route("foo").close("baz").then(function() {
				expect().fail("foo should not be closable with data.");
			}, function(err) {
				expect(err.type).to.be("close");
				expect(err.message).to.be("This route could not be closed with data 'baz'.");
				expect(o.foo).to.be("bar");
			});
		});

		it("should not output objects (except from Arrays)", function() {
			return Promise.all([
				owe.api(o).route("o").close().then(function() {
					expect().fail("o should not be closable.");
				}, function(err) {
					expect(err.type).to.be("close");
					expect(err.message).to.be("This route could not be closed.");
				}),
				owe.api(o).route("a").then(function(result) {
					expect(result).to.be(o.a);
				})
			]);
		});

		it("should call functions instead of returning them", function() {
			return owe.api(o).route("f").close("Hello World").then(function(result) {
				expect(result).to.be("Hello World!");
			});
		});

	});

	describe("writable", function() {

		it("should write object properties if enabled", function() {
			var o = {
					foo: "bar"
				},
				api = owe.api(o, router, closerGenerator({
					writable: false,
					writableInverse: true
				}));

			return api.route("foo").close("baz").then(function(result) {
				expect(result).to.be("baz");
				expect(o.foo).to.be("baz");
			});
		});

		it("should pass State and data of close to writable if it is a filter function", function() {
			var foo = "bar",
				o = {
					get foo() {
						return foo;
					},
					set foo(val) {
						foo = val;
						return 42;
					}
				},
				api = owe.api(o, router, closerGenerator({
					writable: function(data) {

						expect(data).to.be("baz");
						expect(this.value).to.be("bar");
						expect(this.location).to.eql(["foo"]);

						return Promise.resolve(true);
					}
				}));

			return api.route("foo").close("baz").then(function(result) {
				expect(result).to.be("baz");
				expect(o.foo).to.be("baz");
			});
		});

	});

}

module.exports = testCloser;
