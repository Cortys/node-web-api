var expect = require("expect.js");

var nwa = require("../src"),
	Binding = require("../src/Binding");

describe("Binding", function() {

	describe(".isBound()", function() {
		it("should return true for objects that were bound", function() {
			var boundObject = Binding.bind(null, function() {}, function() {});
			expect(Binding.isBound(boundObject)).to.be(true);
		});

		it("should return false for everything that was not bound", function() {
			expect(Binding.isBound(null)).to.be(false);
			expect(Binding.isBound(undefined)).to.be(false);
			expect(Binding.isBound({})).to.be(false);
			expect(Binding.isBound(true)).to.be(false);
			expect(Binding.isBound(3)).to.be(false);
			expect(Binding.isBound("test")).to.be(false);
			expect(Binding.isBound(function() {})).to.be(false);
			expect(Binding.isBound(Symbol("test"))).to.be(false);
		});
	});

	describe(".key", function() {
		it("should be used as key in bound objects to point to Binding objects", function() {
			var object = {};
			Binding.bind(object, function() {}, function() {});
			expect(object[Binding.key]).to.be.a(Binding);
		});
	});

	describe(".call() or .bind()", function() {
		it("can be called directly or by calling Binding.bind", function() {
			expect(Binding).to.be(Binding.bind);
			expect(Binding.isBound(Binding({}, function() {}, function() {}))).to.be.ok();
			expect(Binding.isBound(Binding.bind({}, function() {}, function() {}))).to.be.ok();
		});

		it("only binds objects, functions and null", function() {
			expect(Binding.bind).withArgs(undefined, function() {}, function() {}).to.throwError();
			expect(Binding.bind).withArgs("test", function() {}, function() {}).to.throwError();
			expect(Binding.bind).withArgs(false, function() {}, function() {}).to.throwError();
			expect(Binding.bind).withArgs(Symbol("test"), function() {}, function() {}).to.throwError();

			expect(Binding.bind).withArgs(null, function() {}, function() {}).not.to.throwError();
			expect(Binding.bind).withArgs(function() {}, function() {}, function() {}).not.to.throwError();
			expect(Binding.bind).withArgs({}, function() {}, function() {}).not.to.throwError();
			expect(Binding.bind).withArgs([], function() {}, function() {}).not.to.throwError();
		});

		it("requires a router and a closer function", function() {
			expect(Binding.bind).withArgs({}).to.throwError();
			expect(Binding.bind).withArgs({}, function() {}).to.throwError();
			expect(Binding.bind).withArgs({}, undefined, function() {}).to.throwError();
			expect(Binding.bind).withArgs({}, [], []).to.throwError();
			expect(Binding.bind).withArgs({}, {}, {}).to.throwError();
			expect(Binding.bind).withArgs({}, "a", "b").to.throwError();
			expect(Binding.bind).withArgs({}, true, true).to.throwError();
			expect(Binding.bind).withArgs({}, 4, 11).to.throwError();
		});

		describe("type parameter", function() {
			it("should be optional and 'normal' by default", function() {
				expect(Binding.bind({}, function() {}, function() {})[Binding.key].type).to.be(Binding.types.normal);
			});

			it("when 'normal': only accepts unbound objects", function() {
				var object = {};
				expect(Binding.bind).withArgs(object, function() {}, function() {}).not.to.throwError();
				expect(Binding.bind).withArgs(object, function() {}, function() {}).to.throwError();
			});

			it("when 'clone': always binds to a prototypal descendant of the given object and returns it", function() {
				var object = {};
				expect(Binding.bind).withArgs(object, function() {}, function() {}).not.to.throwError();
				var clone;
				expect(function() {
					clone = Binding.bind(object, function() {}, function() {}, Binding.types.clone);
				}).not.to.throwError();
				expect(object.isPrototypeOf(clone)).to.be.ok();
			});
		});
	});

	var object = {
			the: "object"
		},
		location = ["a", "b", "c"],
		data = "ein test",
		router = function(data) {
			expect(this.value).to.be(object);
			expect(this.location).to.eql(location);
			expect(this.binding).to.be(binding);
			expect(data).to.be(data);
			return "result";
		},
		closer = router,
		binding = Binding.bind(object, router, closer)[Binding.key];

	describe("#router", function() {
		it("should contain the assigned router", function() {
			expect(binding.router).to.be(router);
		});
	});

	describe("#closer", function() {
		it("should contain the assigned closer", function() {
			expect(binding.closer).to.be(closer);
		});
	});

	describe("#type", function() {
		it("should contain the type used at Binding creation", function() {
			expect(Binding.bind({}, function() {}, function() {}, Binding.types.normal)[Binding.key].type).to.be(Binding.types.normal);
			expect(Binding.bind({}, function() {}, function() {}, Binding.types.clone)[Binding.key].type).to.be(Binding.types.clone);
			expect(Binding.bind({}, function() {}, function() {}, Binding.types.rebind)[Binding.key].type).to.be(Binding.types.rebind);
		});
	});

	describe("#route()", function() {
		it("should call .router() bound to a State with the given location and the given data as parameter", function() {
			expect(binding.route(location, data)).to.be("result");
		});
	});

	describe("#close()", function() {
		it("should call .closer() bound to a State with the given location and the given data as parameter", function() {
			expect(binding.close(location, data)).to.be("result");
		});
	});

});
