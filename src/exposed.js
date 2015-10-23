"use strict";

const owe = require("owe-core");

function expose(obj, val) {
	return owe.resource(obj, {
		expose: arguments.length === 1 ? true : val
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
	SyntaxError: subclassError(SyntaxError),

	is(object) {
		return !!owe.resource(object).expose;
	},

	value(object) {
		return owe.resource(object).expose;
	},

	properties(obj, properties) {
		if(!(Symbol.iterator in properties))
			throw new TypeError("The properties to be exposed have to be iterable.");

		return owe.resource(obj, Object.defineProperty({}, "expose", {
			configurable: true,
			enumerable: true,
			get: properties instanceof Map ? () => {
				const result = {};

				for(const property of properties) {
					const key = property[0];
					const value = property[1];

					result[value] = obj[key];
				}

				return result;
			} : () => {
				const result = {};

				for(const property of properties)
					result[property] = obj[property];

				return result;
			}
		}));
	}
});
