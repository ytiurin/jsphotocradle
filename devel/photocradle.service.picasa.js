(function( $ ) {

// picasa service
$.photocradle.service.picasa = function ( params, loadHandler ) {
  var 
    picasaParams = {},
    defaultPicasaParams = {};
  
  $.extend( picasaParams, defaultPicasaParams, params );
  
  $.getJSON( [ 'http://picasaweb.google.com/data/feed/api/user/', picasaParams.user, '/albumid/', picasaParams.album ].join( '' ), { alt: 'json' }, function( data ) {
    if ( !data.feed )
      return;
    
    var sources = [];
    $.each( data.feed.entry, function( i, p ) {
      sources.push( {
        thumbnail: p.media$group.media$thumbnail[0].url,
        preview: p.media$group.media$thumbnail[2].url,
        original: p.media$group.media$content[0].url,
        title: p.title.$t
      } );
    } );
    
    loadHandler( sources );
  } );
};

})( jQuery );