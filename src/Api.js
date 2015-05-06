"use strict";

var Binding = require("./Binding");

/**
 * Represents an Api node.
 * @constructor
 * @module Api
 * @param {Object} object - An object this node should be bound to.
 * @param {string[]} position - The stack of routes that led to this API pointer.
 */
class Api {

	constructor(pObject, pPosition) {
		var pos = this[position] = (pPosition || []).slice(0);
		this[boundObject] = Promise.resolve(pObject).then(function(object) {
			if(!Binding.isBound(object))
				throw new TypeError("Object at position '" + pos.join("/") + "' is not exposed.");
			return object;
		}).catch(errorHandlers.route.bind(null, pos));
	}

	route(destination) {
		var that = this,
			newPosition = this[position].concat([destination]);

		return new Api(this[boundObject].then(function(object) {
			return object[Binding.key].route(that[position], destination);
		}), newPosition);
	}

	close(data) {
		var that = this;
		return this[boundObject].then(function(object) {
			return object[Binding.key].close(that[position], data);
		}).catch(errorHandlers.close.bind(this, data));
	}

	then(success, fail) {
		return this.close().then(success, fail);
	}

	catch(fail) {
		return this.close().catch(fail);
	}

	get object() {
		return this[object] || (this[object] = this[boundObject].then(function(object) {
			return object[Binding.key].target;
		}));
	}

}

var errorHandled = Symbol("errorHandled"),
	boundObject = Symbol("boundObject"),
	object = Symbol("object"),
	position = Symbol("position");

var errorHandlers = {

	route(position, err) {
		try {
			if(!(errorHandled in err)) {
				err.type = "route";
				err.location = position;
				err[errorHandled] = true;
			}
		}
		finally {
			throw err;
		}
	},

	close(data, err) {
		try {
			if(!(errorHandled in err)) {
				err.type = "close";
				err.location = this[position];
				err.data = data;
				err[errorHandled] = true;
			}
		}
		finally {
			throw err;
		}
	}
};

module.exports = Api;
