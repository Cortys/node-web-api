/* jshint mocha: true */

"use strict";

const expect = require("expect.js");

const owe = require("../src");

describe(".switch", function() {

	describe("without given cases", function() {
		it("should behave like the function returned by switcher", function() {
			const test = {
				a(p) {
					return "a" + this + p;
				},
				b(p) {
					return "b" + this + p;
				}
			};
			let s = false;
			const oweSwitch = owe.switch(() => test[(s = !s) ? "a" : "b"]);

			expect(oweSwitch.call(1, 2)).to.be("a12");
			expect(oweSwitch.call(1, 2)).to.be("b12");
			expect(oweSwitch.call(3, 4)).to.be("a34");
			expect(oweSwitch.call(3, 4)).to.be("b34");
		});

		it("should return the return value of switcher if it is not a function", function() {
			const test = {
				a: "x",
				b: "y"
			};
			let s = false;
			const oweSwitch = owe.switch(() => test[(s = !s) ? "a" : "b"]);

			expect(oweSwitch()).to.be("x");
			expect(oweSwitch()).to.be("y");
		});
	});

	describe("with given cases", function() {
		it("should behave like the function stored for the key that was returned by the switcher", function() {
			const test = {
				a(p) {
					return "a" + this + p;
				},
				b(p) {
					return "b" + this + p;
				}
			};
			let s = false;
			const oweSwitch = owe.switch(() => (s = !s) ? "a" : "b", test);

			expect(oweSwitch.call(1, 2)).to.be("a12");
			expect(oweSwitch.call(1, 2)).to.be("b12");
			expect(oweSwitch.call(3, 4)).to.be("a34");
			expect(oweSwitch.call(3, 4)).to.be("b34");
		});

		it("if the value of the key returned by the switcher is not a function, it should be returned", function() {
			const test = {
				a: "x",
				b: "y"
			};
			let s = false;
			const oweSwitch = owe.switch(() => (s = !s) ? "a" : "b", test);

			expect(oweSwitch()).to.be("x");
			expect(oweSwitch()).to.be("y");
		});

		it("should return an object if the given cases are objects", function() {
			const test = {
				a: {
					x(p) {
						return "ax" + this + p;
					},
					y(p) {
						return "ay" + this + p;
					},
					z: "az"
				},
				b: {
					x(p) {
						return "bx" + this + p;
					},
					y(p) {
						return "by" + this + p;
					},
					z: "bz"
				}
			};
			let s = false;
			const oweSwitch = owe.switch(() => (s = !s) ? "a" : "b", test);

			expect(oweSwitch.x.call(1, 2)).to.be("ax12");
			expect(oweSwitch.y.call(1, 2)).to.be("by12");
			expect(oweSwitch.y.call(3, 4)).to.be("ay34");
			expect(oweSwitch.x.call(3, 4)).to.be("bx34");
			expect(oweSwitch.z).to.be("az");
			expect(oweSwitch.z).to.be("bz");
		});

		it("should use the given fallback param if no case matches the switcher result", function() {
			const oweSwitch1 = owe.switch(() => "a", {}, word => `${word} works`);
			const oweSwitch2 = owe.switch(() => "a", {}, "it works");

			const oweSwitch3 = owe.switch(() => "a", {
				b: {
					x: "nope"
				}
			}, {
				x: "it works"
			});

			expect(oweSwitch1("it")).to.be("it works");
			expect(oweSwitch2()).to.be("it works");
			expect(oweSwitch3.x).to.be("it works");
		});
	});
});
