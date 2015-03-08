module.exports = function(grunt) {

	grunt.initConfig({
		nodemon: {
			dev: {
				script: "test/index.js",
				options: {
					watch: ["test", "src"],
					exec: "iojs --use_strict"
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-nodemon');
	grunt.loadNpmTasks('grunt-contrib-jasmine');

	grunt.registerTask('default', ['nodemon']);
};
