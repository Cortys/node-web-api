var Binding = require("./Binding"),
	filter = require("./filter");

function router(options) {
	if(typeof options !== "object")
		options = {};

	options = {
		type: options.type || "auto",
		deep: options.deep || false,
		deepen: options.deepen || false,
		mapFunctions: options.mapFunctions || false,
		filter: options.filter || function() {
			return true;
		},
		filterInverse: options.filter || false
	};

	return function servedRouter(location) {
		var mode = options.type == "auto" ? typeof this : options.type;
		if(!(mode in tools.modes))
			throw new TypeError("'"+mode+"'-data cannot be routed by serve.router.");
		return tools.modes[mode].call(this, options, location);
	};
}

var tools = {

	modes: {
		"function": function(options, location) {
			if(typeof this !== "function")
				throw new TypeError("serve.router expected 'function' but got '"+(typeof this)+"'.");

			if(filter(this, location, options.filter, options.filterInverse))
				return this.call(this, location);
			throw new Error("'"+location+"' could not be routed.");
		},
		"object": function(options, location) {
			if(typeof this !== "object")
				throw new TypeError("serve.router expected 'object' but got '"+(typeof this)+"'.");

			if(location in this && filter(this, location, options.filter, options.filterInverse)) {
				var value = this[location],
					usedDirectMapping = false;

				// If direct function mapping is used:
				// Map functions before doing anything else. Simply replace function by its return value.
				if(typeof value === "function" && !Binding.isBound(value) && options.mapFunctions == "direct") {
					value = value.call(this);
					usedDirectMapping = true;
				}

				return Promise.resolve(value).then(function(value) {
					// Case 1: Function (not bound)
					if(typeof value === "function" && !Binding.isBound(value)) {
						// If function mapping is enabled:
						if(options.mapFunctions) {
							// If functions should be mapped to being a router:
							if(options.mapFunctions == "router")
								value = Binding.bind(null, value.bind(this), this[Binding.key].closer);
							// If functions should be mapped to be a closer
							// (closing with whatever the function returned, even results with own bindings):
							else if(options.mapFunctions == "closer")
								value = Binding.bind(null, this[Binding.key].router, value.bind(this));
							// If direct mapping was not used before: Use it now.
							// Simply replace function by its return value.
							else if(options.mapFunctions == "direct" && !usedDirectMapping)
								value = value.call(this);
							else
								throw new Error("'"+location+"' could not be routed.");
						}
						else
							throw new Error("'"+location+"' could not be routed.");
					}
					// Case 2: Bound object (could be a function)
					if(Binding.isBound(value))
						return value;
					// Case 3: Object, that should be traversed deeply
					if(typeof value === "object" && value !== null && options.deep)
						return Binding.imitate(value, this, options.deepen);
					// Case 4: Closable data was reached
					else
						return Binding.bind(null, function() {}, this[Binding.key].closer.bind(value));
				});
			}
			else
				throw new Error("'"+location+"' could not be routed.");
		}
	}
};

module.exports = router;
