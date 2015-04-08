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
		maxDepth: "maxDepth" in options ? options.maxDepth * 1 : Infinity,
		mapFunctions: options.mapFunctions || false,
		filter: "filter" in options ? options.filter : true,
		filterInverse: !!options.filterInverse || false
	};

	if(isNaN(options.maxDepth) || options.maxDepth < 1)
		options.deep = false;

	if(options.deep && options.maxDepth > 0 && isFinite(options.maxDepth))
		options.maxDepth = Math.floor(options.maxDepth);

	var baseRouter = function(caller, location) {
		var mode = options.type === "auto" ? typeof this.value : options.type;
		if(!(mode in tools.modes))
			return Promise.reject(new TypeError("'" + mode + "'-data cannot be routed by serve.router."));
		return tools.modes[mode].call(this, options, location, caller);
	};

	baseRouter[reduceDepthKey] = function reduceDepth() {

		var that = this;

		if(options.deep && this[currentDepthKey] <= 0)
			throw new Error("The maximum routing depth of " + options.maxDepth + " has been exceeded.");

		var result = function servedRouter(location) {
			return baseRouter.call(this, that, location);
		};

		result[reduceDepthKey] = reduceDepth;

		result[currentDepthKey] = this[currentDepthKey] - 1;

		return result;
	};

	// Make depth of returned starting point 1 too big...
	baseRouter[currentDepthKey] = options.maxDepth + 1;

	// ...because a version of it with reduced depth by 1 is returned here:
	return baseRouter[reduceDepthKey]();
}

// Symbols:
var currentDepthKey = Symbol("currentDepth"),
	reduceDepthKey = Symbol("reduceDepth");

var tools = {

	modes: {
		"function": function(options, location) {
			if(typeof this.value !== "function")
				return Promise.reject(new TypeError("Router expected 'function' but got '" + (typeof this.value) + "'."));

			return filter(this.value, location, options.filter).then(function(result) {
				if(result !== options.filterInverse)
					return this.value.call(undefined, location);
				throw new ReferenceError("'" + location + "' could not be routed.");
			});
		},
		"object": function(options, location, router) {
			if(typeof this.value !== "object")
				return Promise.reject(TypeError("Router expected 'object' but got '" + (typeof this) + "'."));

			var that = this.value,
				binding = this.binding,
				writable = true;

			return filter(this.value, location, options.filter).then(function(result) {
				if(location in this.value && result !== options.filterInverse)
					return Promise.resolve(this.value[location]);
				else
					throw new ReferenceError("'" + location + "' could not be routed.");
			}).then(function(value) {
				// Case 1: Function (not bound)
				if(typeof value === "function" && !Binding.isBound(value)) {
					// If function mapping is enabled:
					if(options.mapFunctions) {
						writable = false;
						// If functions should be mapped to being a router:
						if(options.mapFunctions === "router")
							value = Binding.bind(null, value.bind(that), binding.closer);
						// If functions should be mapped to be a closer
						// (State with whatever the function returned, even results with own bindings):
						else if(options.mapFunctions === "closer")
							value = Binding.bind(null, router[reduceDepthKey](), value.bind(that));
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
				var valueDescriptor = writable ? {
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

				// Case 4: Object, that should be traversed deeply

				var targetValue, traversedRouter, type;

				if(typeof value === "object" && value !== null && options.deep && (!Array.isArray(value) || options.deepArrays)) {
					targetValue = value;
					// Request a version of this router with reduced depth:
					// This throws if maxDepth has already been exceeded.
					traversedRouter = router[reduceDepthKey]();
					if(!options.deepen)
						type = Binding.types.clone;
				}
				else {

					let errorMessage = `${typeof value === "object" ? "Object" : "Data"} at position '${that.location.concat([location]).join("/")}' is an end point and cannot be routed.`;
					traversedRouter = function() {
						throw new Error(errorMessage);
					};

					targetValue = null;
					type = Binding.types.normal;
				}

				return Binding.bind(targetValue, router, function closerPropagator(data) {
					return binding.closer.call(this.modified ? this : this.setValue(valueDescriptor), data);
				}, type);
			});
		}
	}
};

module.exports = router;
