"use strict";

function tryExec(fun, not) {
	try {
		return fun();
	}
	catch(err) {
		return not(err);
	}
}

/**
 * Applies a given filter to an input and returns a Promise, that will be resolved with true/false on match/mismatch.
 * The returned Promise will not be rejected on mismatch but resolved with false!
 * @module helpers
 * @param {Object} target An object that will be used as context for filters of type function
 * @param {string} input The input to be checked.
 * @param {any} filter The filter
 * @param {function} callback Called with the result of this filter
 * @return {boolean|Promise} The return value of the callback, which should be boolean.
 */
module.exports = function filterTool(target, input, filter, callback) {
	let result = false;

	if(!callback)
		callback = result => result;

	if(typeof filter === "boolean")
		result = filter;
	else if(typeof filter === "function") {
		return tryExec(
			() => Promise.resolve(filter.call(target, input))
				.then(result => filterTool(target, input, result))
				.then(callback, () => callback(false)),
			() => Promise.resolve(callback(false))
		);
	}
	else if(filter instanceof RegExp)
		result = filter.test(input);
	else if(filter instanceof Set)
		result = filter.has(input);
	else if(filter instanceof Map)
		result = !!filter.get(input);
	else if(Array.isArray(filter))
		result = filter.indexOf(input) !== -1;
	else if(typeof filter === "object")
		result = !!filter[input];

	return callback(result);
};
