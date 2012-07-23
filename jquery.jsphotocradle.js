(function( $ ) {

var debug = false;
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

// preview layer
$.jsphotocradle.layer.preview = function( jsphotocradle, $layerElement ) {
  var lr = this;
  
  lr.preview = jsphotocradle.getFillImage( 'preview', 'active' );
  
  var $frameElement = $( '<div/>' )
    .css({
      position: 'relative',
      overflow: 'hidden',
      left: jsphotocradle.options.borderWeight,
      top: jsphotocradle.options.borderWeight,
      width: jsphotocradle.sizes.preview.width,
      height: jsphotocradle.sizes.preview.height
    })
    .mouseenter( function() {
      $( jsphotocradle ).trigger( 'previewMouseEnter' );
    })
    .mouseleave( function() {
      $( jsphotocradle ).trigger( 'previewMouseLeave' );
    })
    .append( lr.preview.$element );
    
  var slidePreviews = function( direction ) {
    if ( lr.preview != undefined ) {
      lr.preview.stop = true;

      var oldPreview = lr.preview;
      
      oldPreview.$element
        .stop(true, true)
        .animate({
          left: ( jsphotocradle.sizes.preview.width + parseInt( jsphotocradle.options.borderWeight * 5 )) * (direction == 'left' ? -1 : 1)
        }, 300, 'easeOutExpo', function() {
          oldPreview.$element.detach();
        });
    }

    lr.preview = jsphotocradle.getFillImage( 'preview', 'active' )
      .ready( function( preview ) {
        if ( preview.stop )
          return;
          
        preview
          .setSize( jsphotocradle.sizes.preview.width, jsphotocradle.sizes.preview.height )
          .$element
            .appendTo( $frameElement )
            .css({ 
              left: ( jsphotocradle.sizes.preview.width + parseInt( jsphotocradle.options.borderWeight * 5 ) ) * (direction == 'left' ? 1 : -1)
            })
            .stop(true, true)
            .animate( { left: 0 }, 300, 'easeOutExpo' );
      } );
  };
    
  // react on image change
  $( jsphotocradle ).bind( 'changeActive', { jsphotocradle: jsphotocradle }, function( e ) {
    var jsphotocradle = e.data.jsphotocradle;
    
    // slide left
    if ( jsphotocradle.pointer.preactive == jsphotocradle.pointer.previous ) {
      slidePreviews( 'left' );
      return;
  
    // slide right
    } else if ( jsphotocradle.pointer.preactive == jsphotocradle.pointer.next ) {
    slidePreviews( 'right' );
      return;
    };

    // fade in
    lr.preview.$element.detach();
    
    lr.preview = jsphotocradle.getFillImage( 'preview', 'active' )
      .ready( function( preview ) {
        preview
          .setSize( jsphotocradle.sizes.preview.width, jsphotocradle.sizes.preview.height )
          .$element
            .hide()
            .appendTo( $frameElement )
            .fadeIn();
      } );
  });
   
  /*
  // help function
  function previewZoom( animateProperties) {
    var animateOptions = {
      duration: 300,
      easing: 'easeOutExpo',
      step: function( now, fx ) {
        if ( fx.prop == 'width' ) {
          preview.set({width: fx.now}).update();
          
        } else if ( fx.prop == 'height' ) {
          preview.set({height: fx.now}).update();
        };
      }
    };
    
    preview.$element
      .stop( true, true )
      .animate( animateProperties, animateOptions );
  };
  
  var previewZoomed = false;
  
  $( jsphotocradle )
    // react on preview mouseenter
    .bind( 'previewMouseEnter', function() {
      previewZoomed = true;
      
      setTimeout( function() {
        if ( previewZoomed )
          previewZoom({
            width: Math.round( jsphotocradle.sizes.preview.width * 1.1 ),
            height: Math.round( jsphotocradle.sizes.preview.height * 1.1 ),
            left: -1 * Math.round( jsphotocradle.sizes.preview.width * 0.05 ),
            top: -1 * Math.round( jsphotocradle.sizes.preview.height * 0.05 )
          });
      }, 100);
    })
    
    // react on preview mouseleave
    .bind( 'previewMouseLeave', function() {
      previewZoomed = false;
      
      setTimeout( function() {
        if ( !previewZoomed )
          previewZoom({
            width: jsphotocradle.sizes.preview.width,
            height: jsphotocradle.sizes.preview.height,
            left: 0,
            top: 0
          })
      }, 100);
    });
  */
  $frameElement.appendTo($layerElement);
};

// preview controls
$.jsphotocradle.layer.previewControl = function( jsphotocradle, $layerElement ) {
  var $jsphotocradle = $( jsphotocradle );
  
  var $controlPreview = $( '<div/>' )
    .css({
      position: 'absolute',
      cursor: 'pointer',
      left: Math.round( jsphotocradle.sizes.preview.width / 4 ),
      top: jsphotocradle.options.borderWeight,
      width: Math.round( jsphotocradle.sizes.preview.width / 2 ),
      height: jsphotocradle.sizes.preview.height,
      // ie hack
      background: '#fff',
      opacity: 0
    })
    .click( function() {
      $jsphotocradle.trigger( 'previewClick' );
    })
    .appendTo( $layerElement );
  
  var $controlNext = $( '<div/>' )
    .addClass( 'control-next' )
    .css({
      position: 'absolute',
      cursor: 'pointer'
      // ,
      // opacity: 0
    })
        
    .click( function () { $jsphotocradle.trigger( 'previewControlNextClick' ); })
    .mouseenter( function () { $jsphotocradle.trigger( 'previewControlNextMouseEnter' ); })
    .mouseleave( function () { $jsphotocradle.trigger( 'previewControlNextMouseLeave' ); })
    .appendTo( $layerElement )
  ;
    
  // control pervious
  var $controlPrev = $('<div/>')
    .addClass('control-prev')
    .css({
      position: 'absolute',
      cursor: 'pointer'
      // ,
      // opacity: 0
    })
        
    .click( function () { $jsphotocradle.trigger( 'previewControlPreviousClick' ); })
    .mouseenter( function () { $jsphotocradle.trigger( 'previewControlPreviousMouseEnter' ); })
    .mouseleave( function () { $jsphotocradle.trigger( 'previewControlPreviousMouseLeave' ); })
        
    .appendTo( $layerElement )
  ;
    
  if (jsphotocradle.sizes.preview.height <= 240) {
    $layerElement.addClass('mini');
  };
  
  $controlNext.css({
    left: Math.round(jsphotocradle.sizes.preview.width - $controlNext.width() + jsphotocradle.options.borderWeight),
    top: Math.round((jsphotocradle.sizes.preview.height - $controlNext.height()) / 2 + jsphotocradle.options.borderWeight)
  });

  $controlPrev.css({
    left: jsphotocradle.options.borderWeight,
    top: Math.round((jsphotocradle.sizes.preview.height - $controlNext.height()) / 2 + jsphotocradle.options.borderWeight)
  });
  
  // controls behaviour
  $jsphotocradle
    .bind( 'previewControlNextClick', function () {
      jsphotocradle.setActive( jsphotocradle.pointer.next );
    })
    .bind( 'previewControlPreviousClick', function () {
      jsphotocradle.setActive( jsphotocradle.pointer.previous );
    })
  ;
  
  // show/hide on hover
  // var $controls = $([$controlNext.get(0), $controlPrev.get(0)]);
  // var controlsVisible = false;
  
  // var handleControlOpacity = function ( opacity, $el ) {
    // setTimeout( function () {
      // opacity = controlsVisible ? opacity : 0;
      // ( $el ? $el : $controls ).animate( { opacity: opacity }, 200 );
    // }, 100);
  // };
  
  // $jsphotocradle
    // .bind( 'previewMouseEnter', function ( ) {
      // controlsVisible = true;
      // handleControlOpacity( 0.5 );
    // } )
    // .bind( 'previewMouseLeave', function ( ) {
      // controlsVisible = false;
      // handleControlOpacity( 0.5 );
    // } );
  
  // $controlPreview
    // .mouseenter( function ( ) {
      // controlsVisible = true;
      // handleControlOpacity( 0.5 );
    // } )
    // .mouseleave( function ( ) {
      // controlsVisible = false;
      // handleControlOpacity( 0.5 );
    // } );
  
  // $controls
    // .mouseenter( function ( ) {
      // controlsVisible = true;
      // handleControlOpacity( 1, $(this) );
    // } )
    // .mouseleave( function ( ) {
      // controlsVisible = false;
      // handleControlOpacity( 0.5, $(this) );
    // } );
};

// preload layer
$.jsphotocradle.layer.preload = function( jsphotocradle, $layerElement ) {
  var lr = this;
  var $jsphotocradle = $( jsphotocradle );
  
  var thumb;
  var pointerName;
  var opRand;
  var bringThumb = function () {
    var thisOpRand = opRand;
    
    if ( thumb != undefined )
      thumb.$element.detach();
            
    var previewImage = jsphotocradle.getFillImage( 'preview', jsphotocradle.pointer[pointerName] );
    
    previewImage.ready( function () {
      if ( thisOpRand != opRand )
        return;
          
      thumb = jsphotocradle.getFillImage( 'thumbnail', jsphotocradle.pointer[pointerName] );
      
      if ( pointerName == 'next' ) {
        var thumbLeft = jsphotocradle.sizes.preview.width + jsphotocradle.options.borderWeight * 4;
        var thumbAnimDir = 1;
      
      } else if ( pointerName == 'previous' ) {
        var thumbLeft = ( jsphotocradle.sizes.thumbnail.width + jsphotocradle.options.borderWeight * 2 ) * -1;
        var thumbAnimDir = -1;
      };
      
      thumb.$element
        .appendTo( $layerElement )
        .css({
          left: thumbLeft + jsphotocradle.options.borderWeight * 8 * thumbAnimDir,
          top: ( jsphotocradle.sizes.preview.height - jsphotocradle.sizes.thumbnail.height ) / 2 + jsphotocradle.options.borderWeight,
          opacity: 0
        })
        .animate({ 
          left: thumbLeft, 
          opacity: 1 
        }, 800, 'easeOutExpo')
      ;
    } );
  };
  
  $jsphotocradle
    .bind( 'previewControlNextMouseEnter previewControlNextClick', function () { pointerName = 'next'; opRand = Math.random(); bringThumb(); } )
    .bind( 'previewControlNextMouseLeave', function () { opRand = Math.random(); thumb.$element.detach(); })
    .bind( 'previewControlPreviousMouseEnter previewControlPreviousClick', function () { pointerName = 'previous'; opRand = Math.random(); bringThumb(); } )
    .bind( 'previewControlPreviousMouseLeave', function () { opRand = Math.random(); thumb.$element.detach(); })
  ;
};

// thumbnails layer
$.jsphotocradle.layer.thumbnails = function( jsphotocradle, $layerElement ) {
  var lr = this;
  var $jsphotocradle = $( jsphotocradle );
  var calculate = {};

  var $thumbContainer = $( '<div/>' )
    .css({
      position: 'absolute',
      overflow: 'hidden',
      left: jsphotocradle.options.borderWeight,
      top: jsphotocradle.sizes.preview.height + jsphotocradle.options.borderWeight,
      width: jsphotocradle.sizes.preview.width,
      height: jsphotocradle.sizes.thumbnail.height + jsphotocradle.options.borderWeight * 2
    })
    .appendTo( $layerElement );
  
  var $thumbRails = $( '<div/>' )
    .css({
      position: 'absolute',
      overflow: 'hidden',
      top: 0,
      height: jsphotocradle.sizes.thumbnail.height + jsphotocradle.options.borderWeight * 2
    })
    .appendTo( $thumbContainer );
    
  var $thumbSlider = $( '<div/>' )
    .css({
      position: 'absolute', 
      top: 0,
      width: jsphotocradle.sources.length * ( jsphotocradle.sizes.thumbnail.width + jsphotocradle.options.borderWeight ) - jsphotocradle.options.borderWeight,
      height: jsphotocradle.sizes.thumbnail.height + jsphotocradle.options.borderWeight * 2
    })
    .appendTo($thumbRails);
    
  // create thumbnails elements
  var thumbnailList = [];
  var hoverThumbIndex = jsphotocradle.pointer.active;
  
  calculate.thumbOpacity = function ( i ) {
    var step = 0.1;
    var opacityByActive =  1 - ( Math.abs( i - jsphotocradle.pointer.active ) * step );
    var opacityByHover =  1 - ( Math.abs( i - hoverThumbIndex ) * step );
    opacity = Math.max( opacityByActive, opacityByHover );
    opacity = Math.max( opacity, step );
    
    return opacity;
  };
    
  $( jsphotocradle.sources ).each( function( i, img_opts ) {
    var thumb = jsphotocradle.getFillImage( 'thumbnail', i );
    
    thumb.$element
      .css({
        left: i * ( jsphotocradle.sizes.thumbnail.width + jsphotocradle.options.borderWeight ),
        top: jsphotocradle.options.borderWeight,
        opacity: 0,
        cursor: 'pointer'
      })
      .appendTo( $thumbSlider );
    
    // react on thumbnail click
    thumb.$element
      .click( function() {
          if ( i == jsphotocradle.pointer.active )
              return;
          
          jsphotocradle.setActive( i );
      } );
      
    thumbnailList.push( thumb );
  } );
  
  $jsphotocradle.bind( 'changeActive', function () {
    $thumbSlider.stop( true, true ).animate( { left: calculate.sliderLeft() }, 800, 'easeOutExpo' );
  } );
  
  var getVisibleRange = function () {
    var visibleRange = [ jsphotocradle.pointer.active - 2, jsphotocradle.pointer.active + 2 ];
    
    if ( visibleRange[1] >= thumbnailList.length ) 
      visibleRange = [ ( thumbnailList.length - 5 ), ( thumbnailList.length - 1 ) ];
      
    if ( visibleRange[0] < 0 ) 
      visibleRange = [ 0, 4 ];
    
    return visibleRange;
  };
  
  var updateThumbnailsOpacity = (function () {
    var visibleRange = getVisibleRange();
    
    $.each( thumbnailList, function ( i, thumb ) {
      // prevent from animating invisible thumbnails
      if ( $thumbContainer.css( 'overflow' ) == 'hidden' )
        if ( i < visibleRange[0] || i > visibleRange[1] )
          return;
          
      thumb.$element.stop( true, false ).animate( { opacity: calculate.thumbOpacity( i ) }, 800 );
    } );
    
    return arguments.callee;
  })();
  
  $jsphotocradle.bind( 'changeActive', updateThumbnailsOpacity );
  
  calculate.sliderLeft = function() {
    var shift = jsphotocradle.$element.offset().left + jsphotocradle.options.borderWeight;
    var left = 
      thumbnailList[ jsphotocradle.pointer.active ]
      ? (
        Math.round( jsphotocradle.sizes.preview.width / 2 ) 
        - parseInt( thumbnailList[ jsphotocradle.pointer.active ].$element.css( 'left' ) ) 
        - Math.round( jsphotocradle.sizes.thumbnail.width / 2 )
        + shift
      )
      : 0
    ;
    var minLeft = shift;
    left = left > minLeft ? minLeft : left;
    var maxLeft = -1 * ( $thumbSlider.width() - jsphotocradle.sizes.preview.width ) + shift;
    left = left < maxLeft ? maxLeft : left;
    
    return left;
  };
  
  // update containers size and position on window resize
  var updatePosition = (function () {
    $thumbRails.css({
      left: -1 * ( jsphotocradle.$element.offset().left + jsphotocradle.options.borderWeight ),
      width: $( window ).width()
    });
        
    $thumbSlider.css({
      left: calculate.sliderLeft()
    });
    
    return arguments.callee;
  })();
    
  $jsphotocradle.bind( 'resize', function () { updatePosition(); } );
  
  lr.expanded = false;
  // add behaviour to thumbnails rails
  $thumbRails
    .mouseenter(function() {
      var expandThumbnails = function () {
        $thumbContainer.css( { overflow: 'visible' } );
        
        // show all thubnails on mouseenter
        $.each( thumbnailList, function ( i, thumb ) {
          var visibleRange = getVisibleRange();
          
          if ( i >= visibleRange[0] && i <= visibleRange[1] )
            return;
            
          thumb.$element.stop( true, false ).css( { opacity: 0 } );
          
          setTimeout( function () {
            thumb.$element.animate( { opacity: calculate.thumbOpacity( i ) }, 800 );
          }, Math.abs( i - jsphotocradle.pointer.active ) * 50 );
        } );
        
        setTimeout( function () {
          $.each( thumbnailList, function ( i, thumb ) {
            thumb.$element.mouseenter( function() {
              hoverThumbIndex = i;
              updateThumbnailsOpacity();
            } );
          } );
        }, 800 );
      };
      
      lr.expanded = true;
      setTimeout( function () { if ( lr.expanded ) expandThumbnails(); }, 100 );
    } )
    .mouseleave( function() {
      var collapseThumbnails = function () {
        $.each( thumbnailList, function ( i, thumb ) {
          thumb.$element.unbind( 'mouseenter' );
        } );
        
        hoverThumbIndex = jsphotocradle.pointer.active;
        updateThumbnailsOpacity();
        
        $thumbContainer.css( { overflow: 'hidden' } );
      };
      
      lr.expanded = false;
      setTimeout( function () { if ( !lr.expanded ) collapseThumbnails(); }, 100 );
    } );
};

//init layers order
$.jsphotocradle.layer.originalShader = null;
$.jsphotocradle.layer.original = null;
$.jsphotocradle.layer.originalControl = null;
$.jsphotocradle.layer.originalLoader = null;

// original layer
$.jsphotocradle.layer.original = function( jsphotocradle, $layerElement ) {
  var setWinBorder = 10;
  var lr = this;
  var active = false;
  
  var calculateOriginalDimentions = function( originalWidth, originalHeight ) {
    var winWidth = $(window).width() - setWinBorder * 2;
    var winHeight = $(window).height() - setWinBorder * 2;
    var winRatio = winWidth / winHeight;
    var origRatio = originalWidth / originalHeight;
    //console.log(winRatio + ' ? ' + origRatio);
    
    if ( winRatio >= origRatio ) {
      var fullWidth = winHeight * origRatio;
      var fullHeight = winHeight;
      var absLeft = ( winWidth - fullWidth ) / 2;
      var absTop = 0 ;
      
    } else {
      var fullWidth = winWidth;
      var fullHeight = winWidth / origRatio;
      var absLeft = 0;
      var absTop = ( winHeight - fullHeight ) / 2;
    };
    
    var fullLeft = absLeft + setWinBorder;
    var fullTop = absTop + setWinBorder;
    
    return { width: fullWidth, height: fullHeight, left: fullLeft, top: fullTop };
  };
  
  var switchOriginal = function( options ) {
    if ( lr.original != undefined ) {
      lr.original.stop = true;
      lr.original.$element.detach();
    };
    
    if ( lr.preview != undefined ) {
      lr.preview.stop = true;
      lr.preview.$element.detach();
    }
      
    lr.original = jsphotocradle.getFillImage( 'original', 'active' );
    lr.preview = jsphotocradle.getFillImage( 'preview', 'active' )
      .ready( function( preview ) {
        if ( preview.stop )
          return;
          
        var origDim = calculateOriginalDimentions( preview.image.width, preview.image.height );
        
        preview.$element
          .css({
            position: 'fixed',
            boxShadow: '0 0 20px #000',
            opacity: options.opacityStart ? options.opacityStart : 1,
            width: options.widthStart ? options.widthStart : origDim.width,
            height: options.heightStart ? options.heightStart : origDim.height,
            left: options.leftStart ? options.leftStart : ( 
              options.leftStartDiff ? origDim.left + options.leftStartDiff : origDim.left
            ),
            top: options.topStart ? options.topStart : ( 
              options.topStartDiff ? origDim.top + options.topStartDiff : origDim.top
            )
          })
          .appendTo( $layerElement )
          .animate( {
            opacity: 1,
            width: origDim.width,
            height: origDim.height,
            left: origDim.left,
            top: origDim.top
          }, {
            duration: 300, 
            easing: 'easeOutExpo',
            
            step: function( now, fx ) {
              if ( fx.prop == 'width' ) {
                preview.setSize( fx.now, 0 );
                
              } else if ( fx.prop == 'height' ) {
                preview.setSize( 0, fx.now );
              };
            },
            
            complete: function() {
              if ( !active )
                return;
                
              $( jsphotocradle ).triggerHandler( "originalPreview" );
              
              lr.original.ready( function( original ) {
                if ( original.stop )
                  return;
                
                $( jsphotocradle ).triggerHandler( "originalReady" );
                
                // var origDim = calculateOriginalDimentions( original.image.width, original.image.height );
                
                original
                  .setSize( origDim.width, origDim.height )
                  .$element
                    .css({
                      position: 'fixed',
                      left: origDim.left,
                      top: origDim.top
                    })
                    .hide()
                    .insertAfter( preview.$element )
                    .fadeIn( 3000 )
                    .click( function() {
                      $( jsphotocradle ).triggerHandler( "originalClose" );
                    });
              });
            }
          });
      });
      
      // upate size and position on window resize
      $(window).resize(function () {
        var origDim = calculateOriginalDimentions( lr.original.image.width, lr.original.image.height );

        $.each([ lr.original, lr.preview ], function( i, item ) {
          item
            .setSize( origDim.width, origDim.height )
            .$element.css({
              left: origDim.left,
              top: origDim.top
            });
        });
      });
  };
  
  $( jsphotocradle )
    // react on preview click
    .bind( 'previewClick', function() {
      $( jsphotocradle ).triggerHandler( "originalOpen" );
    })
    
    // react on original open
    .bind( 'originalOpen', function() {
      active = true;
      
      switchOriginal( {
        widthStart: jsphotocradle.sizes.preview.width,
        heightStart: jsphotocradle.sizes.preview.height,
        leftStart: jsphotocradle.$element.offset().left - $( document.body ).scrollLeft(),
        topStart: jsphotocradle.$element.offset().top - $( document.body ).scrollTop(),
        opacityStart: 0.1
      } );
    })
    
    // react on control click
    .bind( 'changeActive', function() {
      if ( !active)
        return;
        
      // next slide
      if ( jsphotocradle.pointer.preactive == jsphotocradle.pointer.previous ) {
          switchOriginal( {
              leftStartDiff: $( window ).width() / 5,
              opacityStart: 0.1
          } );
      
      // previous slide
      } else if ( jsphotocradle.pointer.preactive == jsphotocradle.pointer.next ) {
          switchOriginal( {
              leftStartDiff: $( window ).width() / 5 * -1,
              opacityStart: 0.1
          } );
      };
    })
    
    // react on original close
    .bind( "originalClose", function() {
      active = false;
      lr.original.stop = lr.preview.stop = true;
      
      lr.original.$element.detach();
      lr.preview.$element.fadeOut( function() { $(this).detach(); } );
    } );
};

// shader layer
$.jsphotocradle.layer.originalShader = function( jsphotocradle, $layerElement ) {
  var $shader = $( '<div/>' )
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
    .appendTo($layerElement)
    
    .click( function() {
      $( jsphotocradle ).triggerHandler( "originalClose" );
    } );
  
  var updateDim = function() {
    $shader.filter( ':visible' ).css({
      width: $(window).width(),
      height: $(window).height()
    });
  };
  
  var defaultBodyOverflow = $( document.body ).css( 'overflow' );
  
  $( jsphotocradle ).bind( "originalOpen", function() {
    // $( document.body ).css( { overflow: 'hidden' } );
    $shader.show();
    updateDim();
    $shader.animate({ opacity: 0.3 }, 'slow' );
  } );
  
  $( jsphotocradle ).bind( "originalClose", function() {
    $shader.animate({ opacity: 0 }, function() {
      $( this ).hide();
      // $( document.body ).css( { overflow: defaultBodyOverflow } );
    } );
  } );
  
  // react on window resize
  $( window ).resize( function() {updateDim(); } );
};

// fullscreen controls
$.jsphotocradle.layer.originalControl = function( jsphotocradle, $layerElement ) {
    var active = false;
    
  //control next
  var $controlNext = $( '<div/>' )
    .addClass( 'control-next' )
    .css({
            position: 'fixed',
            cursor: 'pointer'
        })
    .hide()
    .appendTo( $layerElement )
    .click( function() {
      jsphotocradle.setActive( jsphotocradle.pointer.next );
    });
   
  //control previous
  var $controlPrev = $( '<div/>' )
    .addClass( 'control-prev' )
    .css({
            position: 'fixed',
            cursor: 'pointer'
        })
    .hide()
    .appendTo( $layerElement )
    .click( function() {
      jsphotocradle.setActive( jsphotocradle.pointer.previous );
    });
  
  var updateDim = (function() {
    $controlNext.css({
      left: Math.round( $( window ).width() - $controlNext.width() - ( $( window ).width() / 20 ) ),
      top: Math.round( ( $( window ).height() - $controlNext.height() ) / 2 )
    });
    
    $controlPrev.css({
      left: Math.round( $( window ).width() / 20 ),
      top: Math.round( ( $( window ).height() - $controlNext.height() ) / 2 )
    });
    
    return arguments.callee;
  })();
    
    var $controls = $([$controlNext.get(0), $controlPrev.get(0)]);
  
    $( jsphotocradle ).bind( 'originalReady', function() { 
        if (!active) {
            active = true;
            updateDim();
            
            setTimeout(function () {
                if (active)
                    $controls
                        .stop(true, true)
                        .show()
                        .css({opacity: 0})
                        .animate({opacity: 0.5}, 'slow'); 
            }, 1000);
        };
    } );
    
    $controls
        .mouseenter(function () {
            $(this)
                .stop(true, true)
                .css({opacity: 0.5})
                .animate({opacity: 1}, 'slow'); 
        })
        .mouseleave(function () {
            $(this)
                .stop(true, true)
                .css({opacity: 1})
                .animate({opacity: 0.5}, 'slow'); 
        });
  
  $( jsphotocradle ).bind('originalClose', function () { 
    active = false;
    $controls.stop(true, true).fadeOut();
  });
  
  // react on window resize
  $( window ).resize( function() { updateDim(); } );
};

// fullscreen loader
$.jsphotocradle.layer.originalLoader = function( jsphotocradle, $layerElement ) {
  var $loader = $( '<div/>' )
    .addClass( 'loader' )
    .css({position: 'fixed'})
    .hide()
    .appendTo( $layerElement );
  
  var updateDim = (function() {
    $loader.css({
      left: Math.round( ( $( window ).width() - $loader.width() ) / 2 ),
      top: Math.round( ( $( window ).height() - $loader.height() ) / 2 )
    });
    
    return arguments.callee;
  })();
  
  //$( jsphotocradle ).bind( 'originalOpen', function() { updateDim(); $loader.stop(true, true).show(); } );
  $( jsphotocradle ).bind( 'originalClose', function() { $loader.stop(true, true).hide(); } );
  //$( jsphotocradle ).bind( 'originalPreload', function() { $loader.stop(true, true).show(); } );
  $( jsphotocradle ).bind( 'originalPreview', function() { $loader.stop(true, true).show(); } );
  $( jsphotocradle ).bind( 'originalReady', function() { setTimeout(function() {$loader.stop(true, true).fadeOut();}, 1000); } );
  
  // react on window resize
  $( window ).resize( function() { updateDim(); } );
};

var flickrAPIKey = 'f53c32a7c8812bfe7d8e7c96ff0214e1';

// flickr service
$.jsphotocradle.service.flickr = function ( params, loadHandler ) {
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

// picasa service
$.jsphotocradle.service.picasa = function ( params, loadHandler ) {
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