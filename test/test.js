var checkCSS =  require( '../src/check-css' ),
    gutil =     require( 'gulp-util' ),
    assert =    require( 'assert' ),
    path =      require( 'path' ),
    fs =        require( 'fs' ),
    sinon =     require( 'sinon' );

function createFile( file ) {
    return  new gutil.File({
                base: path.join( __dirname, path.dirname( file ) ),
                contents: new Buffer( fs.readFileSync( file ) ),
                cwd: __dirname,
                path: file,
                filename: path.basename( file )
            });
}

describe( 'the bad case', function() {

    it( 'should throw an error by default', function( done ) {
        var dataSpy = sinon.spy(),
            css = createFile( 'test/bad/bad.css' ),
            stream = checkCSS({
                files: 'test/bad/bad.html'
            });

        stream.on( 'data', dataSpy );
        stream.on( 'error', function( err ) {
            // check correct class
            assert.equal( err.unused.length, 1 );
            assert.equal( err.unused[ 0 ], 'row' );
            // check that no file was emitted
            assert.equal( dataSpy.called, false );

            done();
        });

        stream.write( css );
    });

    it( 'should end the stream if end flag is true', function( done ) {
        var css = createFile( 'test/bad/bad.css' ),
            stream = checkCSS({
                end: true,
                files: 'test/bad/bad.html'
            });

        stream.on( 'end', done );

        stream.write( css );
    });
});


describe( 'the empty case', function() {

    it( 'should not emit an error', function( done ) {
        var errorSpy = sinon.spy(),
            emptyCSS = createFile( 'test/empty/empty.css' ),
            stream = checkCSS({
                files: 'test/empty/empty.html'
            });

        stream.on( 'error', errorSpy );

        stream.on( 'data', function() {
            assert.equal( errorSpy.called, false );
            done();
        });

        stream.write( emptyCSS );
        stream.end();
    });
});

describe( 'the happy case', function() {

    it( 'should emit the file', function( done ) {
        var errorSpy = sinon.spy(),
            css = createFile( 'test/happy/happy.css' ),
            stream = checkCSS({
                files: 'test/happy/happy.html'
            });

        stream.on( 'error', errorSpy );

        stream.on( 'data', function( buffered ) {
            // check that file is the same
            assert.equal( String( buffered.contents ), css.contents );
            // check that no error was thrown
            assert.equal( errorSpy.called, false );

            done();
        });

        stream.write( css );
    });

    it( 'should ignore class patterns', function( done ) {
        var errorSpy = sinon.spy(),
            pattern = /row/gi,
            css = createFile( 'test/bad/bad.css' ),
            stream = checkCSS({
                files: 'test/bad/bad.html',
                ignoreClassPatterns: [ pattern ]
            });

        stream.on( 'error', errorSpy );

        stream.on( 'data', function() {
            assert.equal( errorSpy.called, false );
            done();
        });

        stream.write( css );
        stream.end();
    });

    it( 'should ignore class names', function( done ) {
        var errorSpy = sinon.spy(),
            css = createFile( 'test/bad/bad.css' ),
            stream = checkCSS({
                files: 'test/bad/bad.html',
                ignoreClassNames: [ 'row' ]
            });

        stream.on( 'error', errorSpy );

        stream.on( 'data', function() {
            assert.equal( errorSpy.called, false );
            done();
        });

        stream.write( css );
        stream.end();
    });

    it( 'should not break if there are media queries present', function( done ) {
        var errorSpy = sinon.spy(),
            dataSpy = sinon.spy(),
            css = createFile( 'test/mediaquery/mediaquery.css' ),
            stream = checkCSS({
                files: 'test/invalid/invalid.html'
            });

        stream.on( 'error', errorSpy );
        stream.on( 'data', dataSpy );
        stream.on( 'end', function() {
            assert.equal( errorSpy.called, false );
            assert.equal( dataSpy.called, true );
            done();
        });

        stream.write( css );
        stream.end();
    });

    it( 'should support angular syntax', function( done ) {
        var errorSpy = sinon.spy(),
            dataSpy = sinon.spy(),
            css = createFile( 'test/angular/angular.css' ),
            stream = checkCSS({
                files: 'test/angular/angular.html'
            });

        stream.on( 'error', errorSpy );
        stream.on( 'data', dataSpy );
        stream.on( 'end', function() {
            assert.equal( dataSpy.called, true );
            assert.equal( errorSpy.called, false );
            done();
        });
        stream.write( css );
        stream.end();
    });
});

describe( 'an error should be thrown', function() {
    it( 'without config', function( done ) {
        try {
            stream = checkCSS();
        } catch( ex ) {
            assert.equal( ex.message, 'No HTML files specified' );
            done();
        }
    });

    it( 'without HTML files specified', function( done ) {
        try {
            stream = checkCSS({ whatever: 'yeah' });
        } catch( ex ) {
            assert.equal( ex.message, 'No HTML files specified' );
            done();
        }
    });

    it( 'with invalid CSS', function( done ) {
        var dataSpy = sinon.spy(),
            invalidCSS = createFile( './test/invalid/invalid.css' ),
            stream = checkCSS({
                files: './test/invalid/invalid.html'
            });


        stream.on( 'data', dataSpy );
        stream.on( 'error', function() {
            assert.equal( dataSpy.called, false );
            done();
        });

        stream.write( invalidCSS );
    });
});

describe( 'the NULL case', function() {

    it( 'should let files through', function( done ) {
        var errorSpy = sinon.spy(),
            stream = checkCSS({
                files: 'test/bad/bad.html'
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

});

