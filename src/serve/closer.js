"use strict";

const filter = require("./filter");

function closer(options) {
	if(typeof options !== "object" || options === null)
		options = {};

	options = {
		writable: options.writable || false,
		writableInverse: options.writableInverse || false,
		filter: "filter" in options ? options.filter : function() {
			return typeof this.value !== "object" || Array.isArray(this.value);
		},
		filterInverse: !!options.filterInverse || false,
		callFunctions: "callFunctions" in options ? options.callFunctions : true,
		output: typeof options.output === "function" ? options.output : function(value) {
			return value;
		}
	};

	function tryWrite(object, key, data) {
		try {
			object[key] = data;
		}
		catch(err) {
			throw new Error(`This route could not be closed with data '${data}'.`);
		}
	}

	return function servedCloser(data) {

		const that = this;

		return Promise.resolve(filter(this, this.value, options.filter, function(result) {
			if(result === options.filterInverse)
				throw new Error("This route could not be closed" + (data !== undefined ? ` with data '${data}'.` : "."));

			if(typeof that.value === "function" && options.callFunctions)
				return that.value(data);

			if(data !== undefined)
				return filter(that, data, options.writable, function(result) {
					if(result !== options.writableInverse) {
						tryWrite(that, "value", data);

						return that.value;
					}
					throw new Error(`This route could not be closed with data '${data}'.`);
				});

			return that.value;

		})).then(function(result) {
			return options.output.call(that, result);
		});
	};
}

module.exports = closer;
