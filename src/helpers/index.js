var serve = function serve(options) {
	if(typeof options !== "object")
		options = {};

	return {
		router: serve.router(options.routing),
		closer: serve.closer(options.closing)
	};
};

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
			var that = this,
				result,
				errs = [],
				args = arguments;

			for(let i = 0; i < functions.length; i++) {
				let f = functions[i];
				if(typeof f != "function")
					continue;

				if(!result)
					result = Promise.resolve(f.apply(that, args));
				else
					result.catch(function(err) {
						errs.push(err);
						return f.apply(that, args);
					});
			}

			if(result)
				result.catch(function(err) {
					errs.push(err);
					throw errs;
				});

			return result;
		};
	}
};

module.exports = helpers;
