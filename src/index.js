"use strict";

const owe = require("owe-core");

// Extend core with basic helper functions:

// Generates router and closer for object tree exposal:
owe.serve = require("./serve");

// Reroutes API nodes to other API nodes:
owe.reroute = require("./reroute");

// Chains multiple router and/or closer functions to one fallthrough function:
owe.chain = require("./chain");

// Contains aliases for the default errors, exposing its message:
function subclassError(error) {
	return class extends error {
		constructor(msg) {
			super(msg);

			owe.resource(this, {
				expose: true
			});
		}
	};
}

owe.exposed = {
	Error: subclassError(Error),
	TypeError: subclassError(TypeError),
	ReferenceError: subclassError(ReferenceError),
	RangeError: subclassError(RangeError),
	SyntaxError: subclassError(SyntaxError)
};

module.exports = owe;
