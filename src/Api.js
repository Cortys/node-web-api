var Binding = require("./Binding");

/**
 * Represents an Api node.
 * @constructor
 * @module Api
 * @param {Object} object - An object this node should be bound to.
 * @param {string[]} position - The stack of routes that led to this API pointer.
 */
function Api(pObject, pPosition) {
	if(pObject instanceof Api)
		return pObject;
	this[boundObject] = Promise.resolve(pObject).then(function(object) {
		if(!Binding.isBound(object))
			throw new TypeError("Object at position '" + position.join("/" + "' is not exposed."));
		return object;
	});
	this[position] = pPosition || [];
}

var boundObject = Symbol(),
	position = Symbol();

Api.prototype = {
	constructor: Api,

	route: function route(location) {
		var newPosition = this[position].concat([location]);

		return new Api(this[boundObject].then(function(object) {
			return object[Binding.key].route(location);
		}).catch(function(err) {
			err.type = "route";
			err.location = newPosition;
			throw err;
		}), newPosition);
	},

	close: function close(data) {
		return this[boundObject].then(function(object) {
			return object[Binding.key].close(data);
		}).catch(function(err) {
			err.type = "close";
			err.location = this[position];
			err.data = data;
			throw err;
		});
	}
};

module.exports = Api;
