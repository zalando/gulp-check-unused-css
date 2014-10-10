function regularCollector() {
    this.collect = function collect( attributes ) {
        var clazz = attributes[ 'class' ];
        return clazz ? clazz.split( ' ' ) : [];
    }
}

module.exports = regularCollector;