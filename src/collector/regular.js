function regularCollector() {
    this.collect = function collect( attributes, angularSupport ) {
        var hasClass = attributes[ 'class' ];
        
        return hasClass ?
                hasClass
                    .split( ' ' )
                    .filter( function( clazz ) {
                        return angularSupport ? clazz.substring( 0, 2 ) !== '{{' : true;
                    })

                : [];
    }
}

module.exports = regularCollector;