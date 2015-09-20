/* jshint mocha: true */

"use strict";

const expect = require("expect.js");

const owe = require("../src");

describe(".chain", function() {

	it("should throw for non iterable values", function() {
		expect(owe.chain).withArgs(true).to.throwError();
		expect(owe.chain).withArgs(1).to.throwError();
		expect(owe.chain).withArgs({}).to.throwError();
		expect(owe.chain).withArgs("test").to.throwError();
		expect(owe.chain).withArgs(Symbol()).to.throwError();
		expect(owe.chain).withArgs(function() {}).to.throwError();
	});

	describe("function mode", function() {

		it("should return a function", function() {
			expect(owe.chain(new Set())).to.be.a("function");
			expect(owe.chain([])).to.be.a("function");
			expect(owe.chain(new Map())).to.be.a("function");
			expect(owe.chain(function*() {
				yield 1;
				yield 2;
				yield 3;
			}())).to.be.a("function");
		});

		describe("errors option", function() {
			it("all: should throw all errors as array of errors", function() {
				return owe.chain([function() {
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
				return owe.chain([function() {
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
				return owe.chain([function() {
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

				const error = new Error("test");

				return owe.chain([function() {
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

				return owe.chain([function() {
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

		describe("removeNonErrors option", function() {
			it("errors = all: should remove all empty errors from the output errors", function() {
				return owe.chain([function() {
					throw "a";
				}, function() {
					throw undefined;
				}, function() {
					throw "b";
				}], {
					errors: "all",
					removeNonErrors: true
				})().then(function() {
					expect().fail("This chain should reject.");
				}, function(errs) {
					expect(errs).to.eql(["a", "b"]);
				});
			});

			it("errors = first: should return the first not-null error", function() {
				return owe.chain([function() {
					throw undefined;
				}, function() {
					throw "a";
				}, function() {
					throw "b";
				}], {
					errors: "first",
					removeNonErrors: true
				})().then(function() {
					expect().fail("This chain should reject.");
				}, function(errs) {
					expect(errs).to.be("a");
				});
			});

			it("errors = last: should return the last not-null error", function() {
				return owe.chain([function() {
					throw "a";
				}, function() {
					throw undefined;
				}, function() {
					throw "b";
				}], {
					errors: "last",
					removeNonErrors: true
				})().then(function() {
					expect().fail("This chain should reject.");
				}, function(errs) {
					expect(errs).to.be("b");
				});
			});

			it("errors = [function]: should remove all empty errors from the errors that go into the function", function() {
				return owe.chain([function() {
					throw "a";
				}, function() {
					throw "b";
				}, function() {
					throw undefined;
				}], {
					errors(errs) {
						return errs;
					},
					removeNonErrors: true
				})().then(function() {
					expect().fail("This chain should reject.");
				}, function(errs) {
					expect(errs).to.eql(["a", "b"]);
				});
			});
		});

		describe(".call() result", function() {
			it("should be a Promise", function() {
				expect(owe.chain([])()).to.be.a(Promise);
				expect(owe.chain(new Map())()).to.be.a(Promise);
				expect(owe.chain(new Set())()).to.be.a(Promise);
				expect(owe.chain(function*() {
					yield 1;
					yield 2;
					yield 3;
				}())()).to.be.a(Promise);
				expect(owe.chain([function() {}, "test"])()).to.be.a(Promise);
			});

			it("should return first successful function return", function() {

				const arr = [function() {
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
					owe.chain([function() {
						return 1;
					}, function() {
						return 2;
					}])().then(function(result) {
						expect(result).to.be(1);
					}, function() {
						expect().fail("chain should be successful.");
					}),
					owe.chain(arr)("test", "ING").then(function(result) {
						expect(result).to.be("TESTING");
					}),
					owe.chain(arr)(1, 1).then(function(result) {
						expect(result).to.be(Math.PI + 1);
					}),
					owe.chain(arr)(arr).then(function(result) {
						expect(result).to.be(arr);
					})
				]);
			});

			it("should reject if no function was given", function() {
				return owe.chain([])().then(function() {
					expect().fail("Empty chains should reject.");
				}, function(errs) {
					expect(errs).to.be.an("array");
					expect(errs.length).to.be(1);
				});
			});

			it("should ignore undefined chain entries", function() {
				return owe.chain([
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
				const f = owe.chain([function(a) {
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
				const err1 = new Error("test 1"),
					err2 = new Error("test 2");

				return Promise.all([
					owe.chain([function() {
						throw err1;
					}])().then(function() {
						expect().fail("This chain should reject.");
					}, function(errs) {
						expect(errs).to.be.an("array");
						expect(errs[0]).to.be(err1);
					}),
					owe.chain([function() {
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

			const res = owe.chain([{
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
				const res = owe.chain([{
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
