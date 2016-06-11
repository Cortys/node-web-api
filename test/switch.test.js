"use strict";

const expect = require("chai").expect;

const owe = require("../src");

describe(".switch", () => {
	it("should always require a switcher function", () => {
		expect(() => owe.switch(() => undefined)).not.to.throw();
		expect(() => owe.switch()).to.throw();
		expect(() => owe.switch({})).to.throw();
		expect(() => owe.switch("test")).to.throw();
		expect(() => owe.switch(123)).to.throw();
	});

	describe("without given cases", () => {
		it("should behave like the function returned by switcher", () => {
			const test = {
				a(p, q) {
					return `a${this}${p}${q}`;
				},
				b(p, q) {
					return `b${this}${p}${q}`;
				}
			};
			let s = false;
			const oweSwitch = owe.switch(() => test[(s = !s) ? "a" : "b"]);

			expect(oweSwitch.call(1, 2, 3)).to.equal("a123");
			expect(oweSwitch.call(1, 2, 3)).to.equal("b123");
			expect(oweSwitch.call(3, 4, 5)).to.equal("a345");
			expect(oweSwitch.call(3, 4, 5)).to.equal("b345");
		});

		it("should return the return value of switcher if it is not a function", () => {
			const test = {
				a: "x",
				b: "y"
			};
			let s = false;
			const oweSwitch = owe.switch(() => test[(s = !s) ? "a" : "b"]);

			expect(oweSwitch()).to.equal("x");
			expect(oweSwitch()).to.equal("y");
		});
	});

	describe("with given cases", () => {
		it("should behave like the function stored for the key that was returned by the switcher", () => {
			const test = {
				a(p, q) {
					return `a${this}${p}${q}`;
				},
				b(p, q) {
					return `b${this}${p}${q}`;
				}
			};
			let s = false;
			const oweSwitch = owe.switch(() => (s = !s) ? "a" : "b", test);

			expect(oweSwitch.call(1, 2, 3)).to.equal("a123");
			expect(oweSwitch.call(1, 2, 3)).to.equal("b123");
			expect(oweSwitch.call(3, 4, 5)).to.equal("a345");
			expect(oweSwitch.call(3, 4, 5)).to.equal("b345");
		});

		it("if the value of the key returned by the switcher is not a function, it should be returned", () => {
			const test = {
				a: "x",
				b: "y"
			};
			let s = false;
			const oweSwitch = owe.switch(() => (s = !s) ? "a" : "b", test);

			expect(oweSwitch()).to.equal("x");
			expect(oweSwitch()).to.equal("y");
		});

		it("should return an object if the given cases are objects", () => {
			const test = {
				a: {
					x(p, q) {
						return `ax${this}${p}${q}`;
					},
					y(p, q) {
						return `ay${this}${p}${q}`;
					},
					z: "az"
				},
				b: {
					x(p, q) {
						return `bx${this}${p}${q}`;
					},
					y(p, q) {
						return `by${this}${p}${q}`;
					},
					z: "bz"
				}
			};
			let s = false;
			const oweSwitch = owe.switch(() => (s = !s) ? "a" : "b", test);

			expect(oweSwitch.x.call(1, 2, 3)).to.equal("ax123");
			expect(oweSwitch.y.call(1, 2, 3)).to.equal("by123");
			expect(oweSwitch.y.call(3, 4, 5)).to.equal("ay345");
			expect(oweSwitch.x.call(3, 4, 5)).to.equal("bx345");
			expect(oweSwitch.z).to.equal("az");
			expect(oweSwitch.z).to.equal("bz");
		});

		it("should throw if first case was an object and then switches to a non object", () => {
			const test = {
				a: {
					x: 1
				},
				b: true
			};
			let s = false;
			const oweSwitch = owe.switch(() => (s = !s) ? "a" : "b", test);

			expect(oweSwitch.x).to.equal(1);
			expect(() => oweSwitch.x).to.throw(Error, "Case 'b' is not an object.");
		});

		it("should use the given fallback param if no case matches the switcher result", () => {
			const oweSwitch1 = owe.switch(() => "a", {}, word => `${word} works`);
			const oweSwitch2 = owe.switch(() => "a", {}, "it works");

			const oweSwitch3 = owe.switch(() => "a", {
				b: {
					x: "nope"
				}
			}, {
				x: "it works"
			});

			expect(oweSwitch1("it")).to.equal("it works");
			expect(oweSwitch2()).to.equal("it works");
			expect(oweSwitch3.x).to.equal("it works");
		});
	});
});
