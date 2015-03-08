'use strict';

module.exports = function(config) {
    config.set({
        autoWatchBatchDelay: 500,
        browsers: ['Chrome'],
        files: [
            './main.js',
            './spec/**/*.ut.js'
        ],
        frameworks: ['browserify', 'mocha', 'chai', 'sinon'],
        preprocessors: {
            '**/*.js': ['browserify']
        },

        browserify: {
            debug: true,
            transform: ['babelify']
        }
    });
};
