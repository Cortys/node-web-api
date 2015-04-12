"use strict";

var Binding = require("../Binding"),
	filter = require("./filter");

function router(options) {
	if(typeof options !== "object" || options === null)
		options = {};

	options = {
		deep: options.deep || false,
		deepArrays: options.deepArrays || false,
		deepFunctions: options.deepFunctions || false,
		deepen: options.deepen || false,
		maxDepth: "maxDepth" in options ? options.maxDepth * 1 : Infinity,
		mapFunctions: options.mapFunctions || "member",
		mapRootFunction: options.mapRootFunction || false,
		filter: "filter" in options ? options.filter : true,
		filterInverse: !!options.filterInverse || false
	};

	if(isNaN(options.maxDepth) || options.maxDepth < 1)
		options.deep = false;

	if(options.deep && options.maxDepth > 0 && isFinite(options.maxDepth))
		options.maxDepth = Math.floor(options.maxDepth);

	var baseRouter = function baseRouter(destination, caller) {

		return tools.handle.call(this, options, caller, destination);
	};

	baseRouter[reduceDepthKey] = !options.deep || options.maxDepth === Infinity ? (function() {

		var result = function servedRouter(destination) {
				return baseRouter.call(this, destination, servedRouter);
			},
			innerResult = function servedRouter(destination) {
				return baseRouter.call(this, destination, result);
			};

		result[reduceDepthKey] = innerResult[reduceDepthKey] = function reduceDepth() {
			return innerResult;
		};

		result[currentDepthKey] = innerResult[currentDepthKey] = Infinity;

		return function reduceDepth() {
			return result;
		};
	}()) : function reduceDepth() {

		if(this[currentDepthKey] <= 0)
			return function servedRouter() {
				throw new Error(`The maximum routing depth of ${options.maxDepth} has been exceeded.`);
			};

		var result = function servedRouter(destination) {
			return baseRouter.call(this, destination, servedRouter);
		};

		result[reduceDepthKey] = reduceDepth;

		result[currentDepthKey] = this[currentDepthKey] - 1;

		return result;
	};

	// Make depth of returned starting point 1 too big...
	baseRouter[currentDepthKey] = options.maxDepth + 1;

	baseRouter[isRoot] = true;

	// ...because a version of it with reduced depth by 1 is returned here:
	return baseRouter[reduceDepthKey]();
}

// Symbols:
var noDestination = Symbol("noDestination"),
	isRoot = Symbol("isRoot"),
	currentDepthKey = Symbol("currentDepth"),
	reduceDepthKey = Symbol("reduceDepth");

var tools = {

	handle: function handle(options, router, destination) {

		var that = this.value,
			location = this.location,
			binding = this.binding,
			writable, target;

		if(destination !== noDestination) {

			if(typeof this.value !== "object" && typeof this.value !== "function" || this.value === null)
				return Promise.reject(new TypeError(`Router expected object or function but got '${typeof this.value === "symbol" ? "[symbol]" : this.value}'.`));

			writable = true;
			target = filter(this, destination, options.filter).then(function(result) {

				if(result !== options.filterInverse) {
					if(options.mapFunctions && options.mapRootFunction && typeof that === "function" && router[isRoot]) {
						writable = false;
						if(options.mapFunctions === "router")
							return that(destination);
						if(options.mapFunctions === "closer")
							throw new Error(`'${destination}' could not be routed.`);
						if(options.mapFunctions === "call")
							that = that();
					}
					if(destination in that)
						return that[destination];
				}
				throw new Error(`'${destination}' could not be routed.`);
			}).then(function(value) {
				// Case 1: Function (not bound)
				if(typeof value === "function" && !Binding.isBound(value)) {
					// If function mapping is enabled and value was retrieved as an object property (writable = true):
					if(options.mapFunctions && writable) {
						writable = false;
						// If functions should be mapped to being a router:
						if(options.mapFunctions === "router") {
							let func = value;
							value = Binding.bind(null, function generatedRouter(destination) {
								var state = this;

								return Promise.resolve(func.call(that, destination)).then(function(result) {
									return router.call(state.setValue({
										value: result
									}), noDestination);
								});
							}, binding.closer);
						}
						else if(options.mapFunctions === "closer")
							value = Binding.bind(null, function() {}, value.bind(that));
						else if(options.mapFunctions === "call")
							value = value.call(that);
						else if(options.mapFunctions === "member") {
							writable = true;
							value = value.bind(that);
						}
						else if(options.mapFunctions === "direct")
							writable = true;
						else
							throw new Error(`'${destination}' could not be routed.`);
					}
					else
						throw new Error(`'${destination}' could not be routed.`);
				}
				return value;
			});
		}
		else {
			writable = false;
			target = Promise.resolve(that);
		}

		return target.then(function(value) {
			// Case 2: Bound object (could be a function)
			if(Binding.isBound(value))
				return value;

			// Case 3: Closable data was reached
			var valueDescriptor = writable ? {
				get: function() {
					return value;
				},
				set: function(newValue) {
					that[destination] = newValue;
					value = newValue;
				}
			} : {
				value: value
			};

			// Case 4: Object, that should be traversed deeply

			var targetValue, traversedRouter, type;

			if((typeof value === "object" || typeof value === "function" && options.deepFunctions) && value !== null && options.deep && (!Array.isArray(value) || options.deepArrays)) {
				targetValue = value;
				// Request a version of this router with reduced depth:
				traversedRouter = router[reduceDepthKey]();
				if(!options.deepen)
					type = Binding.types.clone;
			}
			else {

				let errorMessage = `${typeof value === "object" || typeof value === "function" ? "Object" : "Data"} at position '${location.concat([destination]).join("/")}' is an end point and cannot be routed.`;
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
