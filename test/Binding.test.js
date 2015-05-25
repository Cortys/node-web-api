var expect = require("expect.js");

var owe = require("../src"),
	Binding = require("../src/Binding");

describe("Binding", function() {

	describe(".isBound()", function() {
		it("should return true for objects that were bound", function() {
			var boundObject = Binding.bind(null, function() {}, function() {}),
				boundFunction = Binding.bind(function() {}, function() {}, function() {});
			expect(Binding.isBound(boundObject)).to.be(true);
			expect(Binding.isBound(boundFunction)).to.be(true);
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

	describe(".bind()", function() {

		var bindingFunction = Binding.bind.bind(Binding);

		it("can be used to bind to an object by calling bind", function() {
			expect(Binding.isBound(Binding.bind({}, function() {}, function() {}))).to.be.ok();
		});

		it("only binds objects, functions and null", function() {
			expect(bindingFunction).withArgs(undefined, function() {}, function() {}).to.throwError();
			expect(bindingFunction).withArgs("test", function() {}, function() {}).to.throwError();
			expect(bindingFunction).withArgs(false, function() {}, function() {}).to.throwError();
			expect(bindingFunction).withArgs(Symbol("test"), function() {}, function() {}).to.throwError();

			expect(bindingFunction).withArgs(null, function() {}, function() {}).not.to.throwError();
			expect(bindingFunction).withArgs(function() {}, function() {}, function() {}).not.to.throwError();
			expect(bindingFunction).withArgs({}, function() {}, function() {}).not.to.throwError();
			expect(bindingFunction).withArgs([], function() {}, function() {}).not.to.throwError();
		});

		it("requires a router and a closer function", function() {
			expect(bindingFunction).withArgs({}).to.throwError();
			expect(bindingFunction).withArgs({}, function() {}).to.throwError();
			expect(bindingFunction).withArgs({}, undefined, function() {}).to.throwError();
			expect(bindingFunction).withArgs({}, [], []).to.throwError();
			expect(bindingFunction).withArgs({}, {}, {}).to.throwError();
			expect(bindingFunction).withArgs({}, "a", "b").to.throwError();
			expect(bindingFunction).withArgs({}, true, true).to.throwError();
			expect(bindingFunction).withArgs({}, 4, 11).to.throwError();
		});

		describe("type parameter", function() {
			it("should be optional and 'normal' by default", function() {
				expect(Binding.bind({}, function() {}, function() {})[Binding.key].type).to.be(Binding.types.normal);
			});

			it("when 'normal': only accepts unbound objects", function() {
				var object = {};
				expect(bindingFunction).withArgs(object, function() {}, function() {}).not.to.throwError();
				expect(bindingFunction).withArgs(object, function() {}, function() {}).to.throwError();
			});

			it("when 'rebind': accepts all objects and rebinds them if neccessary", function() {
				var object = {};
				expect(bindingFunction).withArgs(object, function() {}, function() {}, Binding.types.rebind).not.to.throwError();
				expect(bindingFunction).withArgs(object, function() {}, function() {}, Binding.types.rebind).not.to.throwError();
			});

			it("when 'clone': binds to a new object that behaves as if it were the original object in Apis", function() {
				var object = {};
				expect(bindingFunction).withArgs(object, function() {}, function() {}).not.to.throwError();
				expect(Binding.isBound(object)).to.be(true);
				var clone;
				expect(function() {
					clone = Binding.bind(object, function() {}, function() {}, Binding.types.clone);
				}).not.to.throwError();
				expect(Binding.isBound(clone)).to.be(true);
				expect(Object.getPrototypeOf(clone)).to.be(null);
				expect(clone.object).to.be(object);
			});
		});
	});

	describe(".unbind()", function() {
		it("unbinds bound objects and returns them", function() {
			var o = {};

			var a = Binding.bind(o, function() {}, function() {});
			expect(a).to.be(o);
			expect(Binding.isBound(o)).to.be.ok();
			var b = Binding.unbind(o);
			expect(b).to.be(o);
			expect(Binding.isBound(o)).not.to.be.ok();
			var c = Binding.bind(o, function() {}, function() {});
			expect(c).to.be(o);
			expect(Binding.isBound(o)).to.be.ok();
		});

		it("just returns unbound objects and data", function() {

			var o = Object.freeze({}),
				f = function() {},
				s = Symbol();

			expect(Binding.unbind(o)).to.be(o);
			expect(Binding.unbind(true)).to.be(true);
			expect(Binding.unbind("test")).to.be("test");
			expect(Binding.unbind(5.5)).to.be(5.5);
			expect(Binding.unbind(s)).to.be(s);
			expect(Binding.unbind(f)).to.be(f);
		});

	});

	var object = {
			the: "object"
		},
		location = ["a", "b", "c"],
		data = "ein test",
		origin = {},
		router = function(pData) {
			expect(this.value).to.be(object);
			expect(this.location).to.eql(location);
			expect(this.binding).to.be(binding);
			expect(this.origin).to.be(origin);
			expect(data).to.be(pData);
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

	describe("#target", function() {
		it("should always contain the binding target object", function() {
			var o = {},
				oBound = Binding.bind(o, function() {}, function() {}, Binding.types.normal);
			expect(oBound[Binding.key].target).to.be(o);
			expect(oBound).to.be(o);

			var p = o,
				pBound = Binding.bind(o, function() {}, function() {}, Binding.types.rebind);
			expect(pBound[Binding.key].target).to.be(p);
			expect(pBound).to.be(p);

			var q = {},
				qBound = Binding.bind(q, function() {}, function() {}, Binding.types.clone);
			expect(qBound[Binding.key].target).to.be(q);
			expect(qBound).not.to.be(q);
		});
	});

	describe("#route()", function() {
		it("should call .router() bound to a State with the given location and the given data as parameter", function() {
			expect(binding.route(location, origin, data)).to.be("result");
		});
	});

	describe("#close()", function() {
		it("should call .closer() bound to a State with the given location and the given data as parameter", function() {
			expect(binding.close(location, origin, data)).to.be("result");
		});
	});

});
