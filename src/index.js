"use strict";

var Api = require("./Api"),
	Binding = require("./Binding"),
	helpers = require("./helpers");

function fallthroughCall(functions, message) {
	try {
		return helpers.fallthrough(functions);
	}
	catch(err) {
		throw new TypeError(message);
	}
}

function owe(object, router, closer) {
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

	router = fallthroughCall(router, "Invalid router.");
	closer = fallthroughCall(closer, "Invalid closer.");

	object = Binding.bind(object, router, closer);

	return new Api(object);
}

owe.serve = helpers.serve;
owe.State = require("./State");

module.exports = owe;
