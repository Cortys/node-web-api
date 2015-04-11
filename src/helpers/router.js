"use strict";

var Binding = require("../Binding"),
	filter = require("./filter");

function router(options) {
	if(typeof options !== "object" || options === null)
		options = {};

	options = {
		deep: options.deep || false,
		deepArrays: options.deepArrays || false,
		deepen: options.deepen || false,
		maxDepth: "maxDepth" in options ? options.maxDepth * 1 : Infinity,
		mapFunctions: options.mapFunctions || "direct",
		callRootFunction: options.callRootFunction || false,
		filter: "filter" in options ? options.filter : true,
		filterInverse: !!options.filterInverse || false
	};

	if(isNaN(options.maxDepth) || options.maxDepth < 1)
		options.deep = false;

	if(options.deep && options.maxDepth > 0 && isFinite(options.maxDepth))
		options.maxDepth = Math.floor(options.maxDepth);

	var baseRouter = function(caller, destination) {
		return tools.handle.call(this, options, caller, destination);
	};

	baseRouter[reduceDepthKey] = function reduceDepth() {

		var that = this;

		if(options.deep && this[currentDepthKey] <= 0)
			throw new Error(`The maximum routing depth of ${options.maxDepth} has been exceeded.`);

		var result = function servedRouter(destination) {
			return baseRouter.call(this, that, destination);
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

	handle: function handle(options, router, destination) {
		if(typeof this.value !== "object" && typeof this.value !== "function")
			return Promise.reject(TypeError(`Router expected 'object' or 'function' but got '${typeof this}'.`));

		var that = this.value,
			location = this.location,
			binding = this.binding,
			writable = true;

		return filter(this, destination, options.filter).then(function(result) {
			if(result !== options.filterInverse) {
				if(options.callRootFunction && typeof that === "function")
					return that.call(null, destination);
				if(destination in that)
					return that[destination];
			}
			throw new ReferenceError(`'${destination}' could not be routed.`);
		}).then(function(value) {
			// Case 1: Function (not bound)
			if(typeof value === "function" && !Binding.isBound(value)) {
				// If function mapping is enabled:
				if(options.mapFunctions) {
					writable = false;
					// If functions should be mapped to being a router:
					if(options.mapFunctions === "router")
						value = Binding.bind(null, value.bind(that), function() {});
					else if(options.mapFunctions === "call")
						value = value.call(that);
					else if(options.mapFunctions === "direct")
						writable = true;
					else
						throw new Error(`'${destination}' could not be routed.`);
				}
				else
					throw new Error(`'${destination}' could not be routed.`);
			}
			return value;
		}).then(function(value) {
			// Case 2: Bound object (could be a function)
			if(Binding.isBound(value))
				return value;

			// Case 3: Closable data was reached
			var valueDescriptor = writable ? {
				get: function() {
					if(typeof value === "function")
						return value.bind(that);
					return value;
				},
				set: function(newValue) {
					that[destination] = newValue;
					value = newValue;
				},
				enumerable: true
			} : {
				value: value,
				enumerable: true
			};

			// Case 4: Object, that should be traversed deeply

			var targetValue, traversedRouter, type;

			if((typeof value === "object" || typeof value === "function") && value !== null && options.deep && (!Array.isArray(value) || options.deepArrays)) {
				targetValue = value;
				// Request a version of this router with reduced depth:
				// This throws if maxDepth has already been exceeded.
				traversedRouter = router[reduceDepthKey]();
				if(!options.deepen)
					type = Binding.types.clone;
			}
			else {

				let errorMessage = `${typeof value === "object" ? "Object" : "Data"} at position '${location.concat([destination]).join("/")}' is an end point and cannot be routed.`;
				traversedRouter = function servedRouter() {
					throw new Error(errorMessage);
				};

				targetValue = null;
				type = Binding.types.normal;
			}

			return Binding.bind(targetValue, traversedRouter, function closerPropagator(data) {
				return binding.closer.call(this.modified ? this : this.setValue(valueDescriptor), data);
			}, type);
		});
	}
};

module.exports = router;
