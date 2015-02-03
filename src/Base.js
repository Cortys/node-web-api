var Api = require("./Api"),
	Binding = require("./Binding"),
	helpers = require("./helpers");

function Base() {

	var object = {};

	new Binding(object, helpers.serve.router(object), helpers.serve.closer(undefined));

	Object.defineProperty(this, "api", {
		value: new Api(object)
	});
}

Base.prototype = {
	constructor: Base,

	serve: helpers.serve,

	expose: function expose(object, router, closer) {

		// An object of the form { router:[function], closer:[function] } can be used as well:
		if(closer === undefined && typeof router === "object" && !Array.isArray(router)) {
			router = router.router;
			closer = router.closer;
		}

		new Binding(object, helpers.fallthrough(router), helpers.fallthrough(closer));

		return new Api(object);
	}

};

module.exports = Base;
