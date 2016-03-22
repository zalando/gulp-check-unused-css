var gulp = require( 'gulp' ),
    cssmin = require( 'gulp-cssmin' ),
    watch = require( 'gulp-watch' ),
    plumber = require( 'gulp-plumber' ),
    jshint = require( 'gulp-jshint' ),
    gutil = require( 'gulp-util' ),
    argv = require('minimist')(process.argv.slice(2)),
    checkCSS = require( './src/check-css' );

function check() {
    return gulp
        .src( 'test/bad-css/*.*' )
        .pipe( argv.exit ? gutil.noop() : plumber() )
        .pipe( checkCSS() )
        .pipe( argv.exit ? gutil.noop() : plumber.stop() );
}

gulp.task( 'check', check );


gulp.task( 'watch', function() {
    return watch({ glob: 'test/bad-css/*.*' }, check );
});

gulp.task( 'jshint', function() {
    return gulp.src( ['./test/**/*.js', './src/**/*.js', '!./src/**/bootstrap*'] )
            .pipe( jshint() )
            .pipe( jshint.reporter( 'jshint-stylish' ) );
});