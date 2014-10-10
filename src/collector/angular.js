var _ = require( 'lodash' );

var NG_TAG = /((data|x)[-:_])?ng[-:_]class/i;

function angularCollector() {
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
            return attributes[ tag ]
                .split( ',' )
                .map( function( statement ) {
                    return statement.substring( 0, statement.indexOf( ':' ) );
                })
                .map( function( clazz ) {
                    return clazz.match( /[a-zA-Z0-9-_]+/gi )[0];
                });
        })
        .forEach( function( cs ) {
            classes.push.apply( classes, cs );
        });

        return classes;
    }
}

module.exports = angularCollector;