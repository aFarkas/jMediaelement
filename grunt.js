/*global module:false*/
module.exports = function(grunt){

    // Project configuration.
    grunt.initConfig({
        meta: {
            version: '2.0.3',
            banner: '/*! JME - v<%= meta.version %> - ' +
            '* Copyright (c) <%= grunt.template.today("yyyy") %> ' +
            'Alexander Farkas; Licensed MIT */'
        },
        lint: {
            files: ['grunt.js', 'src/**/*.js']
        },
        concat: {
            full: {
                src: ['<banner:meta.banner>', '<file_strip_banner:src/jme.js>', '<file_strip_banner:src/jme.fullscreen.js>', '<file_strip_banner:src/jme.track.js>'],
                dest: 'demo/js/jme.full.js'
            },
            base: {
                src: ['<banner:meta.banner>', '<file_strip_banner:src/jme.js>'],
                dest: 'demo/js/jme.base.js'
            }
        },
        min: {
            full: {
                src: ['<banner:meta.banner>', '<config:concat.full.dest>'],
                dest: 'demo/js/jme.full.min.js'
            },
            base: {
                src: ['<banner:meta.banner>', '<config:concat.base.dest>'],
                dest: 'demo/js/jme.base.min.js'
            },
            fullscreen: {
                src: ['<banner:meta.banner>', '<file_strip_banner:src/jme.fullscreen.js>'],
                dest: 'demo/js/plugins/jme.fullscreen.min.js'
            },
            track: {
                src: ['<banner:meta.banner>', '<file_strip_banner:src/jme.track.js>'],
                dest: 'demo/js/plugins/jme.track.min.js'
            }
        },
        watch: {
            files: '<config:lint.files>',
            tasks: 'default'
        },
        jshint: {
            options: {
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                sub: true,
                undef: true,
                boss: true,
                eqnull: true,
                browser: true
            },
            globals: {}
        },
        uglify: {}
    });
    
    // Default task.
    grunt.registerTask('default', 'concat min');
    
};
