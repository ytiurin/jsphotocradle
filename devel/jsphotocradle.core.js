(function( $ ) {

var debug = true;
debug = window.console != undefined ? debug : false;

//***************************
$.jsphotocradle = {
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
$.fn.jsphotocradle = function( params, options ) {
  var jsphotocradleParams = {}, jsphotocradleOptions = {};
  $.extend( jsphotocradleParams, $.jsphotocradle.params, params );
  $.extend( jsphotocradleOptions, $.jsphotocradle.options, options );
  
  return this.each( function () {
    var jsphotocradle = new CTGallery( this, jsphotocradleOptions );
    
    var sourcesLoadHandler = function ( sources ) {
      jsphotocradle.setSources( sources );
    };
    
    params.service 
      ? $.jsphotocradle.service[ params.service ]( params, sourcesLoadHandler )
      : sourcesLoadHandler( params.sources )
    ;
  } );
};

// jsphotocradle constructor
function CTGallery( element, options ) {
  var jsphotocradle = this;
  
  jsphotocradle.options = options;
  jsphotocradle.pointer = { active: 0, preactive: 0, next: 0, previous: 0 };
  jsphotocradle.$container = $( element );
  
  var initSizes = (function() {
    var sizes = {};
    sizes.previewWidth = Math.round( jsphotocradle.$container.width() - jsphotocradle.options.borderWeight * 2 );
    sizes.previewHeight = Math.round( ( jsphotocradle.$container.height() - jsphotocradle.options.borderWeight * 3 ) / 5 * 4 );
    sizes.thumbnailWidth = Math.round( ( jsphotocradle.$container.width() - jsphotocradle.options.borderWeight * 6 ) / 5 );
    sizes.thumbnailHeight = Math.round( ( jsphotocradle.$container.height() - jsphotocradle.options.borderWeight * 3 ) / 5 );
    
    return sizes;
  })();
  
  jsphotocradle.sizes = {
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
  
  jsphotocradle.$area = $( '<div class="jsphotocradle" />' )
    .appendTo( document.body );
  
  jsphotocradle.$element = $( '<div class="jsphotocradle-box" />' )
    .css( { 
      position: 'absolute',
      left: jsphotocradle.$container.offset().left,
      top: jsphotocradle.$container.offset().top,
      width: jsphotocradle.$container.width(), 
      height: jsphotocradle.$container.height()
    } )
    // make gallery container overlap other elements
    .mouseover( function () {
      var zIndex = 0;
      
      $( '*' ).each( function ( i, el ) {
        var elZIndex = parseInt( $( el ).css( 'z-index' ) );
        zIndex = elZIndex > zIndex ? elZIndex : zIndex;
      });
      
      jsphotocradle.$element.css( { zIndex: ++zIndex } );
    })
    .appendTo( jsphotocradle.$area );
  
  // update position on window resize
  $( window ).resize( function () {
    jsphotocradle.$element
      .css( { 
        left: jsphotocradle.$container.offset().left,
        top: jsphotocradle.$container.offset().top
      } );
      
    $( jsphotocradle ).trigger( 'resize' );
  });
  
  // add shader
  var $shader = $( '<div class="jsphotocradle-shader"/>' )
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
    .appendTo( jsphotocradle.$area );
    
  // show/hide shader on hover
  var shaderVisible = false;
  
  jsphotocradle.$element
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
  
  //debug ? console.log( jsphotocradle ) : null;
};

// jsphotocradle prototype
CTGallery.prototype = {
  // set image sources
  setSources: function( sources ) {
    var jsphotocradle = this;
    
    jsphotocradle.sources = sources;
    
    if ( !sources.length )
      return;
      
    jsphotocradle.setActive( jsphotocradle.options.firstImageIndex );
    
    // build layers
    var z = 0;
    $.each( $.jsphotocradle.layer, function( name, layer ) {
      var $layerElement = $( '<div/>' )
        .css({
          position: 'absolute',
          zIndex: 1000 + z
        })
        .addClass( name )
        .appendTo( jsphotocradle.$element );
        
      new layer( jsphotocradle, $layerElement );
      
      z++;
    });
  },
  
  // changes active image index
  setActive: function( active ) {
    var jsphotocradle = this;
    var pointer = jsphotocradle.pointer;
    
    pointer.preactive = pointer.active;
    pointer.active = parseInt( active );
    pointer.next = jsphotocradle.sources.length == ( pointer.active + 1 ) ? 0 : ( pointer.active + 1 );
    pointer.previous = -1 == ( pointer.active - 1 ) ? jsphotocradle.sources.length - 1 : pointer.active - 1;
    
    $( jsphotocradle ).trigger( "changeActive" );
    
    return this;
  },
  
  // creates and returns a fillimage
  getFillImage: function( type, ind ) {
    var jsphotocradle = this;
    ind = ind == 'active' ? jsphotocradle.pointer.active : ind;
    
    var fimage = new FillImage( jsphotocradle.sources[ ind ] ? jsphotocradle.sources[ ind ][ type ] : '' );
    fimage.setSize( jsphotocradle.sizes[ type ].width, jsphotocradle.sizes[ type ].height );
    
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
$.jsphotocradle.service.custom = function () {};

})( jQuery );