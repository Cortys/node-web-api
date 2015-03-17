var Binding = require("../Binding"),
	filter = require("./filter");

function closer(options) {
	if(typeof options !== "object" || options === null)
		options = {};
	options = {
		writable: options.writable || false,
		filter: "filter" in options ? options.filter : function(object) {
			return typeof object !== "object" || Array.isArray(object);
		},
		filterInverse: !!options.filterInverse || false
	};

	return function servedCloser(data) {
		if(filter(this, this.value, options.filter) === options.filterInverse)
			throw new Error("This route could not be closed.");
		if(data !== undefined) {
			if(options.writable) {
				try {
					this.value = data;
				}
				catch(err) {
					throw new Error("This route could not be closed with data '" + data + "'.");
				}
			}
			else
				throw new Error("This route could not be closed with data '" + data + "'.");
		}
		return this.value;
	};
}

module.exports = closer;
