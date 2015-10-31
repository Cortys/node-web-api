"use strict";

const gulp = require("gulp");
const istanbul = require("gulp-istanbul");
const mocha = require("gulp-mocha");
const eslint = require("gulp-eslint");
const runSequence = require("run-sequence");

gulp.task("eslint", () => {
	return gulp.src(["src/**/*.js", "test/**/*.test.js"])
		.pipe(eslint())
		.pipe(eslint.format())
		.pipe(eslint.failOnError());
});

gulp.task("mocha", ["cover"], callback => {
	gulp.src(["src/**/*.js"])
		.pipe(istanbul())
		.on("error", callback)
		.pipe(istanbul.hookRequire())
		.on("finish", () => {
			gulp.src(["test/*.test.js"])
				.pipe(mocha())
				.on("error", callback)
				.pipe(istanbul.writeReports())
				.pipe(istanbul.enforceThresholds({
					thresholds: {
						global: 90
					}
				}))
				.on("end", callback);
		});
});

gulp.task("test", callback => {
	runSequence("mocha", "eslint", callback);
});

gulp.task("watch", () => {
	gulp.watch(["src/**", "test/**"], ["test"]);
});

gulp.task("default", ["watch", "test"]);
