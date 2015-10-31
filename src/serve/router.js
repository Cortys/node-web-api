"use strict";

const Binding = require("owe-core").Binding;
const helpers = require("owe-helpers");
const exposed = require("../exposed");

// Symbols:
const noDestination = Symbol("noDestination");
const isRoot = Symbol("isRoot");
const currentDepthKey = Symbol("currentDepth");
const reduceDepthKey = Symbol("reduceDepth");

function router(options) {
	if(typeof options !== "object" || options === null)
		options = {};

	options = {
		deep: options.deep || false,
		deepArrays: options.deepArrays || false,
		deepFunctions: options.deepFunctions || false,
		deepen: options.deepen || false,
		maxDepth: "maxDepth" in options ? options.maxDepth * 1 : Infinity,
		mapFunctions: "mapFunctions" in options ? options.mapFunctions : "member",
		mapRootFunction: options.mapRootFunction || false,
		filter: "filter" in options ? options.filter : true,
		filterInverse: !!options.filterInverse || false,
		writable: options.writable || false,
		writableInverse: options.writableInverse || false,
		output: typeof options.output === "function" ? options.output : value => value
	};

	if(Number.isNaN(options.maxDepth) || options.maxDepth < 1)
		options.deep = false;
	else if(options.deep && options.maxDepth > 0 && Number.isFinite(options.maxDepth))
		options.maxDepth = Math.floor(options.maxDepth);

	const baseRouter = function baseRouter(destination, caller) {
		return tools.handle.call(this, options, caller, destination);
	};

	baseRouter[reduceDepthKey] = !options.deep || options.maxDepth === Infinity ? (function() {
		const result = function servedRouter(destination) {
				return baseRouter.call(this, destination, servedRouter);
			},
			innerResult = function servedRouter(destination) {
				return baseRouter.call(this, destination, result);
			};

		result[reduceDepthKey] = innerResult[reduceDepthKey] = function reduceDepth() {
			return innerResult;
		};

		result[currentDepthKey] = innerResult[currentDepthKey] = Infinity;

		result[isRoot] = true;

		return function reduceDepth() {
			return result;
		};
	}()) : function reduceDepth() {
		if(this[currentDepthKey] <= 0)
			return function servedRouter() {
				throw new exposed.Error(`The maximum routing depth of ${options.maxDepth} has been exceeded.`);
			};

		const result = function servedRouter(destination) {
			return baseRouter.call(this, destination, servedRouter);
		};

		result[reduceDepthKey] = reduceDepth;

		result[currentDepthKey] = this[currentDepthKey] - 1;

		if(this === baseRouter)
			result[isRoot] = true;

		return result;
	};

	// Make depth of returned starting point 1 too big...
	baseRouter[currentDepthKey] = options.maxDepth + 1;

	// ...because a version of it with reduced depth by 1 is returned here:
	return baseRouter[reduceDepthKey]();
}

const tools = {
	safeInCheck(object, key) {
		try {
			return key in object;
		}
		catch(err) {
			return false;
		}
	},

	handle(options, router, destination) {
		const route = this.route;
		const binding = this.binding;

		let origin = this.value,
			writable, target;

		if(destination !== noDestination) {
			if(typeof origin !== "object" && typeof origin !== "function" || origin === null)
				throw new TypeError(helpers.string.tag`Router expected object or function but got '${origin}'.`);

			writable = true;
			target = Promise.resolve(helpers.filter(this, destination, options.filter)).then(result => {
				if(result !== options.filterInverse) {
					if(options.mapRootFunction && typeof origin === "function" && router[isRoot]) {
						if(options.mapRootFunction === "router") {
							writable = false;

							return origin(destination);
						}
						if(options.mapRootFunction === "closer")
							throw new exposed.Error(helpers.string.tag`'${destination}' could not be routed.`);
						if(options.mapRootFunction === "call")
							origin = origin();
					}

					if(tools.safeInCheck(origin, destination))
						return origin[destination];
				}
				throw new exposed.Error(helpers.string.tag`'${destination}' could not be routed.`);
			}).then(value => {
				// Case 1: Function (not bound)
				if(typeof value === "function" && !Binding.isBound(value)) {
					// If function mapping is enabled and value was retrieved as an object property (writable = true):
					if(options.mapFunctions && writable) {
						writable = false;

						// If functions should be mapped to being a router:
						if(options.mapFunctions === "router") {
							const func = value;

							value = Binding.bind(null, function generatedRouter(destination) {
								return Promise.resolve(func.call(origin, destination)).then(result => {
									return router.call(this.setValue({
										value: result
									}), noDestination);
								});
							}, binding.closer);
						}
						else if(options.mapFunctions === "closer")
							value = Binding.bind(null, () => undefined, value.bind(origin));
						else if(options.mapFunctions === "call")
							value = value.call(origin);
						else if(options.mapFunctions === "member") {
							writable = true;
							value = value.bind(origin);
						}
						else if(options.mapFunctions === "direct")
							writable = true;
						else
							throw new exposed.Error(helpers.string.tag`'${destination}' could not be routed.`);
					}
					else
						throw new exposed.Error(helpers.string.tag`'${destination}' could not be routed.`);
				}

				return value;
			});
		}
		else {
			writable = false;
			target = Promise.resolve(origin);
		}

		return target.then(value => {
			// Case 2: Bound object (could be a function)
			if(Binding.isBound(value))
				return value;

			return Promise.all([
				options.output.call(this, value),
				writable && helpers.filter(this, destination, options.writable)
			]).then(res => {

				let value = res[0];
				const writable = res[1] !== options.writableInverse;

				if(Binding.isBound(value))
					return value;

				// Case 3: Closable data was reached
				const valueDescriptor = writable ? {
					get() {
						return value;
					},
					set(newValue) {
						origin[destination] = newValue;
						value = origin[destination];
					}
				} : { value };

				// Case 4: Object, origin should be traversed deeply

				let targetValue, traversedRouter, type;

				if((typeof value === "object" || typeof value === "function" && options.deepFunctions) && value !== null && options.deep && (!Array.isArray(value) || options.deepArrays)) {
					targetValue = value;

					// Request a version of this router with reduced depth:
					traversedRouter = router[reduceDepthKey]();
					if(!options.deepen)
						type = Binding.types.clone;
				}
				else {
					targetValue = null;

					const showRoute = (destination === noDestination ? route : [...route, destination])
						.map(helpers.string.convert).join("/");
					const errorMessage = `${typeof value === "object" || typeof value === "function" ? "Object" : "Data"} at position '${showRoute}' is an end point and cannot be routed.`;

					traversedRouter = function servedRouter() {
						throw new exposed.Error(errorMessage);
					};

					type = Binding.types.normal;
				}

				return Binding.bind(targetValue, traversedRouter, function closerPropagator(data) {
					return binding.closer.call(this.modified ? this : this.setValue(valueDescriptor), data);
				}, type);
			});
		});
	}
};

module.exports = router;
