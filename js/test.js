def trackClicks(){

}



jQuery.fn.extend({
    getPath: function( path ) {
      // The first time this function is called, path won't be defined.
      if ( typeof path == 'undefined' ) path = '';

      // If this element is <html> we've reached the end of the path.
      if ( this.is('html') )
        return 'html' + path;

      // Add the element name.
      var cur = this.get(0).nodeName.toLowerCase();

      // Determine the IDs and path.
      var id    = this.attr('id'),
        klass = this.attr('class');

      // Add the #id if there is one.
      if ( typeof id != 'undefined' )
        cur += '#' + id;

      // Add any classes.
      if ( typeof klass != 'undefined' )
      cur += '.' + klass.split(/[\s\n]+/).join('.');

      // Recurse up the DOM.
      return this.parent().getPath( ' > ' + cur + path );
    }
  });
