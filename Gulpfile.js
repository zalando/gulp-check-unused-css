var gulp = require( 'gulp' ),
    cssmin = require( 'gulp-cssmin' ),
    watch = require( 'gulp-watch' ),
    checkCSS = require( './index' );

gulp.task( 'check', function() {
    return gulp
        .src( 'test/test.css' )
        .pipe( checkCSS({
            files: 'test/bad.html'
        }))
        .pipe( cssmin() )
        .pipe( gulp.dest( 'test/min' ) );
});

gulp.task( 'watch', function() {
    return watch({ glob: 'test/test.css' })
        .pipe( checkCSS({
            end: true,
            files: 'test/bad.html'
        }))
        .pipe( cssmin() )
        .pipe( gulp.dest( 'test/min' ) );
});