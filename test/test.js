/*jslint node: true */

var checkCSS =  require( '../src/check-css' ),
    gutil =     require( 'gulp-util' ),
    assert =    require( 'assert' ),
    path =      require( 'path' ),
    fs =        require( 'fs' ),
    sinon =     require( 'sinon' );

function createFile( file ) {
    'use strict';
    return  new gutil.File({
                base: path.join( __dirname, path.dirname( file ) ),
                contents: new Buffer( fs.readFileSync( file ) ),
                cwd: __dirname,
                path: file,
                filename: path.basename( file )
            });
}

describe( 'the bad CSS case', function() {
    'use strict';
    it( 'should throw an error by default', function( done ) {
        var dataSpy = sinon.spy(),
            css = createFile( 'test/bad-css/bad.css' ),
            html= createFile( 'test/bad-css/bad.html' ),
            stream = checkCSS();

        stream.on( 'data', dataSpy );
        stream.on( 'error', function( err ) {
            // check correct class
            assert.equal( err.css.length, 1 );
            assert.equal( err.css[ 0 ], 'row' );

            done();
        });

        stream.write( css );
        stream.write( html);
        stream.end();
    });
});


describe( 'the empty case', function() {
    'use strict';
    it( 'should not emit an error', function( done ) {
        var errorSpy = sinon.spy(),
            emptyCSS = createFile( 'test/empty/empty.css' ),
            emptyHTML= createFile( 'test/empty/empty.html' ),
            stream = checkCSS();

        stream.on( 'error', errorSpy );
        stream.on( 'finish', function() {
            assert.equal( errorSpy.called, false );
            done();
        });

        stream.write( emptyHTML );
        stream.write( emptyCSS );
        stream.end();
    });
});

describe( 'the happy case', function() {
    'use strict';
    it( 'should emit all files', function( done ) {
        var errorSpy = sinon.spy(),
            css = createFile( 'test/happy/happy.css' ),
            html= createFile( 'test/happy/happy.html' ),
            stream = checkCSS();

        stream.on( 'error', errorSpy );

        var bufferedContent = [];
        stream.on( 'data', function( buffered ) {
            bufferedContent.push( String( buffered.contents ) );
        });
        stream.on( 'finish', function() {
            // check that file is the same
            assert.equal( bufferedContent.length, 2 );
            assert.equal( bufferedContent[0], String( html.contents ) );
            assert.equal( bufferedContent[1], String( css.contents ) );
            // check that no error was thrown
            assert.equal( errorSpy.called, false );

            done();
        });

        stream.write( html );
        stream.write( css );
        stream.end();
    });

    it( 'should ignore class patterns', function( done ) {
        var errorSpy = sinon.spy(),
            dataSpy = sinon.spy(),
            pattern = /row/gi,
            css = createFile( 'test/bad-css/bad.css' ),
            html= createFile( 'test/bad-css/bad.html' ),
            stream = checkCSS({
                ignore: [ pattern ]
            });

        stream.on( 'error', errorSpy );
        stream.on( 'data', dataSpy );
        stream.on( 'finish', function() {
            assert.equal( dataSpy.called, true );
            assert.equal( errorSpy.called, false );
            done();
        });

        stream.write( css );
        stream.write( html );
        stream.end();
    });

    it( 'should ignore class names', function( done ) {
        var errorSpy = sinon.spy(),
            dataSpy = sinon.spy(),
            css = createFile( 'test/bad-css/bad.css' ),
            html= createFile( 'test/bad-css/bad.html' ),
            stream = checkCSS({
                ignore: [ 'row' ]
            });

        stream.on( 'error', errorSpy );
        stream.on( 'data', dataSpy );

        stream.on( 'finish', function() {
            assert.equal( dataSpy.called, true );
            assert.equal( errorSpy.called, false );
            done();
        });

        stream.write( html );
        stream.write( css );
        stream.end();
    });

    it( 'should not break if there are media queries present', function( done ) {
        var errorSpy = sinon.spy(),
            dataSpy = sinon.spy(),
            css = createFile( 'test/mediaquery/mediaquery.css' ),
            html= createFile( 'test/mediaquery/mediaquery.html' ),
            stream = checkCSS();

        stream.on( 'error', errorSpy );
        stream.on( 'data', dataSpy );
        stream.on( 'finish', function() {
            assert.equal( errorSpy.called, false );
            assert.equal( dataSpy.called, true );
            done();
        });

        stream.write( html );
        stream.write( css );
        stream.end();
    });
});

