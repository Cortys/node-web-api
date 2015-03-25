"use strict";

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

	var pos = this[position] = (pPosition || []).slice(0);
	this[boundObject] = Promise.resolve(pObject).then(function(object) {
		if(!Binding.isBound(object))
			throw new TypeError("Object at position '" + pos.join("/") + "' is not exposed.");
		return object;
	}).catch(errorHandlers.route.bind(null, pos));
}

var boundObject = Symbol(),
	position = Symbol();

var errorHandlers = {
	route: function route(position, err) {
		if(typeof err === "object" && !err.location) {
			err.type = "route";
			err.location = position;
		}
		throw err;
	},
	close: function close(data, err) {
		if(typeof err === "object" && !err.location) {
			err.type = "close";
			err.location = this[position];
			err.data = data;
		}
		throw err;
	}
};

Api.prototype = {
	constructor: Api,

	route: function route(location) {
		var that = this,
			newPosition = this[position].concat([location]);

		return new Api(this[boundObject].then(function(object) {
			return object[Binding.key].route(that[position], location);
		}), newPosition);
	},

	close: function close(data) {
		var that = this;
		return this[boundObject].then(function(object) {
			return object[Binding.key].close(that[position], data);
		}).catch(errorHandlers.close.bind(this, data));
	},

	get object() {
		return this[boundObject];
	}
};

module.exports = Api;
