"use strict";

const gulp = require("gulp");
const mocha = require("gulp-mocha");
const jscs = require("gulp-jscs");
const runSequence = require("run-sequence");

gulp.task("jscs", function() {
	return gulp.src(["src/*.js", "test/*.test.js"]).pipe(jscs());
});

gulp.task("mocha", function() {
	return gulp.src(["test/*.test.js"]).pipe(mocha());
});

gulp.task("test", function(callback) {
	runSequence("mocha", "jscs", callback);
});

gulp.task("watch", function() {
	gulp.watch(["src/**", "test/**"], ["test"]);
});

gulp.task("default", ["watch", "test"]);
