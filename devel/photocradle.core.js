(function( $ ) {

var debug = true;
debug = window.console != undefined ? debug : false;

//***************************
$.photocradle = {
  params: {
    sources: [],
    service: ''
  },
  
  options: {
    firstImageIndex: 0,
    borderWeight: 4,
    enableLayers: ''
  },
  
  service: {},
  layer: {}
};

//***************************
$.fn.photocradle = function( params, options ) {
  var photoCradleParams = {}, photoCradleOptions = {};
  $.extend( photoCradleParams, $.photocradle.params, params );
  $.extend( photoCradleOptions, $.photocradle.options, options );
  
  return this.each( function () {
    var photocradle = new PhotoCradle( this, photoCradleOptions );
    
    var sourcesLoadHandler = function ( sources ) {
      photocradle.setSources( sources );
    };
    
    params.service 
      ? $.photocradle.service[ params.service ]( params, sourcesLoadHandler )
      : sourcesLoadHandler( params.sources )
    ;
  } );
};

// photocradle constructor
function PhotoCradle( element, options ) {
  var photocradle = this;
  
  photocradle.options = options;
  photocradle.pointer = { active: 0, preactive: 0, next: 0, previous: 0 };
  photocradle.$container = $( element );
  
  var initSizes = (function() {
    var sizes = {};
    sizes.previewWidth = Math.round( photocradle.$container.width() - photocradle.options.borderWeight * 2 );
    sizes.previewHeight = Math.round( ( photocradle.$container.height() - photocradle.options.borderWeight * 3 ) / 5 * 4 );
    sizes.thumbnailWidth = Math.round( ( photocradle.$container.width() - photocradle.options.borderWeight * 6 ) / 5 );
    sizes.thumbnailHeight = Math.round( ( photocradle.$container.height() - photocradle.options.borderWeight * 3 ) / 5 );
    
    return sizes;
  })();
  
  photocradle.sizes = {
    preview: {
      width: initSizes.previewWidth,
      height: initSizes.previewHeight
    },
    thumbnail: {
      width: initSizes.thumbnailWidth,
      height: initSizes.thumbnailHeight
    },
    original: {
      width: 0,
      height: 0
    }
  };
  
  photocradle.$area = $( '<div class="photocradle" />' )
    .appendTo( document.body );
  
  photocradle.$element = $( '<div class="photocradle-box" />' )
    .css( { 
      position: 'absolute',
      left: photocradle.$container.offset().left,
      top: photocradle.$container.offset().top,
      width: photocradle.$container.width(), 
      height: photocradle.$container.height()
    } )
    // make gallery container overlap other elements
    .mouseover( function () {
      var zIndex = 0;
      
      $( '*' ).each( function ( i, el ) {
        var elZIndex = parseInt( $( el ).css( 'z-index' ) );
        zIndex = elZIndex > zIndex ? elZIndex : zIndex;
      });
      
      photocradle.$element.css( { zIndex: ++zIndex } );
    })
    .appendTo( photocradle.$area );
  
  // update position on window resize
  $( window ).resize( function () {
    photocradle.$element
      .css( { 
        left: photocradle.$container.offset().left,
        top: photocradle.$container.offset().top
      } );
      
    $( photocradle ).trigger( 'resize' );
  });
  
  // add shader
  var $shader = $( '<div class="photocradle-shader"/>' )
    .css({ 
      background: '#000',
      position: 'fixed', 
      left: 0,
      top: 0,
      width: 1,
      height: 1,
      opacity: 0
    })
    .hide()
    .appendTo( photocradle.$area );
    
  // show/hide shader on hover
  var shaderVisible = false;
  
  photocradle.$element
    .mouseenter( function () {
      var showShader = function () {
        $shader
          .css({
            opacity: 0,
            display: 'block',
            width: $(window).width(),
            height: $(window).height()
          })
          .animate({ opacity: 0.3 }, 'slow' );
      };
      
      shaderVisible = true;
      setTimeout( function () { if ( shaderVisible ) showShader(); }, 100);
    } )
    .mouseleave( function() {
      var hideShader = function () {
        $shader.stop( true, false ).fadeOut( 'fast' );
      };
      
      shaderVisible = false;
      setTimeout( function () { if ( !shaderVisible ) hideShader(); }, 100);
    } );
  
  //debug ? console.log( photocradle ) : null;
};

// photocradle prototype
PhotoCradle.prototype = {
  // set image sources
  setSources: function( sources ) {
    var photocradle = this;
    
    photocradle.sources = sources;
    
    if ( !sources.length )
      return;
      
    photocradle.setActive( photocradle.options.firstImageIndex );
    
    // build layers
    var z = 0;
    $.each( $.photocradle.layer, function( name, layer ) {
      var $layerElement = $( '<div/>' )
        .css({
          position: 'absolute',
          zIndex: 1000 + z
        })
        .addClass( name )
        .appendTo( photocradle.$element );
        
      new layer( photocradle, $layerElement );
      
      z++;
    });
  },
  
  // changes active image index
  setActive: function( active ) {
    var photocradle = this;
    var pointer = photocradle.pointer;
    
    pointer.preactive = pointer.active;
    pointer.active = parseInt( active );
    pointer.next = photocradle.sources.length == ( pointer.active + 1 ) ? 0 : ( pointer.active + 1 );
    pointer.previous = -1 == ( pointer.active - 1 ) ? photocradle.sources.length - 1 : pointer.active - 1;
    
    $( photocradle ).trigger( "changeActive" );
    
    return this;
  },
  
  // creates and returns a fillimage
  getFillImage: function( type, ind ) {
    var photocradle = this;
    ind = ind == 'active' ? photocradle.pointer.active : ind;
    
    var fimage = new FillImage( photocradle.sources[ ind ] ? photocradle.sources[ ind ][ type ] : '' );
    fimage.setSize( photocradle.sizes[ type ].width, photocradle.sizes[ type ].height );
    
    return fimage;
  }
};

// fillImage constructor
function FillImage( src ) {
  var eimage = this;
  
  eimage.$element = $( '<div style="position:absolute;overflow:hidden;" />' );
  eimage.image = new Image;
  
  $( eimage.image )
    .css( {
      position: 'absolute',
      '-moz-user-select': 'none',
      '-khtml-user-select': 'none',
      '-webkit-user-select': 'none',
      'user-select': 'none'
    } )
    .attr( 'unselectable', true )
    .hide()
    .load( function() { $(this).show(); } )
    .appendTo( eimage.$element );
    
  eimage.image.src = src;
  eimage.sizeAvailable = false;
  
  var sizeAvailableTrigger = (function() {
    if ( parseInt( eimage.image.width + eimage.image.height ) != 0 ) {
      $( eimage ).trigger( 'sizeAvailable' );
      eimage.sizeAvailable = true;
    };
    
    setTimeout(function() {if ( !eimage.sizeAvailable ) sizeAvailableTrigger();}, 10);
    
    return arguments.callee;
  })();
  
  //debug ? console.log( eimage ) : null;
};
 
// fillImage prototype
FillImage.prototype = {
  preload: function( handler ) {
    var fimage = this;
    
    if (typeof( handler ) != 'function')
      return this;
      
    $( fimage ).one( 'sizeAvailable', function() { handler( fimage ); } );
    
    if ( fimage.sizeAvailable )
      $( fimage ).trigger( 'sizeAvailable' );
    
    return this;
  },
  
  ready: function( handler ) {
    var fimage = this;
    
    if (typeof( handler ) != 'function')
      return this;
    
    $( fimage.image ).one( 'load', function() { handler( fimage ); } );
    
    if ( fimage.image.complete )
      $( fimage.image ).trigger( 'load' );
      
    return this;
  },

  setSize: function( setWidth, setHeight ) {
    var eimage = this;
    
    setWidth = setWidth ? setWidth : eimage.$element.width();
    setHeight = setHeight ? setHeight : eimage.$element.height();
    
    eimage.$element.css({ width: setWidth, height: setHeight });
    
    eimage.preload( function() {
      var canvasRatio = setWidth / setHeight;
      var imageRatio = eimage.image.width / eimage.image.height;
      
      if ( canvasRatio >= imageRatio ) {
        var imageWidth = setWidth;
        var imageHeight = setWidth / imageRatio;
        
      } else {
        var imageWidth = setHeight * imageRatio;
        var imageHeight = setHeight;
      };
      
      var imageLeft = ( setWidth - imageWidth ) / 2;
      var imageTop = ( setHeight - imageHeight ) / 2;
      
      $( eimage.image ).css({
        width: Math.ceil( imageWidth ),
        height: Math.ceil( imageHeight ), 
        left: Math.ceil( imageLeft ), 
        top: Math.ceil( imageTop )
      });
    } );
    
    return this;
  }
};

// custom service
$.photocradle.service.custom = function () {};

})( jQuery );