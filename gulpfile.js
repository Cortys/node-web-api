"use strict";

const gulp = require("gulp");
const mocha = require("gulp-mocha");
const eslint = require("gulp-eslint");
const runSequence = require("run-sequence");

gulp.task("eslint", () => {
	return gulp.src(["src/**/*.js", "test/**/*.test.js"])
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failOnError());
});

gulp.task("mocha", () => {
	return gulp.src(["test/*.test.js"]).pipe(mocha());
});

gulp.task("test", callback => {
	runSequence("mocha", "eslint", callback);
});

gulp.task("watch", () => {
	gulp.watch(["src/**", "test/**"], ["test"]);
});

gulp.task("default", ["watch", "test"]);
