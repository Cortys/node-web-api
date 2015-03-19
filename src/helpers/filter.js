/**
 * Applies a given filter to an input and returns true/false on match/mismatch.
 * @module Api
 * @param {Object} target - An object that will be used as context for filters of type function
 * @param {string} input - The input to be checked.
 * @param {*} filter - The filter
 */

module.exports = function(target, input, filter) {
	var res = false;
	if(typeof filter === "boolean")
		res = filter;
	else if(typeof filter === "function")
		res = !!filter.call(target, input);
	else if(filter instanceof RegExp)
		res = filter.test(input);
	else if(filter instanceof Set)
		res = filter.has(input);
	else if(filter instanceof Map)
		res = !!filter.get(input);
	else if(Array.isArray(filter))
		res = filter.indexOf(input) !== -1;
	else if(typeof filter === "object")
		res = !!filter[input];
	return res;
};
