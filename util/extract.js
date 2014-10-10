// this module is used to extract classes from css frameworks like bootstrap

'use strict';

var gutil = require( 'gulp-util' ),     // for gulp plugin error
    css = require( 'css' ),             // css parser
    fs = require( 'fs' ),               // file system access
    _ = require( 'lodash' ),            // lodash for utilities
    argv = require('minimist')(process.argv.slice(2));

if ( !argv.file ) {
    console.error( 'please provide a file with --file' );
    return;
}

var file = fs.readFileSync( argv.file ),
    definedClasses = [],
    CLASS_REGEX = /\.[a-zA-Z](?:[0-9A-Za-z_-])+/g,
    ast;

try {
    ast = css.parse( String( file ), { silent: false } );
} catch( cssError ) {
    console.error( cssError.message );
}

ast.stylesheet.rules.forEach(function( rule ) {
    if ( !rule.type === 'rule ' ) {
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

        matches.forEach( function( match ) {
            if ( definedClasses.indexOf( match ) === -1 ) {
                definedClasses.push( match );
            }
        });
    });
});

definedClasses = definedClasses.map( function( c ) { return c.substring( 1 ); });

var ignoreFile = 'module.exports = ' + JSON.stringify( definedClasses ) + ';';

fs.writeFileSync( argv.file + '.ignore', ignoreFile );