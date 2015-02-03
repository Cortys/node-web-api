function serve(object, options) {
	if(typeof options !== "object")
		options = {};
	return {
		router: this.router(object, options.routing),
		closer: this.closer(object, options.closing)
	};
}

serve.router = function router(object, options) {
	if(typeof options !== "object")
		options = {};
};

serve.closer = function closer(object, options) {
	if(typeof options !== "object")
		options = {};
};

var helpers = {
	serve: serve.bind(serve),

	fallthrough: function fallthrough(functions) {
		if(functions == null)
			return function() {};
		if(typeof functions == "function")
			return functions;
		if(!Array.isArray(functions))
			throw new TypeError("Given fallthrough data either has to be of type Function or Array.");

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
