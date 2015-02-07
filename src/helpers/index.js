var Binding = require("./Binding");

var serve = function serve(options) {
	if(typeof options !== "object")
		options = {};

	return {
		router: this.router(options.routing),
		closer: this.closer(options.closing)
	};
}, serve = serve.bind(serve);

serve.router = require("./router");

serve.closer = require("./closer");

var helpers = {
	serve: serve,

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
