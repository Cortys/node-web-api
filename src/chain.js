"use strict";

function chain(input, options) {

	if(typeof options !== "object" || options === null)
		options = {};

	options = {
		mode: options.mode || "auto",
		errors: options.errors || "all",
		removeNonErrors: options.removeNonErrors || true
	};

	let firstVal;

	if((typeof input === "object" || typeof input === "function") && input !== null && Symbol.iterator in input) {

		if(options.mode !== "function")
			firstVal = input[Symbol.iterator]().next().value;

		if(options.mode === "auto")
			options.mode = typeof firstVal === "object" ? "object" : "function";
	}
	else
		throw new TypeError("Chain input has to be iterable.");

	if(options.mode === "object") {
		const result = {};

		for(const key of Object.keys(firstVal)) {

			const generator = function*() {
				for(const val of input)
					yield typeof val === "object" && val !== null && val[key] || undefined;
			};

			generator[Symbol.iterator] = generator;

			result[key] = chain(generator, {
				mode: "function",
				errors: options.errors,
				removeNonErrors: options.removeNonErrors
			});
		}

		return result;
	}

	let handleErr;

	if(options.errors === "all")
		handleErr = {
			in(errs, err) {
				if(err != null || !options.removeNonErrors)
					errs.push(err);
			},
			out(errs) {
				return errs;
			}
		};
	else if(options.errors === "last")
		handleErr = {
			in(errs, err) {
				if(err != null || !options.removeNonErrors) {
					errs.length = 1;
					errs[0] = err;
				}
			},
			out(errs) {
				return errs[0];
			}
		};
	else if(options.errors === "first")
		handleErr = {
			in(errs, err) {
				if(errs.length === 0 && (err != null || !options.removeNonErrors))
					errs[0] = err;
			},
			out(errs) {
				return errs[0];
			}
		};
	else if(typeof options.errors === "function")
		handleErr = {
			in(errs, err) {
				if(err != null || !options.removeNonErrors)
					errs.push(err);
			},
			out: options.errors.bind(null)
		};
	else
		handleErr = {
			in() {},
			out() {
				return options.errors;
			}
		};

	return function servedChain() {
		const errs = [];
		const args = arguments;

		let i = 0,
			result;

		for(let v of input) {
			if(v != null) {
				if(typeof v !== "function") {
					result = Promise.reject(new TypeError(`'${v}' at position ${i} could not be used as a function for fallthrough.`));
					break;
				}

				if(!result)
					result = Promise.resolve().then(() => v.apply(this, args));
				else
					result = result.catch(err => {
						handleErr.in(errs, err);

						return v.apply(this, args);
					});
			}
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
