/* jshint mocha: true */

"use strict";

const expect = require("expect.js");

const owe = require("../src");
const exposed = owe.exposed;

function isExposed(o) {
	return owe.resource(o).expose;
}

describe(".exposed", function() {

	it("should expose given objects when called", function() {
		const o = {};
		const f = function() {};
		const e = new Error();

		expect(exposed(o)).to.be(o);
		expect(exposed(f)).to.be(f);
		expect(exposed(e)).to.be(e);

		expect(isExposed(o)).to.be.ok();
		expect(isExposed(f)).to.be.ok();
		expect(isExposed(e)).to.be.ok();
	});

	describe(".Error instance", function() {
		const err = new exposed.Error();

		it("should be an Error", function() {
			expect(err).to.be.an(Error);
		});

		it("should be exposed", function() {
			expect(isExposed(err)).to.be.ok();
		});
	});

	describe(".TypeError instance", function() {
		const err = new exposed.TypeError();

		it("should be an TypeError", function() {
			expect(err).to.be.an(TypeError);
		});

		it("should be exposed", function() {
			expect(isExposed(err)).to.be.ok();
		});
	});

	describe(".ReferenceError instance", function() {
		const err = new exposed.ReferenceError();

		it("should be an ReferenceError", function() {
			expect(err).to.be.an(ReferenceError);
		});

		it("should be exposed", function() {
			expect(isExposed(err)).to.be.ok();
		});
	});

	describe(".RangeError instance", function() {
		const err = new exposed.RangeError();

		it("should be an RangeError", function() {
			expect(err).to.be.an(RangeError);
		});

		it("should be exposed", function() {
			expect(isExposed(err)).to.be.ok();
		});
	});

	describe(".SyntaxError instance", function() {
		const err = new exposed.SyntaxError();

		it("should be an SyntaxError", function() {
			expect(err).to.be.an(SyntaxError);
		});

		it("should be exposed", function() {
			expect(isExposed(err)).to.be.ok();
		});
	});
});