describe( 'no error should be thrown', function() {
    /* jshint ignore:start */
    it( 'without config', function( done ) {
        try {
            stream = checkCSS();
            done();
        } catch(e) {}
    });

    it( 'with invalid CSS', function( done ) {
        var dataSpy = sinon.spy(),
            errorSpy = sinon.spy(),
            invalidCSS = createFile( 'test/invalid/invalid.css' ),
            stream = checkCSS({
                end: true,
            });


        stream.on( 'data', dataSpy );
        stream.on( 'error', errorSpy );
        stream.on( 'end', function() {
            assert.equal( errorSpy.called, false );
            assert.equal( dataSpy.called, true );
            done();
        });

        stream.write( invalidCSS );
        stream.end();
    });
    /* jshint ignore:end */
});

describe( 'the NULL case', function() {
    'use strict';
    it( 'should let files through', function( done ) {
        var errorSpy = sinon.spy(),
            stream = checkCSS();

        stream.on( 'error', errorSpy );
        stream.on( 'finish', function() {
            assert.equal( errorSpy.called, false );
            done();
        });
        stream.write( new gutil.File({
            path: 'null',
            contents: null
        }));

        stream.end();
    });

});

describe( 'the angular syntax', function() {
    'use strict';
    it( 'should be off by default', function( done ) {
        var errorSpy = sinon.spy(),
            dataSpy = sinon.spy(),
            html= createFile( 'test/angular/angular.html' ),
            css = createFile( 'test/angular/angular.css' ),
            stream = checkCSS();

        stream.on( 'finish', function() {
            assert.equal( errorSpy.called, true );
            assert.equal( dataSpy.called, true );
            done();
        });
        stream.on( 'error', errorSpy );
        stream.on( 'data', dataSpy );
        
        stream.write( html );
        stream.write( css );
        stream.end();
    });

    it ( 'should be activateable', function( done ) {
        var errorSpy = sinon.spy(),
            dataSpy = sinon.spy(),
            html= createFile( 'test/angular/angular.html' ),
            css = createFile( 'test/angular/angular.css' ),
            stream = checkCSS({
                angular: true
            });

        stream.on( 'error', errorSpy );
        stream.on( 'data', dataSpy );
        stream.on( 'finish', function() {
            assert.equal( dataSpy.called, true );
            assert.equal( errorSpy.called, false );
            done();
        });

        stream.write( html );
        stream.write( css );
        stream.end();
    });
});

describe( 'predefined ignore rules', function() {
    'use strict';
    it( 'should be addable', function( done ) {

        var errorSpy = sinon.spy(),
            html = createFile( 'test/own-global/own.html' ),
            stream = checkCSS({
                globals: [ [ 'container', 'row' ] ]
            });

        stream.on( 'error', errorSpy );
        stream.on( 'finish', function() {
            assert.equal( errorSpy.called, false );
            done();
        });

        stream.write( html );
        stream.end();
    });

    it( 'should work with bootstrap@3.2.0', function( done ) {

        var errorSpy = sinon.spy(),
            dataSpy = sinon.spy(),
            html= createFile( 'test/bootstrap/bootstrap.html' ),
            css = createFile( 'test/bootstrap/bootstrap.css' ),
            stream = checkCSS({
                globals: [ 'bootstrap@3.2.0' ]
            });

        stream.on( 'error', errorSpy );
        stream.on( 'data', dataSpy );
        stream.on( 'finish', function() {
            assert.equal( dataSpy.called, true );
            assert.equal( errorSpy.called, false );
            done();
        });

        stream.write( html );
        stream.write( css );
        stream.end();

    });
});

describe( 'the bad HTML case', function() {
    'use strict';
    it( 'should throw an error', function( done ) {
        var errorSpy = sinon.spy(),
            dataSpy = sinon.spy(),
            html= createFile( 'test/bad-html/bad.html' ),
            css = createFile( 'test/bad-html/bad.css' ),
            stream = checkCSS({
            });

        stream.on( 'error', errorSpy );
        stream.on( 'data', dataSpy );
        stream.on( 'finish', function() {
            assert.equal( errorSpy.called, true );
            assert.equal( dataSpy.called, true );
            done();
        });

        stream.write( html );
        stream.write( css );
        stream.end();
    });
});
