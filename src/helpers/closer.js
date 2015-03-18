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
		filterInverse: !!options.filterInverse || false
	};

	return function servedCloser(data) {
		if(filter(this, this.value, options.filter) === options.filterInverse)
			throw new Error("This route could not be closed.");
		if(data !== undefined) {
			if(filter(this, this.value, options.writable) !== options.writableInverse) {
				try {
					this.value = data;
				}
				catch(err) {
					console.error(err, this);
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
