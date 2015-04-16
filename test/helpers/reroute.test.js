var expect = require("expect.js");

var owe = require("../../src");

describe(".reroute", function() {

	var o = owe({
		param: "crazy"
	}, function(destination) {

		this.value.derp = Math.random();

		return owe(Object.create(this.value, {
			param: {
				value: destination
			}
		}), this.binding);
	}, function(data) {

		this.value.derp = Math.random();

		return this.value.param.toUpperCase() + " " + data;
	});

	it("should return an object with a router and a closer function", function() {

		var result = owe.reroute({});

		expect(result).to.be.an("object");
		expect(result.router).to.be.a("function");
		expect(result.closer).to.be.a("function");
	});

	it("result should be accepted by owe-function", function() {
		expect(owe).withArgs(null, owe.reroute({})).not.to.throwError();
	});

	describe(".call() result", function() {

		it("should contain empty router if mode = closer", function() {
			expect(owe.reroute({}, {
				mode: "closer"
			}).router.toString()).to.eql(function() {}.toString());
		});

		it("should contain empty closer if mode = router", function() {
			expect(owe.reroute({}, {
				mode: "router"
			}).closer.toString()).to.eql(function() {}.toString());
		});

		var rerouting = owe.reroute(o);

		describe(".router", function() {
			var dummy = owe({}, rerouting.router, function() {});

			it("should return routing result of the rerouting target", function() {
				return owe.api(dummy).route("foo").route("hello").close("WORLD").then(function(result) {
					expect(result).to.be("HELLO WORLD");
					expect(dummy).to.eql({});
				});
			});

		});

		describe(".closer", function() {

			var dummy = owe({}, function() {}, rerouting.closer);

			it("should return closing result of the rerouting target", function() {
				return owe.api(dummy).close("STUFF").then(function(result) {
					expect(result).to.be("CRAZY STUFF");
					expect(dummy).to.eql({});
				});
			});

		});

	});

});
