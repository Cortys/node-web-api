var Api = require("./Api"),
	Binding = require("./Binding"),
	helpers = require("./helpers");

function nwa(object, router, closer) {
	// An object of the form { router:[function], closer:[function] } can be used as well:
	if(router != null && typeof router === "object") {
		if(closer !== undefined)
			throw new TypeError("Invalid parameters.");
		if(!Array.isArray(router)) {
			closer = router.closer;
			router = router.router;
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

	object = new Binding(object, helpers.fallthrough(router), helpers.fallthrough(closer));

	return new Api(object);
}

nwa.serve = helpers.serve;
nwa.State = require("./State");

module.exports = nwa;
