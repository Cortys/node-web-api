/* jshint mocha: true */

"use strict";

const expect = require("expect.js");

const owe = require("../src");

describe(".switch", function() {
	it("should behave like the function returned by switcher if no cases are given", function() {
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

	it("should behave like the function stored for the key of the cases that was returned by the switcher", function() {
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
});
