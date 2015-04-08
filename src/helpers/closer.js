"use strict";

var Binding = require("../Binding"),
	filter = require("./filter");

function closer(options) {
	if(typeof options !== "object" || options === null)
		options = {};

	options = {
		writable: options.writable || false,
		writableInverse: options.writableInverse || false,
		filter: "filter" in options ? options.filter : function(object) {
			return typeof object !== "object" || Array.isArray(object);
		},
		filterInverse: !!options.filterInverse || false,
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
		return filter(this, data, options.filter).then(function(result) {
			if(result === options.filterInverse)
				throw new Error("This route could not be closed" + (data !== undefined ? ` with data '${data}'.` : "."));

			if(data !== undefined)
				tryWrite(this, "value", data);

			return options.output.call(this, this.value);
		});
	};
}

module.exports = closer;
