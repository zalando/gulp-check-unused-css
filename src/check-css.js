; // jshint ignore:line
/**
 *  Copyright 2014 Zalando SE
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
**/

var gutil = require( 'gulp-util' ),     // for gulp plugin error
    through = require( 'through2' ),    // stream library
    css = require( 'css' ),             // css parser
    fs = require( 'fs' ),               // file system access
    glob = require( 'glob' ),           // to read globs like src/main/webapp/**/*.html
    Q = require( 'q' ),                 // promise implementation
    html = require( 'htmlparser2' ),    // html parser,
    _ = require( 'lodash' ),            // lodash for utilities

    Regular = require( './collector/regular' ),
    regularClass = new Regular(),

    Angular = require( './collector/angular' ),
    angularClass = new Angular(),

    PLUGIN_NAME = 'gulp-check-unused-css';

var definedClasses = [],
    globals = [],
    usedClasses = [],
    CLASS_REGEX = /\.[a-zA-Z](?:[0-9A-Za-z_-])+/g;  // leading dot followed by a letter followed by digits, letters, _ or -

// checks whether a class should be ignored
function shouldIgnore( clazz ) {
    return function( ignoreRule ) {
        // we ignore it if an ignore regex matches
        if ( _.isRegExp( ignoreRule ) ) {
            return ignoreRule.test( clazz );
        }
        // we ignore it if an ignore string is equal
        if ( _.isString( ignoreRule ) ) {
            return ignoreRule === clazz;
        }
        return true;
    };
}

// checks if the selectors of a CSS rule are a class
// an adds them to the defined classes
function getClasses( rule, idx ) {
    if ( rule.type !== 'rule' ) {
        return;
    }
    
    if ( !rule.selectors ) {
        return;
    }

    rule.selectors.forEach( function( selector ) {
        var matches = selector.match( CLASS_REGEX );
        if ( !matches ) {
            return;
        }

        _.each( matches, function( match ) {
            if ( _.indexOf( definedClasses, match ) === -1 ) {
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
            var all = [];
            
            all.push.apply( all, regularClass.collect( attribs ) );
            if ( opts.angular !== false ) {
                all.push.apply( all, angularClass.collect( attribs ) );
            }

            _.each( all, function( usedClass ) {
                if ( _.indexOf( usedClasses, usedClass ) === -1 ) {
                    usedClasses.push( usedClass );
                }
            });
        }
    });

    var files,
        ignore = opts.ignore || false,
        filesRead = Q.defer();  // resolves when all files are read by glob

    if ( opts.globals ) {
        opts.globals.forEach( function( global ) {
            globals.push.apply( globals, require( './global/' + global ) );
        });
        globals = _.sortBy( globals );
    }

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
    }

    return through.obj( function( file, enc, done ) {
        var self = this;

        if ( file.isNull() ) {
            self.push( file );
            return done();
        }

        if ( file.isStream()) {
            return done( new gutil.PluginError( PLUGIN_NAME, 'Streaming not supported' ) );
        }

        filesRead.promise.then( function() {
            // parse css content
            var ast,
                unused = [];

            try {
                ast = css.parse( String( file.contents ), { silent: false } );
            } catch( cssError ) {
                if ( opts.end ) {
                    return done();
                } else {
                    return done( cssError );
                }
            }

            definedClasses = [];

            // find all classes in CSS
            if ( ast.stylesheet ) {
                ast.stylesheet.rules.forEach( getClasses );
                usedClasses = _.sortBy( usedClasses );
            }

            

            unused =   _.chain( definedClasses )
                        .map(function( classdef ) {
                            return classdef.substring( 1 );
                        })
                        .filter( function( definedClass ) {
                            var ignoreThis = false,
                                isUsed = _.indexOf( usedClasses, definedClass, true ) === -1,
                                isGlobal = globals.length ? _.indexOf( globals, definedClass, true ) >= 0 : false;

                            // check if we should ignore this class
                            if ( ignore ) {
                                ignoreThis = _.some( ignore, shouldIgnore( definedClass ) );
                            }
                            return ignoreThis ?
                                        false :
                                        isUsed && !isGlobal;
                        })
                        .value();

            // throw an error if there are unused defined classes
            if ( definedClasses.length > 0 && unused.length > 0 ) {
                var classString = unused.join( ' ' );
                gutil.log.apply( gutil, [ gutil.colors.cyan( 'Unused CSS classes' ), gutil.colors.red( file.path ), classString ] );

                if ( opts.end ) {
                    self.emit( 'end' );
                    return done();
                } else {
                    var error = new Error( 'Unused CSS Classes: ' + classString );
                    error.unused = unused;
                    return done( new gutil.PluginError( PLUGIN_NAME, error ) );
                }
            }

            // else proceed
            // gutil.log.apply( gutil, [ gutil.colors.cyan( 'File okay' ), file.path ]);
            self.push( file );
            done();
        });
    });
}

module.exports = checkCSS;
