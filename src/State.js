"use strict";

// Binding will be late bound, due to circular dependency between it and State.
var Binding;

class State {

	constructor(value, location, origin, binding) {

		if(!Array.isArray(location))
			throw new TypeError("State location has to be an array.");
		if(!Binding || !(binding instanceof Binding))
			throw new TypeError("State binding has to be an instance of Binding.");

		Object.defineProperties(this, {
			value: {
				enumerable: true,
				value: value
			},
			location: {
				enumerable: true,
				value: location.slice(0)
			},
			origin: {
				enumerable: true,
				value: origin
			},
			binding: {
				enumerable: true,
				value: binding
			},
			modified: {
				value: false
			}
		});

		Object.freeze(this);
	}

	static setBinding(val) {
		if(Binding || typeof val !== "function")
			throw new Error("Binding could not be set.");
		Binding = val;
		this.setBinding = undefined;
	}

	toString() {
		return typeof this.value.toString === "function" ? this.value.toString() : Object.prototype.toString.call(this.value);
	}

	valueOf() {
		return typeof this.value.valueOf === "function" ? this.value.valueOf() : this.value;
	}

	setValue(valueDescriptor) {
		if(typeof valueDescriptor !== "object" || valueDescriptor == null)
			throw new TypeError("State valueDescriptor has to be an object.");
		valueDescriptor.enumerable = true;
		return Object.freeze(Object.create(this, {
			value: valueDescriptor,
			modified: {
				value: true
			}
		}));
	}

}

module.exports = State;
