module.exports = function(target, location, filter, inverse) {
	var res = false;
	if(typeof filter === "function")
		res = !!filter.call(target, location);
	else if(filter instanceof Set)
		res = filter.has(location);
	else if(filter instanceof Map)
		res = !!filter.get(location);
	else if(Array.isArray(filter))
		res = filter.indexOf(location) !== -1;
	else if(typeof filter === "object")
		res = !!filter[location];
	return inverse?!res:res;
};
