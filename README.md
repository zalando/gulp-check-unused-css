# gulp-check-unused-css

Check if all your defined CSS classes are used in your templates.

## Usage
    
    var checkCSS = require( 'gulp-check-unused-css' );
    gulp
        .src( 'allmy.css' )
        .pipe( checkCSS({
            files: 'templates/*.html'
        }))
        .on( 'error', function( err ) {
            // unnecessary since gulp-check-unused-css logs by default
            console.log( 'Unused classes:', err.unused );
        });

If there are no unused classes it will just output your CSS file for later usage, e.g. minifying.

In case you don't want an error event, but instead the stream to end, use the ``end`` flag. This is especially useful when used together with ``gulp-watch`` since an error will trip it up. It will not fail, but also stop working correctly.

    watch({ glob: 'allmy.css' })
        .pipe( checkCSS({
            end: true,
            files: 'templates/*.html'
        }))
        .pipe( whatever )
        .pipe( gulp.dest(... ) );


## Development

    git clone gulp-check-unused-css
    cd gulp-check-unused-css
    npm install
    # hack hack hack
    npm test