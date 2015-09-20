"use strict";

const filter = require("./filter");
const exposed = require("../exposed");

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
		output: typeof options.output === "function" ? options.output : value => value
	};

	function tryWrite(object, key, data) {
		try {
			object[key] = data;
		}
		catch(err) {
			throw new exposed.Error(`This route could not be closed with data '${data}'.`);
		}
	}

	return function servedCloser(data) {
		return Promise.resolve(filter(this, this.value, options.filter, result => {
			if(result === options.filterInverse)
				throw new exposed.Error("This route could not be closed" + (data !== undefined ? ` with data '${data}'.` : "."));

			if(typeof this.value === "function" && options.callFunctions)
				return this.value(data);

			if(data !== undefined)
				return filter(this, data, options.writable, result => {
					if(result !== options.writableInverse) {
						tryWrite(this, "value", data);

						return this.value;
					}
					throw new exposed.Error(`This route could not be closed with data '${data}'.`);
				});

			return this.value;

		})).then(result => options.output.call(this, result));
	};
}

module.exports = closer;
