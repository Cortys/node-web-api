var Binding = require("./Binding"),
	filter = require("./filter");

function closer(options) {
	if(typeof options !== "object")
		options = {};

	options = {
		writable: options.writable || false,
		types: options.types || function() {
			return true;
		}
	};

	return function servedCloser(data) {

	};
}

module.exports = closer;
