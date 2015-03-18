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
		writable: function() {
			return Math.random() > 0.5;
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

api.route("d").route("foo").route(0).close([5, 6, 7.8]).then(function(data) {
	console.log("(3)", data);
}, function(err) {
	console.error("(3)", err.stack);
});
