module.exports = function(grunt) {

	grunt.initConfig({
		nodemon: {
			dev: {
				script: "test/index.js",
				options: {
					watch: ["test", "src"]
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-nodemon');
	grunt.loadNpmTasks('grunt-contrib-jasmine');

	grunt.registerTask('default', ['nodemon']);
};
