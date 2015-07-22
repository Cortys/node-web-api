"use strict";

const serve = function serve(options) {
	if(typeof options !== "object")
		options = {};

	const mode = options.mode || "both";

	return {
		router: mode === "both" || mode === "router" ? serve.router(options.router) : undefined,
		closer: mode === "both" || mode === "closer" ? serve.closer(options.closer) : undefined
	};
};

serve.router = require("./serve/router");

serve.closer = require("./serve/closer");

module.exports = serve;
