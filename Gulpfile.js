var gulp = require( 'gulp' ),
    cssmin = require( 'gulp-cssmin' ),
    watch = require( 'gulp-watch' ),
    jshint = require( 'gulp-jshint' ),
    checkCSS = require( './src/check-css' );

gulp.task( 'check', function() {
    return gulp
        .src( 'test/bad-css/bad.css' )
        .pipe( checkCSS({
            files: 'test/bad-css/bad.html'
        }))
        .pipe( cssmin() )
        .pipe( gulp.dest( 'test/min' ) );
});

gulp.task( 'watch', function() {
    return watch({ glob: 'test/bad-css/bad.css' })
        .pipe( checkCSS({
            files: 'test/bad-css/bad.html'
        }))
        .pipe( cssmin() )
        .pipe( gulp.dest( 'test/min' ) );
});

gulp.task( 'jshint', function() {
    return gulp.src( './src/check-css.js' )
            .pipe( jshint() )
            .pipe( jshint.reporter( 'jshint-stylish' ) );
});