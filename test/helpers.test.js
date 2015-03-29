var expect = require("expect.js");

var nwa = require("../src"),
	helpers = require("../src/helpers");

describe("helpers", function() {
	describe(".fallthrough", function() {
		it("should returns a function", function() {
			expect(helpers.fallthrough(undefined)).to.be.a("function");
			expect(helpers.fallthrough(null)).to.be.a("function");
			expect(helpers.fallthrough(function() {})).to.be.a("function");
			expect(helpers.fallthrough([])).to.be.a("function");
			expect(helpers.fallthrough([function() {}, "test"])).to.be.a("function");
		});

		it("should throw for non-function, non-array, not-null values", function() {
			expect(helpers.fallthrough).withArgs(true).to.throwError();
			expect(helpers.fallthrough).withArgs(1).to.throwError();
			expect(helpers.fallthrough).withArgs({}).to.throwError();
			expect(helpers.fallthrough).withArgs("test").to.throwError();
			expect(helpers.fallthrough).withArgs(Symbol()).to.throwError();
		});

		describe(".call() result", function() {
			it("should be a Promise", function() {
				expect(helpers.fallthrough(undefined)()).to.be.a(Promise);
				expect(helpers.fallthrough(null)()).to.be.a(Promise);
				expect(helpers.fallthrough(function() {})()).to.be.a(Promise);
				expect(helpers.fallthrough([])()).to.be.a(Promise);
				expect(helpers.fallthrough([function() {}, "test"])()).to.be.a(Promise);
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
					helpers.fallthrough([function() {
						return 1;
					}, function() {
						return 2;
					}])().then(function(result) {
						expect(result).to.be(1);
					}, function() {
						expect.fail("fallthrough should be successfull.");
					}),
					helpers.fallthrough(arr)("test", "ING").then(function(result) {
						expect(result).to.be("TESTING");
					}),
					helpers.fallthrough(arr)(1, 1).then(function(result) {
						expect(result).to.be(Math.PI + 1);
					}),
					helpers.fallthrough(arr)(arr).then(function(result) {
						expect(result).to.be(arr);
					})
				]);
			});

			it("should reject if no function was given", function() {
				return helpers.fallthrough()().then(function() {
					expect.fail("Empty fallthroughs should reject.");
				}, function(errs) {
					expect(errs).to.be.an("array");
					expect(errs.length).to.be(1);
				});
			});

			it("should pass given this to all functions", function() {
				var f = helpers.fallthrough([function(a) {
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
					helpers.fallthrough(function() {
						throw err1;
					})().then(function() {
						expect.fail("This fallthrough should reject.");
					}, function(errs) {
						expect(errs).to.be.an("array");
						expect(errs[0]).to.be(err1);
					}),
					helpers.fallthrough([function() {
						throw err1;
					}, function() {
						throw err2;
					}, function() {
						throw err1;
					}])().then(function() {
						expect.fail("This fallthrough should reject.");
					}, function(errs) {
						expect(errs).to.be.an("array");
						expect(errs.length).to.be(3);
						expect(errs[0]).to.be(err1);
						expect(errs[1]).to.be(err2);
						expect(errs[2]).to.be(err1);
					})
				]);
			});
		});
	});
});
