var Binding = require("./Binding");

/**
 * Represents an Api node.
 * @constructor
 * @module Api
 * @param {object} binding - An object this node should be bound to.
 */
function Api(binding) {
	if(Binding.isBound(binding))
		this._binding = binding;
}

Api.prototype = {
	constructor: Api,

	_binding: null,

	route: function(location) {

	},

	done: function(data) {

	}
};

module.exports = Api;
