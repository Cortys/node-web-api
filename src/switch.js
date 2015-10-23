"use strict";

function oweSwitch(switcher, cases, fallback) {
	if(typeof switcher !== "function")
		throw new TypeError("A switcher has to be a function.");

	/* Using cases: */

	if(cases && typeof cases === "object") {
		const firstCase = cases[Object.keys(cases)[0]];
		const objectMode = firstCase && typeof firstCase === "object";
		const keys = objectMode && Object.keys(firstCase);

		if(keys && keys.length > 0) {
			const switcherGenerator = key => oweSwitch(function(input) {
				const caseKey = switcher.call(this, input);
				const val = caseKey in cases ? cases[caseKey] : fallback;

				return val && typeof val === "object" && val[key];
			});
			const res = {};

			for(const key of keys)
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
			const caseKey = switcher.call(this, input);

			return caseKey in cases ? cases[caseKey] : fallback;
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
