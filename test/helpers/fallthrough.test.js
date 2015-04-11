var expect = require("expect.js");

var owe = require("../../src"),
	helpers = require("../../src/helpers");

describe(".chain", function() {
	it("should return a function", function() {
		expect(helpers.chain(undefined)).to.be.a("function");
		expect(helpers.chain(null)).to.be.a("function");
		expect(helpers.chain(function() {})).to.be.a("function");
		expect(helpers.chain([])).to.be.a("function");
		expect(helpers.chain([function() {}, "test"])).to.be.a("function");
	});

	it("should throw for non-function, non-array, not-null values", function() {
		expect(helpers.chain).withArgs(true).to.throwError();
		expect(helpers.chain).withArgs(1).to.throwError();
		expect(helpers.chain).withArgs({}).to.throwError();
		expect(helpers.chain).withArgs("test").to.throwError();
		expect(helpers.chain).withArgs(Symbol()).to.throwError();
	});

	describe(".call() result", function() {
		it("should be a Promise", function() {
			expect(helpers.chain(undefined)()).to.be.a(Promise);
			expect(helpers.chain(null)()).to.be.a(Promise);
			expect(helpers.chain(function() {})()).to.be.a(Promise);
			expect(helpers.chain([])()).to.be.a(Promise);
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
					expect.fail("chain should be successfull.");
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
			return helpers.chain()().then(function() {
				expect.fail("Empty chains should reject.");
			}, function(errs) {
				expect(errs).to.be.an("array");
				expect(errs.length).to.be(1);
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
				helpers.chain(function() {
					throw err1;
				})().then(function() {
					expect.fail("This chain should reject.");
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
					expect.fail("This chain should reject.");
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
