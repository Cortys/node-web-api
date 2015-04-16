"use strict";

var serve = function serve(options) {
	if(typeof options !== "object")
		options = {};

	return {
		router: serve.router(options.router),
		closer: serve.closer(options.closer)
	};
};

serve.router = require("./router");

serve.closer = require("./closer");

var helpers = {
	serve: serve,

	chain: require("./chain")
};

module.exports = helpers;
