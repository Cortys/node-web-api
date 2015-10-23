/* jshint mocha: true */

"use strict";

const expect = require("expect.js");

const owe = require("../src");
const exposed = owe.exposed;

function exposedValue(o) {
	return owe.resource(o).expose;
}

describe(".exposed", function() {

	it("should be aliased to .expose", function() {
		expect(exposed).to.be(owe.expose);
	});

	it("should expose given objects when called", function() {
		const o = {};
		const f = function() {};
		const e = new Error();

		expect(exposed(o)).to.be(o);
		expect(exposed(f)).to.be(f);
		expect(exposed(e)).to.be(e);

		expect(exposedValue(o)).to.be.ok();
		expect(exposedValue(f)).to.be.ok();
		expect(exposedValue(e)).to.be.ok();
	});

	it("should expose given objects with data when called with data", function() {
		const o = {};
		const f = function() {};
		const e = new Error();

		const data = Symbol("unique");

		expect(exposed(o, data)).to.be(o);
		expect(exposed(f, data)).to.be(f);
		expect(exposed(e, data)).to.be(e);

		expect(exposedValue(o)).to.be(data);
		expect(exposedValue(f)).to.be(data);
		expect(exposedValue(e)).to.be(data);
	});

	describe(".is", function() {
		it("should be aliased to .isExposed", function() {
			expect(exposed.is).to.be(owe.isExposed);
		});

		it("should return true when given an exposed object", function() {
			const o = exposed({});
			const f = exposed(function() {}, true);
			const e = exposed(new Error(), "one");

			expect(exposed.is(o)).to.be(true);
			expect(exposed.is(f)).to.be(true);
			expect(exposed.is(e)).to.be(true);
		});

		it("should return false when given a non exposed object", function() {
			const o = {};
			const f = function() {};
			const e = new Error();

			expect(exposed.is(o)).to.be(false);
			expect(exposed.is(f)).to.be(false);
			expect(exposed.is(e)).to.be(false);
		});
	});

	describe(".value", function() {
		it("should return the exposed value", function() {
			const o = exposed({});
			const f = exposed(function() {}, {});
			const e = exposed(new Error(), "one");
			const n = {};

			expect(exposed.value(o)).to.be(true);
			expect(exposed.value(f)).to.eql({});
			expect(exposed.value(e)).to.be("one");
			expect(exposed.value(n)).to.be(undefined);
		});
	});

	describe(".properties", function() {
		it("should expose the given properties of an object", function() {
			const o = {
				a: 1,
				b: 2,
				c: 3,
				d: 4
			};

			exposed.properties(o, ["b", "d"]);

			expect(exposedValue(o)).to.eql({
				b: 2,
				d: 4
			});
		});

		it("should expose and map object properties when given a map", function() {
			const o = {
				a: 1,
				b: 2,
				c: 3,
				d: 4
			};

			exposed.properties(o, new Map([
				["b", "a"],
				["d", "c"]
			]));

			expect(exposedValue(o)).to.eql({
				a: 2,
				c: 4
			});
		});
	});

	describe(".Error instance", function() {
		const err = new exposed.Error();

		it("should be an Error", function() {
			expect(err).to.be.an(Error);
		});

		it("should be exposed", function() {
			expect(exposedValue(err)).to.be.ok();
		});
	});

	describe(".TypeError instance", function() {
		const err = new exposed.TypeError();

		it("should be an TypeError", function() {
			expect(err).to.be.an(TypeError);
		});

		it("should be exposed", function() {
			expect(exposedValue(err)).to.be.ok();
		});
	});

	describe(".ReferenceError instance", function() {
		const err = new exposed.ReferenceError();

		it("should be an ReferenceError", function() {
			expect(err).to.be.an(ReferenceError);
		});

		it("should be exposed", function() {
			expect(exposedValue(err)).to.be.ok();
		});
	});

	describe(".RangeError instance", function() {
		const err = new exposed.RangeError();

		it("should be an RangeError", function() {
			expect(err).to.be.an(RangeError);
		});

		it("should be exposed", function() {
			expect(exposedValue(err)).to.be.ok();
		});
	});

	describe(".SyntaxError instance", function() {
		const err = new exposed.SyntaxError();

		it("should be an SyntaxError", function() {
			expect(err).to.be.an(SyntaxError);
		});

		it("should be exposed", function() {
			expect(exposedValue(err)).to.be.ok();
		});
	});
});
