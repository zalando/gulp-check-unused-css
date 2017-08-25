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
    CLASS_REGEX = /\.[a-zA-Z](?:[0-9A-Za-z_-])*/g;  // leading dot & a letter & digits, letters, _ or -

/**
* @description - Checks whether a class should be ignored
* @param {string} clazz - The class to be checked against ignore strings and regexs
* @return {boolean} - returns true or false if clazz should be ignored
*/
function shouldIgnore( clazz ) {
    'use strict';

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


/**
* @description - Checks whether to ignore a collection of classes
* @param {boolean} ignore - whether classes should be filtered out
* @return {boolean} - return whether it is to be ignored or not
*/
function filterIgnored( ignore ) {
    'use strict';

    return function( clazz ) {
        var ignoreThis = false,
            isGlobal = globals.length ? _.indexOf( globals, clazz, true ) >= 0 : false;

        // check if we should ignore this class
        if ( ignore ) {
            ignoreThis = _.some( ignore, shouldIgnore( clazz ) );
        }
        return ignoreThis ? false : !isGlobal;
    };
}

/**
* @description - Checks if the selectors of a CSS rule are a class and adds them to the list of defined classes
* @param {Array} collection - The existing list of classes
*/
function getDefinedClasses( collection ) {
    'use strict';

    return function handleRule( rule ) {
        if ( Array.isArray( rule.rules ) ) {
            return rule.rules.forEach( handleRule );
        }

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

/**
 * @description - Function that gets exported for css checking
 * @param {Object} opts - The options such as ignore, globals and angular
 */
function checkCSS( opts ) {
    'use strict';

    globals = [];
    usedClasses = [];
    definedClasses = [];

    if ( typeof opts === 'undefined' ) {
        opts = {};
    }

    var error,
        ignore = opts.ignore || false;

    // import global classes
    if ( opts.globals ) {
        opts.globals.forEach( function( global ) {
            if ( _.isString( global ) ) {
                globals.push.apply( globals, require( './global/' + global ) );
            } else if ( _.isArray( global ) ) {
                globals.push.apply( globals, global );
            }
        });
        globals = _.sortBy( globals );
    }

    // create html parser
    var htmlparser = new html.Parser({
        onopentag: function onopentag( name, attribs ) {
            var all = [];
            
            all.push.apply( all, regularClass.collect( attribs, opts.angular ) );

            if ( opts.angular ) {
                all.push.apply( all, angularClass.collect( attribs ) );
            }

            _.each( all, function( usedClass ) {
                if ( _.indexOf( usedClasses, usedClass ) === -1 ) {
                    usedClasses.push( usedClass );
                }
            });
        }
    });

    var transform = through.obj( function( file, enc, done ) {
        var self = this;

        if ( file.isNull() ) {
            self.push( file );
            return done();
        }

        if ( file.isStream()) {
            return done( new gutil.PluginError( PLUGIN_NAME, 'Streaming not supported' ) );
        }

        var ast;

        // first try to parse css
        try {
            ast = css.parse( String( file.contents ), { silent: false } );
            // find all classes in CSS
            if ( ast.stylesheet ) {
                ast.stylesheet.rules.forEach( getDefinedClasses( definedClasses ) );
            }
        } catch( ex ) {
            // if it doesn't work, put it into html parser
            // this has to work because in worst case no onOpenTag will be triggered
            htmlparser.write( String( file.contents ) );
        }

        // just emit the file for later use
        self.push( file );
        done();
    });

    // we have to wait until we received all files
    // otherwise we would throw an error after the first one
    transform.on( 'finish', function() {
        var badHTML,
            badCSS,
            usedUndefined = [], // in HTML, but not in CSS
            definedUnused = []; // in CSS, but not in HTML


        definedUnused = _.difference( definedClasses, usedClasses );    // only in CSS
        usedUndefined = _.difference( usedClasses, definedClasses );    // only in HTML

        badHTML = _.filter( usedUndefined, filterIgnored( ignore ) );
        badCSS =  _.filter( definedUnused, filterIgnored( ignore ) );

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

            this.emit( 'error', new gutil.PluginError( PLUGIN_NAME, error ) );
        }
    });

    return transform;
}

module.exports = checkCSS;
