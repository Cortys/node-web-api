var Binding = require("../Binding"),
	filter = require("./filter");

function closer(options) {
	if(typeof options !== "object" || options === null)
		options = {};

	options = {
		writable: options.writable || false,
		types: options.types || function() {
			return true;
		}
	};

	return function servedCloser(data) {
		if(!filter(this, typeof this, options.types))
			throw new Error("This route could not be closed.");
		return this;
	};
}

module.exports = closer;
