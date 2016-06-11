"use strict";

const Binding = require("owe-core").Binding;
const helpers = require("owe-helpers");
const exposed = require("owe-core").exposed;

// Symbols:
const noDestination = Symbol("noDestination");
const isRoot = Symbol("isRoot");
const currentDepthKey = Symbol("currentDepth");
const reduceDepthKey = Symbol("reduceDepth");

function router(options) {
	if(typeof options !== "object" || options === null)
		options = {};

	options = {
		deep: !!options.deep || false,
		deepArrays: !!options.deepArrays || false,
		deepFunctions: !!options.deepFunctions || false,
		deepen: !!options.deepen || false,
		maxDepth: "maxDepth" in options ? +options.maxDepth : Infinity,
		mapFunctions: "mapFunctions" in options ? options.mapFunctions : "member",
		mapRootFunction: options.mapRootFunction || false,
		filter: "filter" in options ? options.filter : true,
		writable: "writable" in options ? options.writable : false,
		traversePrototype: !!options.traversePrototype || false,
		output: "output" in options ? options.output : value => value
	};

	if(Number.isNaN(options.maxDepth) || options.maxDepth < 1)
		options.deep = false;
	else if(options.deep && options.maxDepth > 0 && Number.isFinite(options.maxDepth))
		options.maxDepth = Math.floor(options.maxDepth);

	const baseRouter = function baseRouter(destination, state, caller) {
		return tools.handle(options, caller, destination, state);
	};

	baseRouter[reduceDepthKey] = !options.deep || options.maxDepth === Infinity ? (function() {
		const result = function servedRouter(destination, state) {
			return baseRouter(destination, state, servedRouter);
		};
		const innerResult = function servedRouter(destination, state) {
			return baseRouter(destination, state, result);
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

		const result = function servedRouter(destination, state) {
			return baseRouter(destination, state, servedRouter);
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
	safeInCheck(object, key, traversePrototype) {
		try {
			return traversePrototype
				? key in object
				: Object.prototype.hasOwnProperty.call(object, key);
		}
		catch(err) {
			return false;
		}
	},

	handle(options, router, destination, state) {
		let origin = state.value;
		let target, writable;

		if(destination !== noDestination) {
			if(typeof origin !== "object" && typeof origin !== "function" || origin === null)
				throw new TypeError(helpers.string.tag`Router expected object or function but got '${origin}'.`);

			writable = true;
			target = helpers.filter(options.filter, state, destination, state).then(result => {
				if(result) {
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

					if(tools.safeInCheck(origin, destination, options.traversePrototype))
						return origin[destination];
				}

				throw new exposed.Error(helpers.string.tag`'${destination}' could not be routed.`);
			}).then(value => {
				// Case 1: Function (not bound)
				if(typeof value === "function" && !Binding.isBound(value)) {
					// If function mapping is enabled and value was retrieved as an object property (writable = true):
					if(options.mapFunctions && writable) {
						const func = value;

						writable = false;

						// If functions should be mapped to being a router:
						if(options.mapFunctions === "router")
							value = Binding.bind(null, destination => {
								return Promise.resolve(func.call(origin, destination)).then(result => {
									const newState = state.setValue({
										value: result
									});

									return router.call(newState, noDestination, newState);
								});
							}, state.binding.closer);
						else if(options.mapFunctions === "closer")
							value = Binding.bind(null, destination => {
								throw new exposed.Error(helpers.string.tag`'${destination}' could not be routed.`);
							}, data => func.call(origin, data));
						else if(options.mapFunctions === "call")
							value = func.call(origin);
						else if(options.mapFunctions === "member") {
							writable = true;
							value = func.bind(origin);
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
				options.output.call(state, value, state),
				writable && helpers.filter(options.writable, state, destination, state)
			]).then(([value, writable]) => {
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

					const showRoute = (destination === noDestination ? state.route : [...state.route, destination])
						.map(helpers.string.convert).join("/");
					const errorMessage = `${typeof value === "object" || typeof value === "function" ? "Object" : "Data"} at position '${showRoute}' is an end point and cannot be routed.`;

					traversedRouter = function servedRouter() {
						throw new exposed.Error(errorMessage);
					};

					type = Binding.types.normal;
				}

				return Binding.bind(targetValue, traversedRouter, (data, innerState) => {
					const newState = innerState.modified ? innerState : innerState.setValue(valueDescriptor);

					return state.binding.closer.call(newState, data, newState);
				}, type);
			});
		});
	}
};

module.exports = router;
