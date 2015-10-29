"use strict";

const expect = require("expect.js");

const owe = require("../src");

describe(".chain", () => {
	it("should throw for non iterable values", () => {
		expect(owe.chain).withArgs(true).to.throwError();
		expect(owe.chain).withArgs(1).to.throwError();
		expect(owe.chain).withArgs({}).to.throwError();
		expect(owe.chain).withArgs("test").to.throwError();
		expect(owe.chain).withArgs(Symbol()).to.throwError();
		expect(owe.chain).withArgs(() => undefined).to.throwError();
	});

	describe("function mode", () => {
		it("should return a function", () => {
			expect(owe.chain(new Set())).to.be.a("function");
			expect(owe.chain([])).to.be.a("function");
			expect(owe.chain(new Map())).to.be.a("function");
			expect(owe.chain(function*() {
				yield 1;
				yield 2;
				yield 3;
			}())).to.be.a("function");
		});

		describe("errors option", () => {
			it("all: should throw all errors as array of errors", () => {
				return owe.chain([() => {
					throw "a";
				}, () => {
					throw "b";
				}], {
					errors: "all"
				})().then(() => {
					expect().fail("This chain should reject.");
				}, errs => {
					expect(errs).to.eql(["a", "b"]);
				});
			});

			it("first: should throw first thrown error", () => {
				return owe.chain([() => {
					throw "a";
				}, () => {
					throw "b";
				}], {
					errors: "first"
				})().then(() => {
					expect().fail("This chain should reject.");
				}, err => {
					expect(err).to.be("a");
				});
			});

			it("last: should throw last thrown error", () => {
				return owe.chain([() => {
					throw "a";
				}, () => {
					throw "b";
				}], {
					errors: "last"
				})().then(() => {
					expect().fail("This chain should reject.");
				}, err => {
					expect(err).to.be("b");
				});
			});

			it("[data]: should always throw given data", () => {
				const error = new Error("test");

				return owe.chain([() => {
					throw "a";
				}, () => {
					throw "b";
				}], {
					errors: error
				})().then(() => {
					expect().fail("This chain should reject.");
				}, err => {
					expect(err).to.be(error);
				});
			});

			it("[function]: should pass array of errors to given function and use its return as error", () => {
				return owe.chain([() => {
					throw "a";
				}, () => {
					throw "b";
				}], {
					errors(errs) {
						expect(this).to.eql(null);
						errs.push("c");

						return errs;
					}
				})().then(() => {
					expect().fail("This chain should reject.");
				}, errs => {
					expect(errs).to.eql(["a", "b", "c"]);
				});
			});
		});

		describe("removeNonErrors option", () => {
			it("errors = all: should remove all empty errors from the output errors",
				() => owe.chain([() => {
					throw "a";
				}, () => {
					throw undefined;
				}, () => {
					throw "b";
				}], {
					errors: "all",
					removeNonErrors: true
				})().then(() => {
					expect().fail("This chain should reject.");
				}, errs => {
					expect(errs).to.eql(["a", "b"]);
				}));

			it("errors = first: should return the first not-null error",
				() => owe.chain([() => {
					throw undefined;
				}, () => {
					throw "a";
				}, () => {
					throw "b";
				}], {
					errors: "first",
					removeNonErrors: true
				})().then(() => {
					expect().fail("This chain should reject.");
				}, errs => {
					expect(errs).to.be("a");
				}));

			it("errors = last: should return the last not-null error",
				() => owe.chain([() => {
					throw "a";
				}, () => {
					throw undefined;
				}, () => {
					throw "b";
				}], {
					errors: "last",
					removeNonErrors: true
				})().then(() => {
					expect().fail("This chain should reject.");
				}, errs => {
					expect(errs).to.be("b");
				}));

			it("errors = [function]: should remove all empty errors from the errors that go into the function",
				() => owe.chain([() => {
					throw "a";
				}, () => {
					throw "b";
				}, () => {
					throw undefined;
				}], {
					errors(errs) {
						return errs;
					},
					removeNonErrors: true
				})().then(() => {
					expect().fail("This chain should reject.");
				}, errs => {
					expect(errs).to.eql(["a", "b"]);
				}));
		});

		describe(".call() result", () => {
			it("should be a Promise", () => {
				expect(owe.chain([])()).to.be.a(Promise);
				expect(owe.chain(new Map())()).to.be.a(Promise);
				expect(owe.chain(new Set())()).to.be.a(Promise);
				expect(owe.chain(function*() {
					yield 1;
					yield 2;
					yield 3;
				}())()).to.be.a(Promise);
				expect(owe.chain([() => undefined, "test"])()).to.be.a(Promise);
			});

			it("should return first successful function return", () => {
				const arr = [() => {
					throw new Error("test 1");
				}, function(a, b) {
					if(typeof a !== "string")
						throw new Error(`${typeof a} nope.`);

					return a.toUpperCase() + b;
				}, function(a, b) {
					if(typeof a !== "number")
						throw new Error(`${typeof a} nope.`);

					return a * Math.PI + b;
				}, function(a) {
					return a;
				}];

				return Promise.all([
					owe.chain([() => 1, () => 2])().then(result => {
						expect(result).to.be(1);
					}, () => {
						expect().fail("chain should be successful.");
					}),
					owe.chain(arr)("test", "ING").then(result => {
						expect(result).to.be("TESTING");
					}),
					owe.chain(arr)(1, 1).then(result => {
						expect(result).to.be(Math.PI + 1);
					}),
					owe.chain(arr)(arr).then(result => {
						expect(result).to.be(arr);
					})
				]);
			});

			it("should reject if no function was given",
				() => owe.chain([])().then(() => {
					expect().fail("Empty chains should reject.");
				}, err => {
					expect(err).to.be.an(Error);
				}));

			it("should ignore undefined chain entries",
				() => owe.chain([
					undefined,
					() => {
						throw "a";
					},
					undefined,
					undefined,
					() => {
						throw "b";
					},
					undefined
				])().then(() => {
					expect().fail("This chain should reject.");
				}, err => {
					expect(err).to.eql("b");
				}));

			it("should pass given this to all functions", () => {
				const f = owe.chain([function(a) {
					if(a)
						throw new Error("test");

					return this;
				}, function() {
					return {
						object: this
					};
				}]);
				const o = {};

				return Promise.all([
					f.call(o).then(result => {
						expect(result).to.be(o);
					}),
					f.call(o, true).then(result => {
						expect(result.object).to.be(o);
					})
				]);
			});

			it("should reject if all functions threw", () => {
				const err1 = new Error("test 1");
				const err2 = new Error("test 2");

				return Promise.all([
					owe.chain([() => {
						throw err1;
					}])().then(() => {
						expect().fail("This chain should reject.");
					}, err => {
						expect(err).to.be(err1);
					}),
					owe.chain([() => {
						throw err1;
					}, () => {
						throw err1;
					}, () => {
						throw err2;
					}])().then(() => {
						expect().fail("This chain should reject.");
					}, err => {
						expect(err).to.eql(err2);
					})
				]);
			});
		});
	});

	describe("object mode", () => {
		it("should return an object with a function for each input key", () => {
			const res = owe.chain([{
				foo: "bar",
				baz: true
			}]);

			expect(res).to.be.an("object");
			expect(Object.keys(res)).to.eql(["foo", "baz"]);
			expect(res.foo).to.be.a("function");
			expect(res.baz).to.be.a("function");
		});

		describe("[key].call() results", () => {
			it("should return chained function for each key", () => {
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
					res.a().then(result => {
						expect(result).to.eql(res);
					}),
					res.b.call("Hello World").then(result => {
						expect(result).to.eql({
							o: "Hello World"
						});
					})
				]);
			});
		});
	});
});
