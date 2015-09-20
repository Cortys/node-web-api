"use strict";

const owe = require("owe-core");

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

module.exports = {
	Error: subclassError(Error),
	TypeError: subclassError(TypeError),
	ReferenceError: subclassError(ReferenceError),
	RangeError: subclassError(RangeError),
	SyntaxError: subclassError(SyntaxError)
};
