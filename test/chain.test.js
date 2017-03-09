"use strict";

const expect = require("./expect");

const owe = require("../src");

describe(".chain", () => {
	it("should throw for non iterable values", () => {
		expect(() => owe.chain(true)).to.throw();
		expect(() => owe.chain(1)).to.throw();
		expect(() => owe.chain({})).to.throw();
		expect(() => owe.chain("test")).to.throw();
		expect(() => owe.chain(Symbol())).to.throw();
		expect(() => owe.chain(() => {})).to.throw();
	});

	describe("function mode", () => {
		it("should return a function", () => {
			expect(owe.chain(new Set())).to.be.a("function");
			expect(owe.chain([])).to.be.a("function");
			expect(owe.chain(new Map())).to.be.a("function");
			expect(owe.chain(function* () {
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
					expect(errs).to.deep.equal(["a", "b"]);
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
					expect(err).to.equal("a");
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
					expect(err).to.equal("b");
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
					expect(err).to.equal(error);
				});
			});

			it("[function]: should pass array of errors to given function and use its return as error", () => {
				return owe.chain([() => {
					throw "a";
				}, () => {
					throw "b";
				}], {
					errors(errs) {
						expect(this).to.deep.equal(null);
						errs.push("c");

						return errs;
					}
				})().then(() => {
					expect().fail("This chain should reject.");
				}, errs => {
					expect(errs).to.deep.equal(["a", "b", "c"]);
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
					expect(errs).to.deep.equal(["a", "b"]);
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
					expect(errs).to.equal("a");
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
					expect(errs).to.equal("b");
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
					expect(errs).to.deep.equal(["a", "b"]);
				}));
		});

		describe(".call() result", () => {
			it("should be a Promise", () => {
				expect(owe.chain([])()).to.be.a("promise");
				expect(owe.chain(new Map())()).to.be.a("promise");
				expect(owe.chain(new Set())()).to.be.a("promise");
				expect(owe.chain(function* () {
					yield 1;
					yield 2;
					yield 3;
				}())()).to.be.a("promise");
				expect(owe.chain([() => {}, "test"])()).to.be.a("promise");
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
					expect(owe.chain([() => 1, () => 2])()).to.eventually.equal(1),
					expect(owe.chain(arr)("test", "ING")).to.eventually.equal("TESTING"),
					expect(owe.chain(arr)(1, 1)).to.eventually.equal(Math.PI + 1),
					expect(owe.chain(arr)(arr)).to.eventually.equal(arr)
				]);
			});

			it("should reject if no function was given",
				() => expect(owe.chain([])()).to.be.rejectedWith(Error));

			it("should ignore undefined chain entries",
				() => expect(owe.chain([
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
				])()).to.be.rejectedWith("b"));

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
					expect(f.call(o)).to.eventually.equal(o),
					expect(f.call(o, true)).to.become({
						object: o
					})
				]);
			});

			it("should reject if all functions threw", () => {
				const err1 = new Error("test 1");
				const err2 = new Error("test 2");

				return Promise.all([
					expect(owe.chain([() => {
						throw err1;
					}])()).to.be.rejectedWith(err1),
					expect(owe.chain([() => {
						throw err1;
					}, () => {
						throw err1;
					}, () => {
						throw err2;
					}])()).to.be.rejectedWith(err2)
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
			expect(Object.keys(res)).to.deep.equal(["foo", "baz"]);
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
				}, {}, {
					a: function a2() {
						return this;
					},
					b: function b2() {
						return {
							o: this
						};
					}
				}, {}]);

				return Promise.all([
					expect(res.a()).to.eventually.equal(res),
					expect(res.b.call("Hello World")).to.become({
						o: "Hello World"
					})
				]);
			});
		});
	});
});
