var nwa = require("../src");

var a = {
	a: "John Doe",
	b: "Adam Smith",
	c: function(a) {
		var s = "Alex Anderson " + a;
		return nwa(null, undefined, function() {
			return s;
		}).object;
	},
	d: {
		foo: [1, 2, 3.4, 5],
		bar: {
			baz: true,
			fuz: null
		}
	}
};

console.log(a);

var api = nwa(a, nwa.serve({
	router: {
		mapFunctions: "router",
		deep: true,
		deepArrays: true
	},
	closer: {
		writable: true,
		filter: function(object) {
			console.log("filter", Object.keys(object));
			return Object.keys(object).length % 2;
		}
	}
}));

api.close().then(function(data) {
	console.log("(1)", data);
}, function(err) {
	console.error("(1)", err.stack);
});

api.route("c").route("is pretty amazing.").close().then(function(data) {
	console.log("(2)", data);
}, function(err) {
	console.error("(2)", err.stack);
});

api.route("d").route("foo").close().then(function(data) {
	console.log("(3)", data);
}, function(err) {
	console.error("(3)", err.stack);
});
