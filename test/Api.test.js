var expect = require("expect.js");

var owe = require("../src"),
	Binding = require("../src/Binding"),
	State = require("../src/State"),
	Api = require("../src/Api");

describe("Api", function() {

	var object = Binding.bind({
			a: 1,
			b: 2,
			c: 3
		}, function(a) {
			if(a)
				return this.value;
		}, function(key) {
			expect(this).to.be.a(State);
			expect(this.value).to.be(object);
			if(!(key in this.value))
				throw new Error(key + " not found.");
			return this.value[key];
		}),
		api = new Api(object);

	describe("#route()", function() {
		it("should return an Api", function() {
			expect(api.route()).to.be.an(Api);
		});
		it("should return a navigatable Api when appropriate", function() {
			return api.route(true).close("a").then(function(data) {
				expect(data).to.be(1);
			});
		});
		it("should return a dead Api when used inappropriately", function() {
			return api.route().close("a").then(function(data) {
				expect().fail("This routing was invalid.");
			}, function(err) {
				expect(err.type).to.be("route");
				expect(err.location).to.eql([undefined]);
			});
		});
	});

	describe("#close()", function() {
		it("should return a Promise", function() {
			expect(api.close()).to.be.a(Promise);
		});
		it("should resolve with the requested data", function() {
			return Promise.all([
				api.close("a"),
				api.close("b"),
				api.close("c")
			]).then(function(result) {
				expect(result).to.eql([1, 2, 3]);
			});
		});
		it("should reject incorrect requests", function() {

			var error;

			return Promise.all([
				api.close("d").then(function() {
					expect().fail("This request should have thrown.");
				}, function(err) {
					expect(err.type).to.be("close");
					expect(err.location).to.eql([]);
					expect(err.data).to.be("d");
					expect(err.message).to.be("d not found.");
				}),
				api.then(function() {
					expect().fail("This request should have thrown.");
				}, function(err) {
					expect(err.type).to.be("close");
					expect(err.location).to.eql([]);
					expect(err.data).to.be(undefined);
					expect(err.message).to.be("undefined not found.");
				}),
				new Api(Binding.bind({}, function() {}, function() {
					error = new Error("A frozen error.");
					error.type = "foo";
					Object.defineProperty(error, "location", {
						get: function() {
							return undefined;
						},
						set: function() {
							throw new Error("Another error.");
						}
					});
					throw Object.freeze(error);
				})).then(function() {
					expect().fail("This request should have thrown.");
				}, function(err) {
					expect(err).to.be(error);
				})
			]);
		});
	});

	describe("#object", function() {
		it("should contain a promise to the bound object this api exposes", function() {
			return api.object.then(function(apiObject) {
				expect(apiObject).to.be(object);
			});
		});
	});
});
