module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat: {
			options: {
				separator: ';'
			},
			full: {
                src: ['src/jme.js', 'src/jme.fullscreen.js', 'src/jme.track.js'],
                dest: 'demo/js/jme.full.js'
            },
            base: {
                src: ['src/jme.js'],
                dest: 'demo/js/jme.base.js'
            }
		},
		uglify: {
			options: {
				banner: ''
			},
			full: {
                src: 'demo/js/jme.full.js',
                dest: 'demo/js/jme.full.min.js'
            },
            base: {
                src: 'demo/js/jme.base.js',
                dest: 'demo/js/jme.base.min.js'
            },
            fullscreen: {
                src: 'src/jme.fullscreen.js',
                dest: 'demo/js/plugins/jme.fullscreen.min.js'
            },
            track: {
                src: 'src/jme.track.js',
                dest: 'demo/js/plugins/jme.track.min.js'
            },
            track: {
                src: 'src/jme.embed.js',
                dest: 'demo/js/plugins/jme.embed.min.js'
            }
		},
		watch: {
			files: ['src/jme.js', 'src/jme.fullscreen.js', 'src/jme.track.js'],
			tasks: 'default'
		}
	});

	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	
	grunt.registerTask('default', ['concat', 'uglify']);

};