var checkCSS = require( '../index' ),
    gutil = require( 'gulp-util' ),
    assert = require( 'assert' ),
    fs = require( 'fs' ),
    sinon = require( 'sinon' ),
    css = fs.readFileSync( 'test/test.css', 'utf8' ),
    stream,
    bufferedCSS;

beforeEach( function() {
    bufferedCSS = new gutil.File({
        path: 'test/test.css',
        contents: new Buffer( css, 'utf8' )
    });
});

afterEach( function() {
    bufferedCSS = null;
});

it( 'should throw an error in bad case', function( done ) {
    var dataSpy = sinon.spy(),
        stream = checkCSS({
            files: 'test/b*.html'
        });

    stream.on( 'data', dataSpy );
    stream.on( 'error', function( err ) {
        // check correct class
        assert.equal( err.unused.length, 1 );
        assert.equal( err.unused[ 0 ], 'special' );
        // check that no file was emitted
        assert.equal( dataSpy.called, false );

        done();
    });

    stream.write( bufferedCSS );
    stream.end();
});

it( 'should end the stream in bad case if end flag is true', function( done ) {
    var stream = checkCSS({
            end: true,
            files: 'test/b*.html'
        });

    stream.on( 'end', done );

    stream.write( bufferedCSS );
});

it( 'should emit the file in happy case', function( done ) {
    var errorSpy = sinon.spy(),
        stream = checkCSS({
            files: 'test/h*.html'
        });

    stream.on( 'error', errorSpy );

    stream.on( 'data', function( buffered ) {
        // check that file is the same
        assert.equal( String( buffered.contents ), css );
        // check that no error was thrown
        assert.equal( errorSpy.called, false );

        done();
    });

    stream.write( bufferedCSS );
    stream.end();
});

it( 'should ignore class patterns', function( done ) {
    var errorSpy = sinon.spy(),
        pattern = /spe*/gi,
        stream = checkCSS({
            files: 'test/b*.html',
            ignoreClassPatterns: [ pattern, /unmatched/ ]
        });

    stream.on( 'error', errorSpy );

    stream.on( 'data', function() {
        assert.equal( errorSpy.called, false );
        done();
    });

    stream.write( bufferedCSS );
    stream.end();
});

it( 'should ignore class names', function( done ) {
    var errorSpy = sinon.spy(),
        stream = checkCSS({
            files: 'test/b*.html',
            ignoreClassNames: [ 'special', 'other' ]
        });

    stream.on( 'error', errorSpy );

    stream.on( 'data', function() {
        assert.equal( errorSpy.called, false );
        done();
    });

    stream.write( bufferedCSS );
    stream.end();
});

it( 'should throw an error if there is no config', function( done ) {
    try {
        stream = checkCSS();
    } catch( ex ) {
        assert.equal( ex.message, 'No HTML files specified' );
        done();
    }
});

it( 'should throw an error if there are no HTML files specified', function( done ) {
    try {
        stream = checkCSS({ whatever: 'yeah' });
    } catch( ex ) {
        assert.equal( ex.message, 'No HTML files specified' );
        done();
    }
});

it( 'should let null files through', function( done ) {
    var errorSpy = sinon.spy(),
        stream = checkCSS({
            files: 'test/b*.html'
        });

    stream.on( 'error', errorSpy );
    stream.on( 'data', function() {
        assert.equal( errorSpy.called, false );
        done();
    });
    stream.write( new gutil.File({
        path: 'null',
        contents: null
    }));

    stream.end();
});