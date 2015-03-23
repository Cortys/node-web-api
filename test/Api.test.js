var expect = require("expect.js");

var nwa = require("../src"),
	Binding = require("../src/Binding"),
	Api = require("../src/Api");

describe("Api", function() {

	var object = Binding.bind({
			a: 1,
			b: 2,
			c: 3
		}, function() {}, function(key) {
			if(!(key in this.value))
				throw new Error(key + " not found.");
			return this.value[key];
		}),
		api = new Api(object);

	describe("#route()", function() {

	});

	describe("#close()", function() {

	});

	describe("#object", function() {
		it("should contain a promise to the bound object this api exposes", function() {
			return api.object.then(function(apiObject) {
				expect(apiObject).to.be(object);
			});
		});
	});
});
