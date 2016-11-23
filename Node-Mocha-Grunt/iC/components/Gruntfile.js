'use strict';

var _ = require('lodash');

var desireds = require('./desireds');

var gruntConfig = {
        env: {
            // dynamically filled
        },
        simplemocha: {
            sauce: {
                options: {
                    timeout: 60000,
                    reporter: 'spec'
                },
                src: [], //dynamically set
            }
        },    
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            gruntfile: {
                src: 'Gruntfile.js'
            },
            test: {
                options: {
                    jshintrc: './.jshintrc'
                },
                src: ['./**/*.js']
            },
        },
        concurrent: {
            'test-sauce': [], // dynamically filled
        },
        watch: {
            gruntfile: {
                files: '<%= jshint.gruntfile.src %>',
                tasks: ['jshint:gruntfile']
            },
            test: {
                files: '<%= jshint.test.src %>',
                tasks: ['jshint:test']
            },
        },
    };

_.forIn(desireds,function(desired, key) {
    gruntConfig.env[key] = {
        DESIRED: JSON.stringify(desired)
    };
    gruntConfig.concurrent['test-sauce'].push('test:sauce:' + key);
});

//console.log(gruntConfig);

module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig(gruntConfig);

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-env');
    grunt.loadNpmTasks('grunt-simple-mocha');
    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Default task.
    // grunt.registerTask('default', ['test:sauce:' + _(desireds).keys().first()]);
    //    _.forIn(desireds,function(desired, key) {
    //        grunt.registerTask('test:sauce:' + key, ['env:' + key, 'simplemocha:sauce']);
    //});

    grunt.registerTask('default', function() {
        //var target = grunt.option('COMPONENT') || process.env.COMPONENT;
        var target = process.env.COMPONENT; //something like 'molecules-color-selector'
        
        var bio = target.split('-');
        var element = bio[0];

        //console.log(element, " ", target);

        switch (element) {
            case "atoms":
                grunt.config.set('simplemocha.sauce.src','test/sauce/atoms/' + target + '-specs.js');
                break;
            case "molecules":
                grunt.config.set('simplemocha.sauce.src','test/sauce/molecules/' + target + '-specs.js');
                break;
            case "organisms": 
                grunt.config.set('simplemocha.sauce.src','test/sauce/organisms/' + target + '-specs.js');
                break;
            default:
                grunt.config.set('simplemocha.sauce.src','test/sauce/**/*-specs.js'); //all cases
        };

        grunt.task.run('testing');
    });

    grunt.registerTask('testing', ['test:sauce:' + _(desireds).keys().first()]);
        _.forIn(desireds,function(desired, key) {
            grunt.registerTask('test:sauce:' + key, ['env:' + key, 'simplemocha:sauce']);
    });

    grunt.registerTask('test:sauce:parallel', ['concurrent:test-sauce']);
    
};
