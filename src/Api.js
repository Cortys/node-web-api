var Binding = require("./Binding"),
	Closing = require("./Closing");

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

	Closing: Closing,

	route: function route(location) {
		var newPosition = this[position].concat([location]);

		return new Api(this[boundObject].then(function(object) {
			return object[Binding.key].route(location);
		}).catch(function(err) {
			if(!err.location) {
				err.type = "route";
				err.location = newPosition;
			}
			throw err;
		}), newPosition);
	},

	close: function close(data) {
		var that = this;
		return this[boundObject].then(function(object) {
			return object[Binding.key].close(new Closing(object, that[position]), data);
		}).catch(function(err) {
			if(!err.location) {
				err.type = "close";
				err.location = that[position];
				err.data = data;
			}
			throw err;
		});
	}
};

module.exports = Api;
