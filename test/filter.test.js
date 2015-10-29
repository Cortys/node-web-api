"use strict";

const expect = require("expect.js");

const filter = require("../src/filter.js");

describe("filter", () => {
	it("should handle booleans", () => {
		expect(filter(null, "test", true)).to.be(true);
		expect(filter(null, false, true)).to.be(true);
		expect(filter(null, "test", false)).to.be(false);
		expect(filter(null, true, false)).to.be(false);
	});

	it("should handle regex", () => {
		expect(filter(null, "test", /t/)).to.be(true);
		expect(filter(null, "derp", /t/)).to.be(false);
	});

	it("should handle Sets", () => {
		expect(filter(null, "test", new Set(["a", "b", "test"]))).to.be(true);
		expect(filter(null, "derp", new Set(["a", "b", "test"]))).to.be(false);
	});

	it("should handle Maps", () => {
		expect(filter(null, "test", new Map([
			["test", true],
			["derp", false]
		]))).to.be(true);
		expect(filter(null, "derp", new Map([
			["test", true],
			["derp", false]
		]))).to.be(false);
	});

	it("should handle arrays", () => {
		expect(filter(null, "test", ["a", "b", "test"])).to.be(true);
		expect(filter(null, "derp", ["a", "b", "test"])).to.be(false);
	});

	it("should handle objects", () => {
		expect(filter(null, "test", {
			test: true,
			derp: false
		})).to.be(true);
		expect(filter(null, "derp", {
			test: true,
			derp: false
		})).to.be(false);
	});

	it("should return what the callback function returns", () => {
		expect(filter(null, "test", ["a", "b", "test"], res => res ? "a" : "b")).to.be("a");
		expect(filter(null, "derp", ["a", "b", "test"], res => res ? "a" : "b")).to.be("b");
	});

	it("should handle functions", () => {
		return Promise.all([
			filter(null, "test", val => val === "test").then(res => expect(res).to.be(true)),
			filter(null, "derp", val => val === "test").then(res => expect(res).to.be(false)),
			filter(null, "test", () => ["a", "b", "test"]).then(res => expect(res).to.be(true)),
			filter(null, "derp", () => {
				throw new Error("nope");
			}, res => res ? "a" : "b").then(res => expect(res).to.be("b")),
			filter(null, "derp", () => Promise.reject(new Error("nope")), res => res ? "y" : "x")
				.then(res => expect(res).to.be("x"))
		]);
	});
});
