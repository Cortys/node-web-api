"use strict";

var Binding = require("../Binding"),
	filter = require("./filter");

function router(options) {
	if(typeof options !== "object" || options === null)
		options = {};

	options = {
		type: options.type || "auto",
		deep: options.deep || false,
		deepArrays: options.deepArrays || false,
		deepen: options.deepen || false,
		mapFunctions: options.mapFunctions || false,
		filter: "filter" in options ? options.filter : true,
		filterInverse: !!options.filter || false
	};

	return function servedRouter(location) {
		var mode = options.type === "auto" ? typeof this : options.type;
		if(!(mode in tools.modes))
			throw new TypeError("'" + mode + "'-data cannot be routed by serve.router.");
		return tools.modes[mode].call(this, options, location);
	};
}

var tools = {

	modes: {
		"function": function(options, location) {
			if(typeof this.value !== "function")
				throw new TypeError("serve.router expected 'function' but got '" + (typeof this.value) + "'.");

			if(filter(this.value, location, options.filter) !== options.filterInverse)
				return this.value.call(undefined, location);
			throw new ReferenceError("'" + location + "' could not be routed.");
		},
		"object": function(options, location) {
			if(typeof this.value !== "object")
				throw new TypeError("serve.router expected 'object' but got '" + (typeof this) + "'.");

			if(location in this.value &&  filter(this.value, location, options.filter) !== options.filterInverse) {
				let value = this.value[location],
					that = this.value,
					binding = this.binding,
					writable = true;

				return Promise.resolve(value).then(function(value) {
					// Case 1: Function (not bound)
					if(typeof value === "function" && !Binding.isBound(value)) {
						// If function mapping is enabled:
						if(options.mapFunctions) {
							writable = false;
							// If functions should be mapped to being a router:
							if(options.mapFunctions === "router")
								value = new Binding(null, value.bind(that), binding.closer);
							// If functions should be mapped to be a closer
							// (State with whatever the function returned, even results with own bindings):
							else if(options.mapFunctions === "closer")
								value = new Binding(null, binding.router, value.bind(that));
							// If direct mapping was not used before: Use it now.
							// Simply replace function by its return value.
							else if(options.mapFunctions === "direct")
								value = value.call(that);
							else
								throw new Error("'" + location + "' could not be routed.");
						}
						else
							throw new Error("'" + location + "' could not be routed.");
					}
					return value;
				}).then(function(value) {
					// Case 2: Bound object (could be a function)
					if(Binding.isBound(value))
						return value;
					// Case 3: Closable data was reached
					else {

						let valueDescriptor = writable ? {
							get: function() {
								return value;
							},
							set: function(newValue) {
								that[location] = newValue;
								value = newValue;
							},
							enumerable: true
						} : {
							value: value,
							enumerable: true
						};

						let targetValue = null,
							router = function() {},
							type = Binding.types.normal;

						// Case 4: Object, that should be traversed deeply
						if(typeof value === "object" && value !== null && options.deep && (!Array.isArray(value) || options.deepArrays)) {
							targetValue = value;
							router = binding.router;
							if(!options.deepen)
								type = Binding.types.clone;
						}

						return new Binding(targetValue, router, function closerPropagator(data) {
							return binding.closer.call(this.modified ? this : this.setValue(valueDescriptor), data);
						}, type);
					}
				});
			}
			else
				throw new ReferenceError("'" + location + "' could not be routed.");
		}
	}
};

module.exports = router;
