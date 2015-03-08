var Api = require("./Api"),
	Binding = require("./Binding"),
	helpers = require("./helpers");

function Base() {

	var object = {};

	Binding.bind(object, helpers.serve.router(object), helpers.serve.closer(undefined));

	Object.defineProperty(this, "api", {
		value: new Api(object)
	});
}

Base.prototype = {
	constructor: Base,

	serve: helpers.serve,

	expose(object, router, closer) {

		// An object of the form { router:[function], closer:[function] } can be used as well:
		if(closer === undefined && typeof router === "object") {
			if(!Array.isArray(router)) {
				router = router.router;
				closer = router.closer;
			}
			else {
				closer = [];
				router.forEach(function(i, v) {
					if(typeof v !== "object")
						throw new TypeError("router has to be of type 'function', 'object' or arrays of such.");
					router[i] = v.router;
					closer.push(v.closer);
				});
			}
		}

		Binding.bind(object, helpers.fallthrough(router), helpers.fallthrough(closer));

		return this;
	}

};

module.exports = Base;
