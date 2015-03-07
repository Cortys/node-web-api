var Binding = require("./Binding");

/**
 * Represents an Api node.
 * @constructor
 * @module Api
 * @param {Object} binding - An object this node should be bound to.
 */
function Api(boundObject, position) {
	if(boundObject instanceof Api)
		return api;
	this._boundObject = Promise.resolve(boundObject).then(function(object) {
		if(!Binding.isBound(object))
			throw new TypeError("Object at position '" + position.join("/" + "' is not exposed."));
		return object;
	});
	this._position = position || [];
}

Api.prototype = {
	constructor: Api,

	_boundObject: null,
	_position: null,

	route: function route(location) {
		var newPosition = this._position.concat([location]);

		return new Api(this._boundObject.then(function(object) {
			return object[Binding.key].route(location);
		}).catch(function(err) {
			err.type = "route";
			err.location = newPosition;
			throw err;
		}), newPosition);
	},

	close: function close(data) {
		return this._boundObject.then(function(object) {
			return object[Binding.key].close(data);
		}).catch(function(err) {
			err.type = "close";
			err.location = this._position;
			err.data = data;
			throw err;
		});
	}
};

module.exports = Api;
