"use strict";

var Api = require("./Api"),
	Binding = require("./Binding"),
	helpers = require("./helpers");

function owe(object, router, closer) {
	// An object of the form { router:[function], closer:[function] } can be used as well:
	if(router != null && typeof router === "object") {
		if(closer !== undefined || Array.isArray(router))
			throw new TypeError("Invalid parameters.");
		closer = router.closer;
		router = router.router;
	}

	router = router == null ? function() {} : router;
	closer = closer == null ? function() {} : closer;

	object = Binding.bind(object, router, closer);

	return new Api(object);
}

owe.serve = helpers.serve;
owe.chain = helpers.chain;
owe.State = require("./State");

module.exports = owe;
