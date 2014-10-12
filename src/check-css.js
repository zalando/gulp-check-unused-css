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
    CLASS_REGEX = /\.[a-zA-Z](?:[0-9A-Za-z_-])*/g;  // leading dot followed by a letter followed by digits, letters, _ or -

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

function filterIgnored( ignore ) {
    return function( clazz ) {
        var ignoreThis = false,
            isUsed = _.indexOf( usedClasses, clazz, true ) === -1,
            isGlobal = globals.length ? _.indexOf( globals, clazz, true ) >= 0 : false;

        // check if we should ignore this class
        if ( ignore ) {
            ignoreThis = _.some( ignore, shouldIgnore( clazz ) );
        }
        return ignoreThis ? false : !isGlobal;
    };
}

// checks if the selectors of a CSS rule are a class
// an adds them to the defined classes
function getDefinedClasses( collection ) {
    return function( rule, idx ) {
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
                if ( _.indexOf( collection, match ) === -1 ) {
                    collection.push( match.substring( 1 ) );
                }
            });
        });
    };
}

// actual function that gets exported
function checkCSS( opts ) {
    globals = [];
    usedClasses = [];

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
            var ast,
                badHTML,
                badCSS,
                error,
                usedUndefined = [], // in HTML, but not in CSS
                definedUnused = []; // in CSS, but not in HTML

            // parse css content
            try {
                ast = css.parse( String( file.contents ), { silent: false } );
            } catch( cssError ) {
                return done( cssError );
            }

            definedClasses = [];

            // find all classes in CSS
            if ( ast.stylesheet ) {
                ast.stylesheet.rules.forEach( getDefinedClasses( definedClasses ) );
                usedClasses = _.sortBy( usedClasses );
            }

            // gutil.log( 'Defined:', definedClasses );
            // gutil.log( 'Used:', usedClasses );

            definedUnused = _.difference( definedClasses, usedClasses );    // only in CSS
            usedUndefined = _.difference( usedClasses, definedClasses );    // only in HTML

            // gutil.log( 'Defined unused:', definedUnused.join( ',' ) );
            // gutil.log( 'Used undefined:', usedUndefined.join( ',' ) );

            badHTML = _.filter( usedUndefined, filterIgnored( ignore ) );
            badCSS = _.filter( definedUnused, filterIgnored( ignore ) );

            // gutil.log( 'Bad HTML:', badHTML.join( ',' ) );
            // gutil.log( 'Bad CSS:', badCSS.join( ',' ) );

            if ( definedClasses.length && badCSS.length ) {
                error = new Error( 'Unused CSS classes');
                error.css = badCSS;
            }
            if ( usedClasses.length && badHTML.length ) {
                if ( !error ) {
                    error = new Error( 'Undefined HTML classes' );
                }
                error.html = badHTML;
            }

            if ( error ) {
                if ( error.css ) {
                    gutil.log.apply( gutil, [ gutil.colors.cyan( 'Unused CSS classes' ), error.css.join( ' ' ) ] );
                }
                if ( error.html ) {
                    gutil.log.apply( gutil, [ gutil.colors.cyan( 'Undefined HTML classes' ), error.html.join( ' ' ) ] );
                }

                return done( new gutil.PluginError( PLUGIN_NAME, error ) );
            }


            // else proceed
            // gutil.log.apply( gutil, [ gutil.colors.cyan( 'File okay' ), file.path ]);
            self.push( file );
            done();
        });
    });
}

module.exports = checkCSS;
