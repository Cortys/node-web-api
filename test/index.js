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

var api = nwa(a, nwa.serve());

api.route("c").close().then(function(data) {
	console.log(data);
}, function(errs) {
	console.error(errs);
	console.error(errs.stack);
});
