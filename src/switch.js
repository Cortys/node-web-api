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
			const switcherGenerator = key => oweSwitch(function() {
				const caseKey = switcher.apply(this, arguments);
				const val = caseKey in cases ? cases[caseKey] : fallback;

				if(!val || typeof val !== "object")
					throw new Error(`Case '${caseKey}' is not an object.`);

				return val[key];
			});
			const res = {};

			for(const key of keys)
				Object.defineProperty(res, key, {
					enumerable: true,
					[typeof firstCase[key] === "function" ? "value" : "get"]: switcherGenerator(key)
				});

			return res;
		}

		return oweSwitch(function() {
			const caseKey = switcher.apply(this, arguments);

			return caseKey in cases ? cases[caseKey] : fallback;
		});
	}

	/* Using fully customized switchers: */

	return function servedSwitch() {
		const res = switcher.apply(this, arguments);

		return typeof res === "function" ? res.apply(this, arguments) : res;
	};
}

module.exports = oweSwitch;
