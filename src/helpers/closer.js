"use strict";

var filter = require("./filter");

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
		return filter(this, this.value, options.filter).then(function(result) {
			if(result === options.filterInverse)
				throw new Error("This route could not be closed" + (data !== undefined ? ` with data '${data}'.` : "."));

			if(typeof this.value === "function" && options.callFunctions)
				return this.value(data);

			var out = this.value;

			if(data !== undefined)
				return filter(this, data, options.writable).then(function(result) {
					if(result !== options.writableInverse) {
						tryWrite(this, "value", data);
						return out;
					}
					throw new Error(`This route could not be closed with data '${data}'.`);
				});

			return out;

		}).then(function(result) {
			return options.output.call(this, result);
		});
	};
}

module.exports = closer;
