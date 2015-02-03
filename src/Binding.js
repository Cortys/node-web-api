
function Binding(object, router, closer, rebind) {
	if(typeof object !== "object")
		throw new TypeError("Only objects can be bound. Got '"+object.toString()+"'.");
	if(Binding.isBound(object) && !rebind)
		throw new Error("Object '"+object.toString()+"' is already bound.");

	if(!(Binding.key in object))
		Object.defineProperty(object, Binding.key, {
			writable: true
		});

	if(typeof router === "function" && typeof closer === "function") {

		this.route = router.bind(object);

		this.close = closer.bind(object);

		object[Binding.key] = this;
	}
	else if(router instanceof Binding)
		object[Binding.key] = router;
	else
		throw new TypeError("Bindings require a router and a closer function or a master binding.");
}

Binding.prototype = {
	constructor: Binding,

	route: null,
	close: null
};

Binding.key = Symbol("binding");

Binding.isBound = function isBound(object) {
	return typeof object === "object" && this.key in object && object[this.key] instanceof this;
};

Binding.bind = function bind(object, router, closer, rebind) {
	new this(object, router, closer, rebind);
	return object;
};

Binding.imitate = function imitate(object, master, permanent) {
	if(!this.isBound(master))
		throw new TypeError("Only bound objects can be imitated.");
	return this.bind(permanent?object:Object.create(object), master[this.key]);
};

module.exports = Binding;
