"use strict";

var State = require("./State");

var types = Object.freeze({
	normal: Symbol("normal"),
	clone: Symbol("clone"),
	rebind: Symbol("rebind")
});

class Binding {

	constructor(object, router, closer, type, clonedObject) {

		if(typeof type !== "symbol")
			type = types.normal;

		if(typeof object !== "object" && typeof object !== "function")
			throw new TypeError("Only objects and functions can be bound. Got '" + object + "'.");
		if(Binding.isBound(object) && type !== types.rebind && type !== types.clone)
			throw new Error("Object '" + object + "' is already bound.");

		if(router instanceof Binding) {
			closer = router.closer;
			router = router.router[types.clone] || router.router;
		}
		else if(typeof router !== "function" || typeof closer !== "function")
			throw new TypeError("Bindings require a router and a closer function or another binding to copy.");

		var usedRouter = type === types.clone && clonedObject !== undefined ? function() {
			return Promise.resolve(router.apply(this, arguments)).then(function(result) {
				return result === object ? clonedObject : result;
			});
		} : router;

		usedRouter[types.clone] = router;

		this.router = usedRouter;
		this.closer = closer;

		Object.defineProperties(this, {
			target: {
				value: object
			},
			type: {
				value: type
			}
		});
	}

	static isBound(object) {
		return(typeof object === "object" || typeof object === "function") && object !== null && Object.getOwnPropertyDescriptor(object, this.key) !== undefined && object[this.key] instanceof this;
	}

	static bind(object, router, closer, type) {

		var target = object === null || type === types.clone ? Object.create(null, {
				object: {
					value: object
				}
			}) : object,
			binding = new this(object, router, closer, type, target);

		Object.defineProperty(target, this.key, {
			configurable: true,
			value: binding
		});

		return target;
	}

	static unbind(object) {

		if(this.isBound(object))
			delete object[this.key];

		return object;

	}

}

function traverse(type) {
	return function(location, origin, data) {
		return this[type].call(new State(this.target, location, origin, this), data);
	};
}

Object.defineProperties(Binding.prototype, {
	route: {
		value: traverse("router")
	},
	close: {
		value: traverse("closer")
	}
});

Object.defineProperties(Binding, {
	key: {
		value: Symbol("binding")
	},
	types: {
		value: types
	}
});

if(State.setBinding)
	State.setBinding(Binding);

module.exports = Binding;
