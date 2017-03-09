"use strict";

const expect = require("./expect");

const filter = require("../src/filter.js");

describe("filter", () => {
	it("should handle booleans", () => {
		expect(filter(true)("test")).to.equal(true);
		expect(filter(true)(false)).to.equal(true);
		expect(filter(false)("")).to.equal(false);
		expect(filter(false)(true)).to.equal(false);
	});

	it("should handle regex", () => {
		expect(filter(/t/)("test")).to.equal(true);
		expect(filter(/t/)("derp")).to.equal(false);
	});

	it("should handle Sets", () => {
		expect(filter(new Set(["a", "b", "test"]))("test")).to.equal(true);
		expect(filter(new Set(["a", "b", "test"]))("derp")).to.equal(false);
	});

	it("should handle Maps", () => {
		expect(filter(new Map([
			["test", true],
			["derp", false]
		]))("test")).to.equal(true);
		expect(filter(new Map([
			["test", true],
			["derp", false]
		]))("derp")).to.equal(false);
	});

	it("should handle arrays", () => {
		expect(filter(["a", "b", "test"])("test")).to.equal(true);
		expect(filter(["a", "b", "test"])("derp")).to.equal(false);
	});

	it("should handle objects", () => {
		expect(filter({
			test: true,
			derp: false
		})("test")).to.equal(true);
		expect(filter({
			test: true,
			derp: false
		})("derp")).to.equal(false);
	});

	it("should pass through functions", () => {
		const f = () => {};

		expect(filter(f)).to.equal(f);
	});

	it("should throw for all other types of filters", () => {
		expect(() => filter()).to.throw(TypeError);
		expect(() => filter(null)).to.throw(TypeError);
		expect(() => filter(123)).to.throw(TypeError);
		expect(() => filter(Symbol())).to.throw(TypeError);
		expect(() => filter("test")).to.throw(TypeError);
	});

	describe(".inverse", () => {
		it("should do the opposite of filter for booleans", () => {
			expect(filter.inverse(true)("test")).to.equal(false);
			expect(filter.inverse(true)(false)).to.equal(false);
			expect(filter.inverse(false)("")).to.equal(true);
			expect(filter.inverse(false)(true)).to.equal(true);
		});

		it("should do the opposite of filter for regex", () => {
			expect(filter.inverse(/t/)("test")).to.equal(false);
			expect(filter.inverse(/t/)("derp")).to.equal(true);
		});

		it("should do the opposite of filter for Sets", () => {
			expect(filter.inverse(new Set(["a", "b", "test"]))("test")).to.equal(false);
			expect(filter.inverse(new Set(["a", "b", "test"]))("derp")).to.equal(true);
		});

		it("should do the opposite of filter for Maps", () => {
			expect(filter.inverse(new Map([
				["test", true],
				["derp", false]
			]))("test")).to.equal(false);
			expect(filter.inverse(new Map([
				["test", true],
				["derp", false]
			]))("derp")).to.equal(true);
		});

		it("should do the opposite of filter for arrays", () => {
			expect(filter.inverse(["a", "b", "test"])("test")).to.equal(false);
			expect(filter.inverse(["a", "b", "test"])("derp")).to.equal(true);
		});

		it("should do the opposite of filter for objects", () => {
			expect(filter.inverse({
				test: true,
				derp: false
			})("test")).to.equal(false);
			expect(filter.inverse({
				test: true,
				derp: false
			})("derp")).to.equal(true);
		});

		it("should invert the result of functions", () => {
			expect(filter.inverse((x, y) => x && y)(true, true)).to.equal(false);
			expect(filter.inverse((x, y) => x && y)(true, false)).to.equal(true);
			expect(filter.inverse(function() {
				return this;
			}).apply(false)).to.equal(true);
		});

		it("should throw for all other types of filters", () => {
			expect(() => filter.inverse()).to.throw(TypeError);
			expect(() => filter.inverse(null)).to.throw(TypeError);
			expect(() => filter.inverse(123)).to.throw(TypeError);
			expect(() => filter.inverse(Symbol())).to.throw(TypeError);
			expect(() => filter.inverse("test")).to.throw(TypeError);
		});
	});
});
