"use strict";

function oweSwitch(switcher, cases) {
	if(arguments.length === 1) {
		switcher = function() {
			return this.origin.type;
		};
	}
}

module.exports = oweSwitch;
