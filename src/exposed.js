"use strict";

const owe = require("owe-core");

function expose(obj) {
	return owe.resource(obj, {
		expose: true
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
