
function Binding(object, router, closer) {
	if(Binding.isBound(object))
		throw new Error("Object '"+object.toString()+"' is already bound.");
	Object.defineProperty(object, Binding.key, {
		value: this
	});

	this.route = router.bind(this);

	this.close = closer.bind(this);
}

Binding.prototype = {
	constructor: Binding,

	route: null,
	close: null
};

Binding.key = Symbol("binding");

Binding.isBound = function(object) {
	return Binding.key in object && object[Binding.key] instanceof Binding;
};
