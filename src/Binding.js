"use strict";

var State = require("./State");

var types = Object.freeze({
	normal: Symbol("normal"),
	clone: Symbol("clone"),
	rebind: Symbol("rebind")
});

function Binding(object, router, closer, type) {

	if(!(this instanceof Binding))
		return Binding.bind(object, router, closer, type);

	if(typeof type !== "symbol")
		type = types.normal;

	if(object === null)
		object = Object.create(null);

	if(typeof object !== "object" && typeof object !== "function")
		throw new TypeError("Only objects and functions can be bound. Got '" + object + "'.");
	if(Binding.isBound(object) && type !== types.rebind && type !== types.clone)
		throw new Error("Object '" + object + "' is already bound.");

	if(typeof router === "function" && typeof closer === "function") {
		this.router = router;
		this.closer = closer;
	}
	else if(router instanceof Binding) {
		this.router = router.router;
		this.closer = router.closer;
	}
	else
		throw new TypeError("Bindings require a router and a closer function or another binding to copy.");

	Object.defineProperties(this, {
		target: {
			value: object
		},
		type: {
			value: type
		}
	});
}

function traverse(type) {
	return function(location, data) {
		return this[type].call(new State(this.target, location, this), data);
	};
}

Binding.prototype = {
	constructor: Binding,

	target: null,
	router: null,
	closer: null,
	type: null,

	route: traverse("router"),
	close: traverse("closer")
};

Binding.key = Symbol("binding");

Binding.types = types;

Binding.isBound = function isBound(object) {
	return(typeof object === "object" || typeof object === "function") && object !== null && this.key in object && object[this.key] instanceof this;
};

Binding.bind = function bind(object, router, closer, type) {

	var binding = new Binding(object, router, closer, type);

	var target = binding.type === types.clone ? Object.create(binding.target) : binding.target;

	Object.defineProperty(target, Binding.key, {
		configurable: true,
		value: binding
	});

	return target;
};

if(State.setBinding)
	State.setBinding(Binding);

module.exports = Binding;
