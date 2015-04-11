var gulp = require("gulp"),
	mocha = require("gulp-mocha");

gulp.task("mocha", function() {
	return gulp.src(["test/*.test.js"]).pipe(mocha());
});

gulp.task("watch-mocha", function() {
	gulp.watch(["src/**", "test/**"], ["mocha"]);
});

gulp.task("default", ["mocha", "watch-mocha"]);
