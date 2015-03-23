"use strict";

var Binding;

function State(value, location, binding) {
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
			value: location
		},
		binding: {
			enumerable: true,
			value: binding
		},
		modified: {
			enumerable: false,
			value: false
		}
	});

	Object.freeze(this);
}

State.prototype = Object.freeze(Object.create(null, {

	toString: {
		value: function toString() {
			return typeof this.value.toString === "function" ? this.value.toString() : Object.prototype.toString.call(this.value);
		}
	},
	valueOf: {
		value: function valueOf() {
			return typeof this.value.valueOf === "function" ? this.value.valueOf() : this.value;
		}
	},
	setValue: {
		value: function setValue(valueDescriptor) {
			if(typeof valueDescriptor !== "object" || valueDescriptor == null)
				throw new TypeError("State valueDescriptor has to be an object.");
			return Object.freeze(Object.create(this, {
				value: valueDescriptor,
				modified: {
					value: true
				}
			}));
		}
	}
}));

State.setBinding = function setBinding(val) {
	if(Binding || typeof val !== "function")
		throw new Error("Binding could not be set.");
	Binding = val;
	delete State.setBinding;
};

module.exports = State;
