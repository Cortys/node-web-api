"use strict";

function oweSwitch(switcher, cases) {
	if(typeof switcher !== "function")
		throw new TypeError("A switcher has to be a function.");

	/* Using cases: */

	if(cases && typeof cases === "object") {
		const firstCase = cases[Object.keys(cases)[0]];
		const objectMode = firstCase && typeof firstCase === "object";

		if(objectMode) {
			const switcherGenerator = key => oweSwitch(function(input) {
				const val = cases[switcher.call(this, input)];

				return val && typeof val === "object" && val[key];
			});
			const res = {};

			for(const key of Object.keys(firstCase))
				Object.defineProperty(res, key, typeof firstCase[key] === "function" ? {
					enumerable: true,
					value: switcherGenerator(key)
				} : {
					enumerable: true,
					get: switcherGenerator(key)
				});

			return res;
		}

		return oweSwitch(function(input) {
			return cases[switcher.call(this, input)];
		});
	}

	/* Using fully customized switchers: */

	return function servedSwitch(input) {
		let res = switcher.call(this, input);

		if(typeof res !== "function")
			return res;

		return res.call(this, input);
	};
}

module.exports = oweSwitch;
