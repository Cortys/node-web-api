var expect = require("expect.js");

var owe = require("../../src"),
	helpers = require("../../src/helpers");

describe(".chain", function() {

	it("should throw for non iterable values", function() {
		expect(helpers.chain).withArgs(true).to.throwError();
		expect(helpers.chain).withArgs(1).to.throwError();
		expect(helpers.chain).withArgs({}).to.throwError();
		expect(helpers.chain).withArgs("test").to.throwError();
		expect(helpers.chain).withArgs(Symbol()).to.throwError();
		expect(helpers.chain).withArgs(function() {}).to.throwError();
	});

	describe("function mode", function() {

		it("should return a function", function() {
			expect(helpers.chain(new Set())).to.be.a("function");
			expect(helpers.chain([])).to.be.a("function");
			expect(helpers.chain(new Map())).to.be.a("function");
			expect(helpers.chain(function*() {
				yield 1;
				yield 2;
				yield 3;
			}())).to.be.a("function");
		});

		describe("errors option", function() {
			it("all: should throw all errors as array of errors", function() {
				return helpers.chain([function() {
					throw "a";
				}, function() {
					throw "b";
				}], {
					errors: "all"
				})().then(function() {
					expect().fail("This chain should reject.");
				}, function(errs) {
					expect(errs).to.eql(["a", "b"]);
				});
			});

			it("first: should throw first thrown error", function() {
				return helpers.chain([function() {
					throw "a";
				}, function() {
					throw "b";
				}], {
					errors: "first"
				})().then(function() {
					expect().fail("This chain should reject.");
				}, function(err) {
					expect(err).to.be("a");
				});
			});

			it("last: should throw last thrown error", function() {
				return helpers.chain([function() {
					throw "a";
				}, function() {
					throw "b";
				}], {
					errors: "last"
				})().then(function() {
					expect().fail("This chain should reject.");
				}, function(err) {
					expect(err).to.be("b");
				});
			});

			it("[data]: should always throw given data", function() {

				var error = new Error("test");

				return helpers.chain([function() {
					throw "a";
				}, function() {
					throw "b";
				}], {
					errors: error
				})().then(function() {
					expect().fail("This chain should reject.");
				}, function(err) {
					expect(err).to.be(error);
				});
			});

			it("[function]: should pass array of errors to given function and use its return as error", function() {

				return helpers.chain([function() {
					throw "a";
				}, function() {
					throw "b";
				}], {
					errors: function(errs) {

						"use strict";

						expect(this).to.eql(null);
						errs.push("c");
						return errs;
					}
				})().then(function() {
					expect().fail("This chain should reject.");
				}, function(errs) {
					expect(errs).to.eql(["a", "b", "c"]);
				});
			});
		});

		describe(".call() result", function() {
			it("should be a Promise", function() {
				expect(helpers.chain([])()).to.be.a(Promise);
				expect(helpers.chain(new Map())()).to.be.a(Promise);
				expect(helpers.chain(new Set())()).to.be.a(Promise);
				expect(helpers.chain(function*() {
					yield 1;
					yield 2;
					yield 3;
				}())()).to.be.a(Promise);
				expect(helpers.chain([function() {}, "test"])()).to.be.a(Promise);
			});

			it("should return first successful function return", function() {

				var arr = [function() {
					throw new Error("test 1");
				}, function(a, b) {
					if(typeof a !== "string")
						throw new Error(typeof a + " nope.");
					return a.toUpperCase() + b;
				}, function(a, b) {
					if(typeof a !== "number")
						throw new Error(typeof a + " nope.");
					return a * Math.PI + b;
				}, function(a) {
					return a;
				}];

				return Promise.all([
					helpers.chain([function() {
						return 1;
					}, function() {
						return 2;
					}])().then(function(result) {
						expect(result).to.be(1);
					}, function() {
						expect().fail("chain should be successful.");
					}),
					helpers.chain(arr)("test", "ING").then(function(result) {
						expect(result).to.be("TESTING");
					}),
					helpers.chain(arr)(1, 1).then(function(result) {
						expect(result).to.be(Math.PI + 1);
					}),
					helpers.chain(arr)(arr).then(function(result) {
						expect(result).to.be(arr);
					})
				]);
			});

			it("should reject if no function was given", function() {
				return helpers.chain([])().then(function() {
					expect().fail("Empty chains should reject.");
				}, function(errs) {
					expect(errs).to.be.an("array");
					expect(errs.length).to.be(1);
				});
			});

			it("should ignore undefined chain entries", function() {
				return helpers.chain([
					undefined,
					function() {
						throw "a";
					},
					undefined,
					undefined,
					function() {
						throw "b";
					},
					undefined
				])().then(function() {
					expect().fail("This chain should reject.");
				}, function(errs) {
					expect(errs).to.be.an("array");
					expect(errs).to.eql(["a", "b"]);
				});
			});

			it("should pass given this to all functions", function() {
				var f = helpers.chain([function(a) {
						if(a)
							throw new Error("test");
						return this;
					}, function() {
						return {
							object: this
						};
					}]),
					o = {};
				return Promise.all([
					f.call(o).then(function(result) {
						expect(result).to.be(o);
					}),
					f.call(o, true).then(function(result) {
						expect(result.object).to.be(o);
					})
				]);
			});

			it("should reject if all functions threw", function() {
				var err1 = new Error("test 1"),
					err2 = new Error("test 2");
				return Promise.all([
					helpers.chain([function() {
						throw err1;
					}])().then(function() {
						expect().fail("This chain should reject.");
					}, function(errs) {
						expect(errs).to.be.an("array");
						expect(errs[0]).to.be(err1);
					}),
					helpers.chain([function() {
						throw err1;
					}, function() {
						throw err2;
					}, function() {
						throw err1;
					}])().then(function() {
						expect().fail("This chain should reject.");
					}, function(errs) {
						expect(errs).to.eql([err1, err2, err1]);
					})
				]);
			});
		});
	});

	describe("object mode", function() {
		it("should return an object with a function for each input key", function() {

			var res = helpers.chain([{
				foo: "bar",
				baz: true
			}]);

			expect(res).to.be.an("object");
			expect(Object.keys(res)).to.eql(["foo", "baz"]);
			expect(res.foo).to.be.a("function");
			expect(res.baz).to.be.a("function");
		});

		describe("[key].call() results", function() {

			it("should return chained function for each key", function() {
				var res = helpers.chain([{
					a: function a1() {
						throw new Error("test");
					},
					b: function b1() {
						throw new Error("test2");
					}
				}, {
					a: function a2() {
						return this;
					},
					b: function b2() {
						return {
							o: this
						};
					}
				}]);

				return Promise.all([
					res.a().then(function(result) {
						expect(result).to.eql(res);
					}),
					res.b.call("Hello World").then(function(result) {
						expect(result).to.eql({
							o: "Hello World"
						});
					})
				]);
			});

		});
	});

});
