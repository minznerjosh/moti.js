'use strict';

var gulp = require('gulp');
var babel = require('gulp-babel');
var karma = require('karma').server;
var path = require('path');
var rimraf = require('rimraf');

gulp.task('build', function() {
    rimraf.sync('dist');

    return gulp.src('src/**/*.js')
        .pipe(babel())
        .pipe(gulp.dest('dist'));
});

gulp.task('tdd', function(done) {
    karma.start({
        configFile: path.resolve(process.cwd(), './test/karma.conf.js')
    }, done);
});

gulp.task('default', ['build']);
