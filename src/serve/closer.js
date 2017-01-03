"use strict";

const helpers = require("owe-helpers");
const exposed = require("owe-core").exposed;

function closer(options) {
	if(!options || typeof options !== "object")
		options = {};

	options = {
		writable: "writable" in options ? options.writable : false,
		filter: "filter" in options ? options.filter : value => typeof value !== "object" || Array.isArray(value),
		callFunctions: "callFunctions" in options ? options.callFunctions : true,
		output: "output" in options ? options.output : value => value
	};

	function tryWrite(object, key, data) {
		try {
			object[key] = data;
		}
		catch(err) {
			if(exposed.isExposed(err))
				throw err;

			throw new exposed.Error("This route could not be closed with the given data.");
		}
	}

	return function servedCloser(data, state) {
		return helpers.filter(options.filter, state, state.value, state).then(result => {
			if(!result)
				throw new exposed.Error(`This route could not be closed${data !== undefined ? " with the given data." : "."}`);

			if(typeof state.value === "function" && options.callFunctions)
				return state.value(data);

			if(data !== undefined)
				return helpers.filter(options.writable, state, data, state).then(result => {
					if(!result)
						throw new exposed.Error("This route could not be closed with the given data.");

					tryWrite(state, "value", data);

					return state.value;
				});

			return state.value;
		}).then(result => options.output.call(state, result, state));
	};
}

module.exports = closer;
