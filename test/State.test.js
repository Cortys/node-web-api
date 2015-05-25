var expect = require("expect.js");

var owe = require("../src"),
	State = require("../src/State"),
	Binding = require("../src/Binding");

describe("State", function() {

	var value = {
			test: "Hello World.",
			value: 42,
			toString: function() {
				return this.test.toLowerCase();
			},
			valueOf: function() {
				return this.value;
			}
		},
		location = ["location", "of", "this", "state"],
		origin = {},
		binding = Binding.bind(null, function() {}, function() {})[Binding.key],
		state = new State(value, location, origin, binding);

	it("should be frozen", function() {
		expect(Object.isFrozen(state)).to.be.ok();
	});

	it("should adapt values valueOf method", function() {
		expect(state - 2).to.be(40);
	});

	it("should adapt values toString method", function() {
		expect(`I say '${String(state)}'!`).to.be("I say 'hello world.'!");
	});

	describe("#value", function() {
		it("should contain the assigned value", function() {
			expect(state.value).to.be(value);
		});
		it("should be read-only", function() {
			state.value = {
				something: "else"
			};
			expect(state.value).to.be(value);
		});
	});

	describe("#location", function() {
		it("should be an array", function() {
			expect(state.location).to.be.an("array");
		});
		it("should contain the assigned location", function() {
			expect(state.location).to.eql(location);
		});
		it("should be read-only", function() {
			state.location = ["something", "else"];
			expect(state.location).to.eql(location);
		});
	});

	describe("#origin", function() {
		it("should contain the assigned origin", function() {
			expect(state.origin).to.eql(origin);
		});
		it("should be read-only", function() {
			state.origin = "derp";
			expect(state.origin).to.eql(origin);
		});
	});

	describe("#binding", function() {
		it("should be a Binding", function() {
			expect(state.binding).to.be.a(Binding);
		});
		it("should contain the assigned binding", function() {
			expect(state.binding).to.be(binding);
		});
		it("should be read-only", function() {
			state.binding = null;
			expect(state.binding).to.be(binding);
		});
	});

	describe("#setValue()", function() {
		it("should require an object propery descriptor", function() {
			expect(function() {
				state.setValue(null);
			}).to.throwError();

			expect(function() {
				state.setValue(undefined);
			}).to.throwError();

			expect(function() {
				state.setValue(true);
			}).to.throwError();

			expect(function() {
				state.setValue(3);
			}).to.throwError();

			expect(function() {
				state.setValue("test");
			}).to.throwError();

			expect(function() {
				state.setValue(function() {});
			}).to.throwError();

			expect(function() {
				state.setValue({});
			}).not.to.throwError();

		});
		it("should not change the state itself", function() {
			state.setValue({
				value: "test"
			});
			expect(state.value).to.be(value);
		});
		it("should return a new State with the new value", function() {
			var modified = state.setValue({
				value: "test"
			});
			expect(modified).not.to.be(state);
			expect(modified).to.be.a(State);
			expect(modified.value).to.be("test");
		});
		it("should return a state with a .modified flag", function() {
			expect(state.modified).to.be(false);
			expect(state.setValue({}).modified).to.be(true);
		});
		it("can not make .value writable", function() {
			var modified = state.setValue({
				value: null,
				writable: true
			});
			modified.value = "test";
			expect(modified.value).to.be(null);
		});
		it("can define getter & setter functions for .value", function() {
			var hiddenValue = null,
				modified = state.setValue({
					get: function() {
						return hiddenValue;
					},
					set: function(val) {
						hiddenValue = val;
					}
				});
			modified.value = "test";
			expect(modified.value).to.be("test");
		});
	});
});
