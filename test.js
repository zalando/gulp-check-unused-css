var checkCSS = require( './index' ),
    gutil = require( 'gulp-util' ),
    fs = require( 'fs' );


var html =  fs.readFileSync( 'test.html', { encoding: 'utf-8' }),
    css =  fs.readFileSync( 'test.css', { encoding: 'utf-8' }),
    stream = checkCSS({
        'files': './*.html'
    });

stream.write(
    new gutil.File({
        path: 'test.html',
        contents: new Buffer( html, 'utf-8' )
    })
);
stream.end();