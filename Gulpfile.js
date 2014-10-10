var gulp = require( 'gulp' ),
    cssmin = require( 'gulp-cssmin' ),
    watch = require( 'gulp-watch' ),
    checkCSS = require( './src/check-css' );

gulp.task( 'check', function() {
    return gulp
        .src( 'test/bad/bad.css' )
        .pipe( checkCSS({
            files: 'test/bad/bad.html'
        }))
        .pipe( cssmin() )
        .pipe( gulp.dest( 'test/min' ) );
});

gulp.task( 'watch', function() {
    return watch({ glob: 'test/bad/bad.css' })
        .pipe( checkCSS({
            end: true,
            files: 'test/bad/bad.html'
        }))
        .pipe( cssmin() )
        .pipe( gulp.dest( 'test/min' ) );
});