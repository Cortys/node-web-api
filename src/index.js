"use strict";

var Api = require("./Api"),
	Binding = require("./Binding"),
	State = require("./State"),
	helpers = require("./helpers");

function owe(object, router, closer) {

	if(object instanceof Api)
		throw new TypeError("Api objects cannot be exposed as an Api.");

	// An object of the form { router:[function], closer:[function] } can be used as well:
	if(router != null && typeof router === "object") {
		if(closer !== undefined || Array.isArray(router))
			throw new TypeError("Invalid parameters.");
		closer = router.closer;
		router = router.router;
	}

	router = router == null ? function() {} : router;
	closer = closer == null ? function() {} : closer;

	return Binding.bind(object, router, closer);
}

owe.api = function(object, router, closer) {
	if(!Binding.isBound(object))
		object = owe(object, router, closer);

	return new Api(object);
};

owe.serve = helpers.serve;
owe.chain = helpers.chain;
owe.State = State;
owe.Binding = Binding;

module.exports = owe;
