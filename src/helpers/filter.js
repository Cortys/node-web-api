"use strict";

/**
 * Applies a given filter to an input and returns true/false on match/mismatch.
 * @module Api
 * @param {Object} target - An object that will be used as context for filters of type function
 * @param {string} input - The input to be checked.
 * @param {any} filter - The filter
 */

module.exports = function(target, input, filter) {
	if(typeof filter === "boolean")
		return filter;
	else if(typeof filter === "function")
		return !!filter.call(target, input);
	else if(filter instanceof RegExp)
		return filter.test(input);
	else if(filter instanceof Set)
		return filter.has(input);
	else if(filter instanceof Map)
		return !!filter.get(input);
	else if(Array.isArray(filter))
		return filter.indexOf(input) !== -1;
	else if(typeof filter === "object")
		return !!filter[input];
	return false;
};
