var nwa = require("../src");

var a = {
	a: "John Doe",
	b: "Adam Smith",
	c: function() {
		return "Alex Anderson";
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
	closer: {
		writable: true
	}
}));

api.route("a").close(true).then(function(data) {
	console.log(data);
}, function(err) {
	console.error(err);
	console.error(err.stack);
});
