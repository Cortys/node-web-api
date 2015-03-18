var State = require("./State");

var types = Object.freeze({
	normal: Symbol("normal"),
	clone: Symbol("clone"),
	rebind: Symbol("rebind")
});

function Binding(object, router, closer, type) {

	if(typeof type !== "symbol")
		type = types.normal;

	if(object == null)
		object = Object.create(null);

	if(typeof object !== "object" && typeof object !== "function")
		throw new TypeError("Only objects and functions can be bound. Got '" + object + "'.");
	if(Binding.isBound(object) && type === types.normal)
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
		throw new TypeError("Bindings require a router and a closer function or a master binding.");

	if(type === types.clone)
		object = Object.create(object);

	if(!(Binding.key in object))
		Object.defineProperty(object, Binding.key, {
			writable: true
		});

	this.target = object;
	this.type = type;

	object[Binding.key] = this;
}

Binding.prototype = {
	constructor: Binding,

	target: null,
	router: null,
	closer: null,
	type: null,

	route: function route(location, data) {
		return this.router.call(new State(this.type === types.clone ? Object.getPrototypeOf(this.target) : this.target, location, this), data);
	},
	close: function close(location, data) {
		return this.closer.call(new State(this.type === types.clone ? Object.getPrototypeOf(this.target) : this.target, location, this), data);
	}
};

Binding.key = Symbol();

Binding.types = types;

Binding.isBound = function isBound(object) {
	return typeof object === "object" && object !== null && this.key in object && object[this.key] instanceof this;
};

Binding.isEmpty = function isEmpty(object) {
	return this.isBound(object) && Binding.empty.isPrototypeOf(object);
};

Binding.bind = function bind(object, router, closer, type) {
	return new this(object, router, closer, type).target;
};

module.exports = Binding;
