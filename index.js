;
/**
 *  Copyright 2014 Zalando SE
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
**/

'use strict';

var gutil = require( 'gulp-util' ),     // for gulp plugin error
    through = require( 'through2' ),    // stream library
    css = require( 'css' ),             // css parser
    fs = require( 'fs' ),               // file system access
    glob = require( 'glob' ),           // to read globs like src/main/webapp/**/*.html
    Q = require( 'q' ),                 // promise implementation
    html = require( 'htmlparser2' ),    // html parser

    PLUGIN_NAME = 'gulp-check-unused-css';

var definedClasses = [],
    usedClasses = [],
    CLASS_REGEX = /\.[a-zA-Z](?:[0-9A-Za-z_-])+/g;  // leading dot followed by a letter followed by digits, letters, _ or -

function isClass( def ) {
    return CLASS_REGEX.test( def );
}

// checks if the selectors of a CSS rule are a class
// an adds them to the defined classes
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
                definedClasses.push( match );
            }
        });
    });
}

// actual function that gets exported
function checkCSS( opts ) {

    if ( typeof opts === 'undefined' ) {
        opts = {};
    }

    // create html parser
    var htmlparser = new html.Parser({
        onopentag: function onopentag( name, attribs ) {
            if ( attribs[ 'class' ] ) {
                // if we find an open tag with class attribute, add those to used classes
                // this will also find classes on script tags, but whatever
                var used = attribs[ 'class' ].split( ' ' );
                used.forEach( function( usedClass ) {
                    if ( usedClasses.indexOf( usedClass ) === -1 ) {
                        usedClasses.push( usedClass );
                    }
                });
            }
        }
    });

    var files,
        ignoreClasses = opts.ignoreClassNames || false,
        ignorePatterns= opts.ignoreClassPatterns || false,
        filesRead = Q.defer();  // resolves when all files are read by glob

    if ( opts.files ) {

        glob( opts.files, null, function( err, globFiles ) {
            // put all files in html parser
            globFiles.forEach( function( filename ) {
                var file = fs.readFileSync( filename, 'utf8' );
                htmlparser.write( file );
            });

            filesRead.resolve();
        });
    } else {
        // throw an error if there are no html files configured
        throw new gutil.PluginError( PLUGIN_NAME, 'No HTML files specified' );
        return done();
    }

    return through.obj( function( file, enc, done ) {
        var self = this;

        if ( file.isNull() ) {
            self.push( file );
            return done();
        }

        if ( file.isStream()) {
            self.emit( 'error', new gutil.PluginError( PLUGIN_NAME, 'Streaming not supported' ) );
            return done();
        }


        filesRead.promise.then( function() {
            // parse css content
            var ast = css.parse( String( file.contents ) ),
                unused = [];

            definedClasses = [];
            // find all classes in CSS
            ast.stylesheet.rules.forEach( getClasses );
            
            unused = definedClasses
                        // remove leading dot because that's not in the html
                        .map( function( classdef ) {
                            return classdef.substring( 1 );
                        })
                        // filter unused
                        .filter( function( definedClass ) {
                            // check if we should ignore this class by classname
                            var shouldIgnore = false;
                            if ( ignoreClasses ) {
                                shouldIgnore = ignoreClasses
                                                    .some( function( classToIgnore ) {
                                                        return classToIgnore === definedClass;
                                                    });
                            }
                            // check if we should ignore by pattern
                            if ( ignorePatterns ) {
                                shouldIgnore = ignorePatterns
                                                    .some( function( patternToIgnore ) {
                                                        return patternToIgnore.test( definedClass );
                                                    });
                            }
                            return shouldIgnore ? false : usedClasses.indexOf( definedClass ) === -1;
                        });

            // throw an error if there are unused classes
            if ( unused.length > 0 ) {
                var classString = unused.join( ' ' );
                gutil.log.apply( gutil, [ gutil.colors.red( 'Unused CSS classes:' ), classString ] );

                if ( opts.end ) {
                    self.emit( 'end' );
                    return done();
                } else {
                    var error = new Error( 'Unused CSS Classes: ' + classString );
                    error.unused = unused;
                    self.emit( 'error', new gutil.PluginError( PLUGIN_NAME, error ) );
                    return done();
                }
            }

            // else proceed
            self.push( file );
            done();
        });
    });
}

module.exports = checkCSS;