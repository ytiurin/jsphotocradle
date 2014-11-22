(function( $ ) {

$.photocradle.flickrImageSizes = 
{
  square:       'sq',//75x75
  largeSquare:  'q',//150x150
  thumbnail:    't',//100x75
  small:        's',//240x180
  small320:     'n',//320x240
  medium:       'm',//500x375
  medium640:    'z',//640x480
  medium800:    'c',//800x600
  large:        'b',//1024x768
  original:     'o'//2400x1800
};

var flickrAPIKey = 'f53c32a7c8812bfe7d8e7c96ff0214e1';

// flickr service
$.photocradle.service.flickr = function ( params, loadHandler ) {
  var 
    flickrParams = {},
    defaultFlickrParams = {
      photoset: '',
      limit: 100,
      imageSizes: 
      {
        thumbnail: $.photocradle.flickrImageSizes.thumbnail,
        preview: $.photocradle.flickrImageSizes.medium,
        original: $.photocradle.flickrImageSizes.large
      }
    };
    
  flickrParams = $.extend( true, flickrParams, defaultFlickrParams, params );
  
  var flickrRequest = function( data, callback ) {
      $.getJSON( 'https://api.flickr.com/services/rest/', data, callback );
    }
    
    , getPhotoSources = function( flickrPhotos ) {
      //console.log( flickrPhotos );
      
      var sources = [];
      $.each( flickrPhotos, function( i, p ) {
        sources.push( {
          thumbnail: [ 'https://farm', p.farm, '.static.flickr.com/', p.server, '/', p.id, '_', p.secret, '_', flickrParams.imageSizes.thumbnail, '.jpg' ].join( '' ),
          preview: [ 'https://farm', p.farm, '.static.flickr.com/', p.server, '/', p.id, '_', p.secret, '_', flickrParams.imageSizes.preview, '.jpg' ].join( '' ),
          original: [ 'https://farm', p.farm, '.static.flickr.com/', p.server, '/', p.id, '_', p.secret, '_', flickrParams.imageSizes.original, '.jpg' ].join( '' ),
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