function Binding(object, router, closer, rebind) {

	if(object == null)
		object = Object.create(null);

	if(typeof object !== "object" && typeof object !== "function")
		throw new TypeError("Only objects and functions can be bound. Got '" + object.toString() + "'.");
	if(Binding.isBound(object) && !rebind)
		throw new Error("Object '" + object.toString() + "' is already bound.");

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

	if(!(Binding.key in object))
		Object.defineProperty(object, Binding.key, {
			writable: true
		});

	this.target = object;

	object[Binding.key] = this;
}

Binding.prototype = {
	constructor: Binding,

	target: null,
	router: null,
	closer: null,

	route: function route() {
		return this.router.apply(this.target, arguments);
	},
	close: function close() {
		return this.closer.apply(this.target, arguments);
	}
};

Binding.key = Symbol();

Binding.isBound = function isBound(object) {
	return typeof object === "object" && this.key in object && object[this.key] instanceof this;
};

Binding.isEmpty = function isEmpty(object) {
	return this.isBound(object) && Binding.empty.isPrototypeOf(object);
};

Binding.bind = function bind(object, router, closer, rebind) {
	return new this(object, router, closer, rebind).target;
};

Binding.imitate = function imitate(object, master, permanent) {
	if(!this.isBound(master))
		throw new TypeError("Only bound objects can be imitated.");
	return this.bind(permanent ? object : Object.create(object), master[this.key]);
};

module.exports = Binding;
