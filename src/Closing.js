function Closing(value, location) {
	if(!Array.isArray(location))
		throw new TypeError("Closing location has to be an array.");

	Object.defineProperties(this, {
		value: {
			enumerable: true,
			value: value
		},
		location: {
			enumerable: true,
			value: location
		}
	});

	Object.freeze(this);
}

Closing.prototype = Object.freeze(Object.create(null, {

	constructor: {
		value: Closing
	},

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
				throw new TypeError("Closing valueDescriptor has to be an object.");
			return Object.freeze(Object.create(this, {
				value: valueDescriptor
			}));
		}
	}
}));

module.exports = Closing;
