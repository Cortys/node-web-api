"use strict";

/**
 * Generates a filter function out of the given filter.
 * @param {any} filter The filter.
 * @return {function} A filter function for `filter`.
 */
 function filterGenerator(filter) {
	if(typeof filter === "boolean")
		return () => filter;

	if(typeof filter === "function")
		return filter;

	if(filter instanceof RegExp)
		return input => filter.test(input);

	if(filter instanceof Set)
		return input => filter.has(input);

	if(filter instanceof Map)
		return input => !!filter.get(input);

	if(Array.isArray(filter))
		return input => filter.indexOf(input) !== -1;

	if(filter && typeof filter === "object")
		return input => !!filter[input];

	throw new TypeError("Invalid filter type.");
}

filterGenerator.inverse = filter => {
	const filterFunction = filterGenerator(filter);

	return function() {
		return !filterFunction.apply(this, arguments);
	};
};

module.exports = filterGenerator;
