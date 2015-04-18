"use strict";

function chain(input, options) {

	if(typeof options !== "object" || options === null)
		options = {};

	options = {
		mode: options.mode || "auto",
		errors: options.errors || "all"
	};

	var firstVal;

	if((typeof input === "object" || typeof input === "function") && input !== null && typeof input[Symbol.iterator] === "function") {

		if(options.mode !== "function")
			firstVal = input[Symbol.iterator]().next().value;

		if(options.mode === "auto")
			options.mode = typeof firstVal === "object" ? "object" : "function";
	}
	else
		throw new TypeError("Chain input has to be iterable.");

	if(options.mode === "object") {
		var result = {};

		for(let key of Object.keys(firstVal)) {

			let generator = function*() {
				for(let val of input)
					yield typeof val === "object" && val !== null && val[key] || undefined;
			};

			generator[Symbol.iterator] = generator;

			result[key] = chain(generator, {
				mode: "function",
				errors: options.errors
			});
		}

		return result;
	}

	var handleErr;

	if(options.errors === "all")
		handleErr = {
			in: function(errs, err) {
				errs.push(err);
			},
			out: function(errs) {
				return errs;
			}
		};
	else if(options.errors === "last")
		handleErr = {
			in: function(errs, err) {
				errs.length = 1;
				errs[0] = err;
			},
			out: function(errs) {
				return errs[0];
			}
		};
	else if(options.errors === "first")
		handleErr = {
			in: function(errs, err) {
				if(errs.length === 0)
					errs[0] = err;
			},
			out: function(errs) {
				return errs[0];
			}
		};
	else if(typeof options.errors === "function")
		handleErr = {
			in: function(errs, err) {
				errs.push(err);
			},
			out: options.errors.bind(null)
		};
	else
		handleErr = {
			in: function() {},
			out: function() {
				return options.errors;
			}
		};

	return function servedChain() {
		var that = this,
			result,
			errs = [],
			args = arguments;

		var i = 0;
		for(let v of input) {

			if(v == null) {
				i++;
				continue;
			}

			if(typeof v !== "function") {
				result = Promise.reject(new TypeError(v + " at position " + i + " could not be used as a function for fallthrough."));
				break;
			}

			if(!result)
				result = Promise.resolve().then(function() {
					return v.apply(that, args);
				});
			else
				result = result.catch(function(err) {
					handleErr.in(errs, err);
					return v.apply(that, args);
				});

			i++;
		}

		if(result)
			return result.catch(function(err) {
				handleErr.in(errs, err);
				throw handleErr.out(errs);
			});

		return Promise.reject(handleErr.out([new Error("No functions for fallthrough found.")]));
	};
}

module.exports = chain;
