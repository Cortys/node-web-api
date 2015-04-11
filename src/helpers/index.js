"use strict";

var serve = function serve(options) {
	if(typeof options !== "object")
		options = {};

	return {
		router: serve.router(options.router),
		closer: serve.closer(options.closer)
	};
};

serve.router = require("./router");

serve.closer = require("./closer");

var helpers = {
	serve: serve,

	chain: function chain(functions) {

		if(functions == null)
			functions = [];

		if(typeof functions === "function")
			functions = [functions];

		if(!Array.isArray(functions))
			throw new TypeError("Given fallthrough data either has to be of type 'function' or 'array'.");

		return function() {
			var that = this,
				result,
				errs = [],
				args = arguments;

			for(let i = 0; i < functions.length; i++) {
				let v = functions[i];
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
						errs.push(err);
						return v.apply(that, args);
					});
			}

			if(result)
				return result.catch(function(err) {
					errs.push(err);
					throw errs;
				});

			return Promise.reject([new Error("No functions for fallthrough found.")]);
		};
	}
};

module.exports = helpers;
