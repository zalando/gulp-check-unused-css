var _ = require( 'lodash' );

var NG_TAG = /((data|x)[-:_])?ng[-:_]class/i;

/**
 * @description - This collector obtains all classes added to html elements using angular (such as ng-class)
 * @return - collection of classes added to html using angular
 */
function angularCollector() {
    'use strict';
    this.collect = function collect( attributes ) {
        var classes = [],
            tags = [];

        // collect all angular class tags in the attributes
        Object
        .keys( attributes )
        .forEach( function( attr ) {
            if ( NG_TAG.test( attr ) && tags.indexOf( attr ) === -1 ) {
                tags.push( attr );
            }
        });

        // now get dem classes
        tags
        .map( function( tag ) {
            // assuming { condition: value } here
            if ( attributes[ tag ][ 0 ] === '{' ) {


                return attributes[ tag ]
                    .split( ',' )
                    .map( function( statement ) {
                        return statement.substring( 0, statement.indexOf( ':' ) );
                    })
                    .map( function( clazz ) {
                        var result = clazz.match( /[a-zA-Z0-9-_]+/gi );
                        if ( result && result.length ) {
                            return result[ 0 ];
                        }
                        return undefined;
                    });
            } else if ( [ '\'', '"' ].indexOf( attributes[ tag ][ 0 ] ) >= 0 ) {
                // it's a string we need to check
                return [ attributes[ tag ].substring( 1, attributes[ tag ].length - 1 ) ];
            } else {
                // it's a variable, ignore
                return [];
            }
        })
        .filter( function( clazz ) {
            return !_.isUndefined( clazz );
        })
        .forEach( function( cs ) {
            classes.push.apply( classes, cs );
        });

        return classes;
    };
}

module.exports = angularCollector;