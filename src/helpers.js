var Binding = require("./Binding");

function serve(options) {
	if(typeof options !== "object")
		options = {};

	return {
		router: this.router(options.routing),
		closer: this.closer(options.closing)
	};
}

serve.router = function router(options) {
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
		if(!(mode in router.modes))
			throw new TypeError("'"+mode+"'-data cannot be routed by serve.router.");
		return router.modes[mode].call(this, options, location);
	};
};

var router = {

	filter: function(location, filter, inverse) {
		var res = false;
		if(typeof filter === "function")
			res = !!filter(location);
		else if(filter instanceof Set)
			res = filter.has(location);
		else if(filter instanceof Map)
			res = !!filter.get(location);
		else if(Array.isArray(filter))
			res = filter.indexOf(location) !== -1;
		else if(typeof filter === "object")
			res = !!filter[location];
		return inverse?!res:res;
	},
	modes: {
		"function": function(options, location) {
			if(typeof this !== "function")
				throw new TypeError("serve.router expected 'function' but got '"+(typeof this)+"'.");

			if(router.filter(location, options.filter.bind(this), options.filterInverse))
				return this.call(this, location);
			throw new Error("'"+location+"' could not be routed.");
		},
		"object": function(options, location) {
			if(typeof this !== "object")
				throw new TypeError("serve.router expected 'object' but got '"+(typeof this)+"'.");

			if(location in this && router.filter(location, options.filter.bind(this), options.filterInverse)) {
				var value = this[location];
				if(typeof value === "function") {
					if(options.mapFunctions)
						value = value.call(this);
					else
						throw new Error("'"+location+"' could not be routed.");
				}
				Promise.resolve(value).then(function(value) {
					if(Binding.isBound(value))
						return value;
					if(typeof value === "object" && options.deep)
						return Binding.imitate(value, this, options.deepen);

				});
			}
			throw new Error("'"+location+"' could not be routed.");
		}
	}
};

serve.closer = function closer(options) {
	if(typeof options !== "object")
		options = {};

	return function servedCloser(data) {

	};
};

var helpers = {
	serve: serve.bind(serve),

	fallthrough: function fallthrough(functions) {
		if(functions == null)
			return function() {};
		if(typeof functions == "function")
			return functions;
		if(!Array.isArray(functions))
			throw new TypeError("Given fallthrough data either has to be of type 'function' or 'array'.");

		return function() {
			for(var currErr, lastErr, r, f, i = 0; i < functions.length; i++) {
				f = functions[i];
				if(typeof f != "function")
					continue;

				currErr = null;
				try {
					r = f.apply(this, arguments);
				} catch(err) {
					lastErr = currErr = err;
				}

				if(!currErr && r !== undefined)
					return r;
			}

			if(!lastErr)
				return undefined;
			else
				throw lastErr;
		};
	}
};

module.exports = helpers;
