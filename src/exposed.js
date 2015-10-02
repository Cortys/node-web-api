"use strict";

const owe = require("owe-core");

function expose(obj, val) {
	return owe.resource(obj, {
		expose: val === undefined ? true : val
	});
}

function subclassError(error) {
	return class extends error {
		constructor(msg) {
			super(msg);

			expose(this);
		}
	};
}

module.exports = Object.assign(expose, {
	Error: subclassError(Error),
	TypeError: subclassError(TypeError),
	ReferenceError: subclassError(ReferenceError),
	RangeError: subclassError(RangeError),
	SyntaxError: subclassError(SyntaxError)
});
