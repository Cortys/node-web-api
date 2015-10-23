/* jshint mocha: true */

"use strict";

const expect = require("expect.js");

const owe = require("../src");

describe(".switch", function() {

	describe("without given cases", function() {
		it("should behave like the function returned by switcher", function() {
			const test = {
				a(p, q) {
					return "a" + this + p + q;
				},
				b(p, q) {
					return "b" + this + p + q;
				}
			};
			let s = false;
			const oweSwitch = owe.switch(() => test[(s = !s) ? "a" : "b"]);

			expect(oweSwitch.call(1, 2, 3)).to.be("a123");
			expect(oweSwitch.call(1, 2, 3)).to.be("b123");
			expect(oweSwitch.call(3, 4, 5)).to.be("a345");
			expect(oweSwitch.call(3, 4, 5)).to.be("b345");
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
				a(p, q) {
					return "a" + this + p + q;
				},
				b(p, q) {
					return "b" + this + p + q;
				}
			};
			let s = false;
			const oweSwitch = owe.switch(() => (s = !s) ? "a" : "b", test);

			expect(oweSwitch.call(1, 2, 3)).to.be("a123");
			expect(oweSwitch.call(1, 2, 3)).to.be("b123");
			expect(oweSwitch.call(3, 4, 5)).to.be("a345");
			expect(oweSwitch.call(3, 4, 5)).to.be("b345");
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
					x(p, q) {
						return "ax" + this + p + q;
					},
					y(p, q) {
						return "ay" + this + p + q;
					},
					z: "az"
				},
				b: {
					x(p, q) {
						return "bx" + this + p + q;
					},
					y(p, q) {
						return "by" + this + p + q;
					},
					z: "bz"
				}
			};
			let s = false;
			const oweSwitch = owe.switch(() => (s = !s) ? "a" : "b", test);

			expect(oweSwitch.x.call(1, 2, 3)).to.be("ax123");
			expect(oweSwitch.y.call(1, 2, 3)).to.be("by123");
			expect(oweSwitch.y.call(3, 4, 5)).to.be("ay345");
			expect(oweSwitch.x.call(3, 4, 5)).to.be("bx345");
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
