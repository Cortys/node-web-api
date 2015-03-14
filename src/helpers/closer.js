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
		if(!filter(this.value, typeof this.value, options.types))
			throw new Error("This route could not be closed.");
		if(data !== undefined) {
			if(options.writable)
				try {
					this.value = data;
				} catch(err) {
					throw new Error("This route could not be closed with data '" + data + "'.");
				}
			else
				throw new Error("This route could not be closed with data '" + data + "'.");
		}
		return this.value;
	};
}

module.exports = closer;
