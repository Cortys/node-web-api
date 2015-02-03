var Binding = require("./Binding");

/**
 * Represents an Api node.
 * @constructor
 * @module Api
 * @param {object} binding - An object this node should be bound to.
 */
function Api(boundObject) {
	if(Binding.isBound(boundObject)) {
		this._boundObject = boundObject;
		this._binding = boundObject[Binding.key];
	}
}

Api.prototype = {
	constructor: Api,

	_boundObject: null,
	_binding: null,

	route: function route(location) {
		return new Api(this._binding.route(location));
	},

	close: function close(data) {
		return this._binding.close(data);
	}
};

module.exports = Api;
