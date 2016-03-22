/**
 * @description - Collects all of the css classes defined using the class attribute
 * @return - 
 */
function regularCollector() {
    'use strict';
    this.collect = function collect( attributes, angularSupport ) {
        var hasClass = attributes[ 'class' ];
        
        return hasClass ?
                hasClass
                    .split( ' ' )
                    .filter( function( clazz ) {
                        return angularSupport ? clazz.substring( 0, 2 ) !== '{{' : true;
                    })

                : [];
    };
}

module.exports = regularCollector;