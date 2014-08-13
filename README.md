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
            console.log( 'Unused classes:', err.unused );
        });

If there are no unused classes it will just output your CSS file for later usage, e.g. minifying.

## Development

    git clone gulp-check-unused-css
    cd gulp-check-unused-css
    npm install
    # hack hack hack
    npm test