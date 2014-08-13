'use strict';

var gutil = require( 'gulp-util' ),
    through = require( 'through2' ),
    css = require( 'css' ),
    fs = require( 'fs' ),
    glob = require( 'glob' ),
    Q = require( 'q' ),
    html = require( 'htmlparser2' ),

    PLUGIN_NAME = 'gulp-check-unused-css';

var definedClasses = [],
    usedClasses = [],
    CLASS_REGEX = /\.[a-zA-Z](?:[0-9A-Za-z_-])+/g;

function isClass( def ) {
    return CLASS_REGEX.test( def );
}

function getClasses( rule ) {
    if ( !rule.type === 'rule ' ) {
        return;
    }
    rule.selectors.forEach( function( selector ) {
        var matches = selector.match( CLASS_REGEX );
        if ( !matches ) {
            return;
        }
        matches.forEach( function( match ) {
            if ( definedClasses.indexOf( match ) === -1 ) {
                console.log( 'found class in css', match );
                definedClasses.push( match );
            }
        });
    });
}

function writeFileInStream( stream ) {
    return function( e, file ) {
        if ( e ) return;

        stream.write( file );
    };
}

function checkCSS( opts ) {
    definedClasses.splice();
    usedClasses.splice();

    var htmlparser = new html.Parser({
        onopentag: function onopentag( name, attribs ) {
            if ( attribs['class'] ) {
                var used = attribs['class'].split( ' ' );
                used.forEach( function( usedClass ) {
                    console.log( 'found class in template:', usedClass );
                    if ( usedClasses.indexOf( usedClass ) === -1 ) {
                        usedClasses.push( usedClass );
                    }
                });
            }
        }
    });

    var files,
        filesRead = Q.defer();
    if ( opts.files ) {
        glob( opts.files, null, function( err, globFiles ) {

            globFiles.forEach( function( filename ) {
                var file = fs.readFileSync( filename, 'utf-8' );
                htmlparser.write( file );
            });
            filesRead.resolve();
        });
    }

    return through.obj( function( file, enc, cb ) {
        if ( file.isNull() ) {
            return cb();
        }

        if ( file.isStream()) {
            this.emit( 'error', new gutil.PluginError( PLUGIN_NAME, 'Streaming not supported' ) );
            return cb();
        }

        filesRead.promise.then( function() {
            var ast = css.parse( file );
            // find all classes
            ast.stylesheet.rules.forEach( getClasses );
            // remove leading dot because that's not in the html
            definedClasses = definedClasses.map( function( classdef ) {
                return classdef.substring( 1 );
            });

            var allUsed = definedClasses.every( function( definedClass ) {
                return usedClasses.indexOf( definedClass ) >= 0;
            });

            console.log( allUsed );

            cb();
        });
    });
}

module.exports = checkCSS;