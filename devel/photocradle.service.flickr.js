(function( $ ) {

var flickrAPIKey = 'f53c32a7c8812bfe7d8e7c96ff0214e1';

// flickr service
$.photocradle.service.flickr = function ( params, loadHandler ) {
  var 
    flickrParams = {},
    defaultFlickrParams = {
      photoset: '',
      limit: 100
    };
  
  $.extend( flickrParams, defaultFlickrParams, params );
  
  var size = {
      square: 's',
      thumbnail: 't',
      small: 'm',
      large: 'b',
      original: 'o'
    }
    
    , flickrRequest = function( data, callback ) {
      $.getJSON( 'http://api.flickr.com/services/rest/', data, callback );
    }
    
    , getPhotoSources = function( flickrPhotos ) {
      //console.log( flickrPhotos );
      
      var sources = [];
      $.each( flickrPhotos, function( i, p ) {
        sources.push( {
          thumbnail: [ 'http://farm', p.farm, '.static.flickr.com/', p.server, '/', p.id, '_', p.secret, '_', size.thumbnail, '.jpg' ].join( '' ),
          preview: [ 'http://farm', p.farm, '.static.flickr.com/', p.server, '/', p.id, '_', p.secret, '_', size.small, '.jpg' ].join( '' ),
          original: [ 'http://farm', p.farm, '.static.flickr.com/', p.server, '/', p.id, '_', p.secret, '_', size.large, '.jpg' ].join( '' ),
          title: p.title
        } );
      } );
      
      return sources;
    }
    
    , data = {
      api_key: flickrAPIKey,
      per_page: flickrParams.limit,
      format: 'json', 
      nojsoncallback: 1
    }
    
    , callback = function( flickrResponse ) {}
  ;
  
  // try photoset
  if ( flickrParams.photoset ) {
    $.extend( data, {
      method: 'flickr.photosets.getPhotos',
      photoset_id: flickrParams.photoset
    } );
    
    flickrRequest( data, function( flickrResponse ) { 
      if ( flickrResponse.stat == 'ok' )
        loadHandler( getPhotoSources( flickrResponse.photoset.photo ) );
    } );
  }
  
  // try photostream
  else if ( flickrParams.photostream ) {
    $.extend( data, {
      method: 'flickr.urls.lookupUser',
      url: flickrParams.photostream
    } );
    
    flickrRequest( data, function( flickrResponse ) {
      if ( flickrResponse.stat != 'ok' )
        return;
        
      $.extend( data, {
        method: 'flickr.people.getPublicPhotos',
        user_id: flickrResponse.user.id
      } );
        
      flickrRequest( data, function( flickrResponse ) { 
        loadHandler( getPhotoSources( flickrResponse.photos.photo ) );
      } );
    } );
  }
  
  // try gallery
  else if ( flickrParams.gallery ) {
    $.extend( data, {
      method: 'flickr.urls.lookupGallery',
      url: flickrParams.gallery
    } );
    
    flickrRequest( data, function( flickrResponse ) {
      if ( flickrResponse.stat != 'ok' )
        return;
        
      $.extend( data, {
        method: 'flickr.galleries.getPhotos',
        gallery_id: flickrResponse.gallery.id
      } );
        
      flickrRequest( data, function( flickrResponse ) { 
        loadHandler( getPhotoSources( flickrResponse.photos.photo ) );
      } );
    } );
  };
};

})( jQuery );