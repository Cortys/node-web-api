var expect = require("expect.js");

var nwa = require("../src"),
	Binding = require("../src/Binding"),
	Api = require("../src/Api");

describe("Api", function() {

	var object = Binding.bind({
			a: 1,
			b: 2,
			c: 3
		}, function(a) {
			if(a)
				return this.object;
		}, function(key) {
			if(!(key in this.value))
				throw new Error(key + " not found.");
			return this.value[key];
		}),
		api = new Api(object);

	describe("#route()", function() {
		it("should return an Api", function() {
			expect(api.route()).to.be.an(Api);
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
			return Promise.all([
				api.close("d").then(function() {
					expect().fail("This request should have thrown.");
				}, function(err) {
					expect(err.message).to.be("d not found.");
				}),
				api.close().then(function() {
					expect(undefined).fail("This request should have thrown.");
				}, function(err) {
					expect(err.message).to.be("undefined not found.");
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
