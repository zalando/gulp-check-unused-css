var gulp = require( 'gulp' ),
    checkCSS = require( './index' );

gulp.task( 'check', function() {
    gulp
        .src( 'test/test.css' )
        .pipe( checkCSS({
            files: 'test/b*.html'
        }))
        .on( 'error', function( err ) {
            console.log( 'unused classes:', err.unused.join( ' ') );
        });
});