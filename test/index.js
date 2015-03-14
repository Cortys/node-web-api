var nwa = require("../src");

var a = {
	a: "John Doe",
	b: "Adam Smith",
	c: function(a) {
		var s = "Alex Anderson "+a;
		return nwa(undefined, undefined, function() {
			return s;
		}).object;
	},
	d: {
		foo: [1, 2, 3.4],
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
		writable: true
	}
}));

api.route("c").route("is pretty amazing.").close().then(function(data) {
	console.log(data);
}, function(err) {
	console.error(err.stack);
});

api.route("d").route("foo").close().then(function(data) {
	console.log(data);
}, function(err) {
	console.log(err.stack);
});
