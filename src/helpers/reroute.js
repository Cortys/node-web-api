"use strict";

var Binding = require("../Binding");

function reroute(object, options) {
	if(typeof object !== "object" && typeof object !== "function" || object === null)
		throw new TypeError("reroute requires a bindable object.");

	if(typeof options !== "object" || options === null)
		options = {};

	var mode = options.mode || "both";

	return {
		router: mode === "both" || mode === "router" ? reroute.router(object) : undefined,
		closer: mode === "both" || mode === "closer" ? reroute.closer(object) : undefined
	};
}

function rerouteGenerator(method, object) {
	return function servedRerouter(data) {
		if(!Binding.isBound(object))
			throw new TypeError("Only bound objects can be a rerouting target.");
		return object[Binding.key][method](this.location, this.origin, data);
	};
}

reroute.router = rerouteGenerator.bind(null, "route");
reroute.closer = rerouteGenerator.bind(null, "close");

module.exports = reroute;
