(function( $ ) {

var debug = false;
debug = window.console != undefined ? debug : false;

//***************************
$.photoCradle = {
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
$.fn.photoCradle = function( params, options ) {
  var photoCradleParams = {}, photoCradleOptions = {};
  $.extend( photoCradleParams, $.photoCradle.params, params );
  $.extend( photoCradleOptions, $.photoCradle.options, options );
  
  return this.each( function () {
    var photoCradle = new PhotoCradle( this, photoCradleOptions );
    
    var sourcesLoadHandler = function ( sources ) {
      photoCradle.setSources( sources );
    };
    
    params.service 
      ? $.photoCradle.service[ params.service ]( params, sourcesLoadHandler )
      : sourcesLoadHandler( params.sources )
    ;
  } );
};

// photoCradle constructor
function PhotoCradle( element, options ) {
  var photoCradle = this;
  
  photoCradle.options = options;
  photoCradle.pointer = { active: 0, preactive: 0, next: 0, previous: 0 };
  photoCradle.$container = $( element );
  
  var initSizes = (function() {
    var sizes = {};
    sizes.previewWidth = Math.round( photoCradle.$container.width() - photoCradle.options.borderWeight * 2 );
    sizes.previewHeight = Math.round( ( photoCradle.$container.height() - photoCradle.options.borderWeight * 3 ) / 5 * 4 );
    sizes.thumbnailWidth = Math.round( ( photoCradle.$container.width() - photoCradle.options.borderWeight * 6 ) / 5 );
    sizes.thumbnailHeight = Math.round( ( photoCradle.$container.height() - photoCradle.options.borderWeight * 3 ) / 5 );
    
    return sizes;
  })();
  
  photoCradle.sizes = {
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
  
  photoCradle.$area = $( '<div class="photoCradle" />' )
    .appendTo( document.body );
  
  photoCradle.$element = $( '<div class="photoCradle-box" />' )
    .css( { 
      position: 'absolute',
      left: photoCradle.$container.offset().left,
      top: photoCradle.$container.offset().top,
      width: photoCradle.$container.width(), 
      height: photoCradle.$container.height()
    } )
    // make gallery container overlap other elements
    .mouseover( function () {
      var zIndex = 0;
      
      $( '*' ).each( function ( i, el ) {
        var elZIndex = parseInt( $( el ).css( 'z-index' ) );
        zIndex = elZIndex > zIndex ? elZIndex : zIndex;
      });
      
      photoCradle.$element.css( { zIndex: ++zIndex } );
    })
    .appendTo( photoCradle.$area );
  
  // update position on window resize
  $( window ).resize( function () {
    photoCradle.$element
      .css( { 
        left: photoCradle.$container.offset().left,
        top: photoCradle.$container.offset().top
      } );
      
    $( photoCradle ).trigger( 'resize' );
  });
  
  // add shader
  var $shader = $( '<div class="photoCradle-shader"/>' )
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
    .appendTo( photoCradle.$area );
    
  // show/hide shader on hover
  var shaderVisible = false;
  
  photoCradle.$element
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
  
  //debug ? console.log( photoCradle ) : null;
};

// photoCradle prototype
PhotoCradle.prototype = {
  // set image sources
  setSources: function( sources ) {
    var photoCradle = this;
    
    photoCradle.sources = sources;
    
    if ( !sources.length )
      return;
      
    photoCradle.setActive( photoCradle.options.firstImageIndex );
    
    // build layers
    var z = 0;
    $.each( $.photoCradle.layer, function( name, layer ) {
      var $layerElement = $( '<div/>' )
        .css({
          position: 'absolute',
          zIndex: 1000 + z
        })
        .addClass( name )
        .appendTo( photoCradle.$element );
        
      new layer( photoCradle, $layerElement );
      
      z++;
    });
  },
  
  // changes active image index
  setActive: function( active ) {
    var photoCradle = this;
    var pointer = photoCradle.pointer;
    
    pointer.preactive = pointer.active;
    pointer.active = parseInt( active );
    pointer.next = photoCradle.sources.length == ( pointer.active + 1 ) ? 0 : ( pointer.active + 1 );
    pointer.previous = -1 == ( pointer.active - 1 ) ? photoCradle.sources.length - 1 : pointer.active - 1;
    
    $( photoCradle ).trigger( "changeActive" );
    
    return this;
  },
  
  // creates and returns a fillimage
  getFillImage: function( type, ind ) {
    var photoCradle = this;
    ind = ind == 'active' ? photoCradle.pointer.active : ind;
    
    var fimage = new FillImage( photoCradle.sources[ ind ] ? photoCradle.sources[ ind ][ type ] : '' );
    fimage.setSize( photoCradle.sizes[ type ].width, photoCradle.sizes[ type ].height );
    
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
$.photoCradle.service.custom = function () {};

// preview layer
$.photoCradle.layer.preview = function( photoCradle, $layerElement ) {
  var lr = this;
  
  lr.preview = photoCradle.getFillImage( 'preview', 'active' );
  
  var $frameElement = $( '<div/>' )
    .css({
      position: 'relative',
      overflow: 'hidden',
      left: photoCradle.options.borderWeight,
      top: photoCradle.options.borderWeight,
      width: photoCradle.sizes.preview.width,
      height: photoCradle.sizes.preview.height
    })
    .mouseenter( function() {
      $( photoCradle ).trigger( 'previewMouseEnter' );
    })
    .mouseleave( function() {
      $( photoCradle ).trigger( 'previewMouseLeave' );
    })
    .append( lr.preview.$element );
    
  var slidePreviews = function( direction ) {
    if ( lr.preview != undefined ) {
      lr.preview.stop = true;

      var oldPreview = lr.preview;
      
      oldPreview.$element
        .stop(true, true)
        .animate({
          left: ( photoCradle.sizes.preview.width + parseInt( photoCradle.options.borderWeight * 5 )) * (direction == 'left' ? -1 : 1)
        }, 300, 'easeOutExpo', function() {
          oldPreview.$element.detach();
        });
    }

    lr.preview = photoCradle.getFillImage( 'preview', 'active' )
      .ready( function( preview ) {
        if ( preview.stop )
          return;
          
        preview
          .setSize( photoCradle.sizes.preview.width, photoCradle.sizes.preview.height )
          .$element
            .appendTo( $frameElement )
            .css({ 
              left: ( photoCradle.sizes.preview.width + parseInt( photoCradle.options.borderWeight * 5 ) ) * (direction == 'left' ? 1 : -1)
            })
            .stop(true, true)
            .animate( { left: 0 }, 300, 'easeOutExpo' );
      } );
  };
    
  // react on image change
  $( photoCradle ).bind( 'changeActive', { photoCradle: photoCradle }, function( e ) {
    var photoCradle = e.data.photoCradle;
    
    // slide left
    if ( photoCradle.pointer.preactive == photoCradle.pointer.previous ) {
      slidePreviews( 'left' );
      return;
  
    // slide right
    } else if ( photoCradle.pointer.preactive == photoCradle.pointer.next ) {
    slidePreviews( 'right' );
      return;
    };

    // fade in
    lr.preview.$element.detach();
    
    lr.preview = photoCradle.getFillImage( 'preview', 'active' )
      .ready( function( preview ) {
        preview
          .setSize( photoCradle.sizes.preview.width, photoCradle.sizes.preview.height )
          .$element
            .hide()
            .appendTo( $frameElement )
            .fadeIn();
      } );
  });
  
  $frameElement.appendTo($layerElement);
};

// preview controls
$.photoCradle.layer.previewControl = function( photoCradle, $layerElement ) {
  var $photoCradle = $( photoCradle );
  
  var $controlPreview = $( '<div/>' )
    .css({
      position: 'absolute',
      cursor: 'pointer',
      left: Math.round( photoCradle.sizes.preview.width / 4 ),
      top: photoCradle.options.borderWeight,
      width: Math.round( photoCradle.sizes.preview.width / 2 ),
      height: photoCradle.sizes.preview.height,
      // ie hack
      background: '#fff',
      opacity: 0
    })
    .click( function() {
      $photoCradle.trigger( 'previewClick' );
    })
    .appendTo( $layerElement );
  
  var $controlNext = $( '<div/>' )
    .addClass( 'control-next' )
    .css({
      position: 'absolute',
      cursor: 'pointer'
    })
        
    .click( function () { $photoCradle.trigger( 'previewControlNextClick' ); })
    .mouseenter( function () { $photoCradle.trigger( 'previewControlNextMouseEnter' ); })
    .mouseleave( function () { $photoCradle.trigger( 'previewControlNextMouseLeave' ); })
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
        
    .click( function () { $photoCradle.trigger( 'previewControlPreviousClick' ); })
    .mouseenter( function () { $photoCradle.trigger( 'previewControlPreviousMouseEnter' ); })
    .mouseleave( function () { $photoCradle.trigger( 'previewControlPreviousMouseLeave' ); })
        
    .appendTo( $layerElement )
  ;
    
  if (photoCradle.sizes.preview.height <= 240) {
    $layerElement.addClass('mini');
  };
  
  $controlNext.css({
    left: Math.round(photoCradle.sizes.preview.width - $controlNext.width() + photoCradle.options.borderWeight),
    top: Math.round((photoCradle.sizes.preview.height - $controlNext.height()) / 2 + photoCradle.options.borderWeight)
  });

  $controlPrev.css({
    left: photoCradle.options.borderWeight,
    top: Math.round((photoCradle.sizes.preview.height - $controlNext.height()) / 2 + photoCradle.options.borderWeight)
  });
  
  // controls behaviour
  $photoCradle
    .bind( 'previewControlNextClick', function () {
      photoCradle.setActive( photoCradle.pointer.next );
    })
    .bind( 'previewControlPreviousClick', function () {
      photoCradle.setActive( photoCradle.pointer.previous );
    })
  ;
};

// preload layer
$.photoCradle.layer.preload = function( photoCradle, $layerElement ) {
  var lr = this;
  var $photoCradle = $( photoCradle );
  
  var thumb;
  var pointerName;
  var opRand;
  var bringThumb = function () {
    var thisOpRand = opRand;
    
    if ( thumb != undefined )
      thumb.$element.detach();
            
    var previewImage = photoCradle.getFillImage( 'preview', photoCradle.pointer[pointerName] );
    
    previewImage.ready( function () {
      if ( thisOpRand != opRand )
        return;
          
      thumb = photoCradle.getFillImage( 'thumbnail', photoCradle.pointer[pointerName] );
      
      if ( pointerName == 'next' ) {
        var thumbLeft = photoCradle.sizes.preview.width + photoCradle.options.borderWeight * 4;
        var thumbAnimDir = 1;
      
      } else if ( pointerName == 'previous' ) {
        var thumbLeft = ( photoCradle.sizes.thumbnail.width + photoCradle.options.borderWeight * 2 ) * -1;
        var thumbAnimDir = -1;
      };
      
      thumb.$element
        .appendTo( $layerElement )
        .css({
          left: thumbLeft + photoCradle.options.borderWeight * 8 * thumbAnimDir,
          top: ( photoCradle.sizes.preview.height - photoCradle.sizes.thumbnail.height ) / 2 + photoCradle.options.borderWeight,
          opacity: 0
        })
        .animate({ 
          left: thumbLeft, 
          opacity: 1 
        }, 800, 'easeOutExpo')
      ;
    } );
  };
  
  $photoCradle
    .bind( 'previewControlNextMouseEnter previewControlNextClick', function () { pointerName = 'next'; opRand = Math.random(); bringThumb(); } )
    .bind( 'previewControlNextMouseLeave', function () { opRand = Math.random(); thumb.$element.detach(); })
    .bind( 'previewControlPreviousMouseEnter previewControlPreviousClick', function () { pointerName = 'previous'; opRand = Math.random(); bringThumb(); } )
    .bind( 'previewControlPreviousMouseLeave', function () { opRand = Math.random(); thumb.$element.detach(); })
  ;
};

// thumbnails layer
$.photoCradle.layer.thumbnails = function( photoCradle, $layerElement ) {
  var lr = this;
  var $photoCradle = $( photoCradle );
  var calculate = {};

  var $thumbContainer = $( '<div/>' )
    .css({
      position: 'absolute',
      overflow: 'hidden',
      left: photoCradle.options.borderWeight,
      top: photoCradle.sizes.preview.height + photoCradle.options.borderWeight,
      width: photoCradle.sizes.preview.width,
      height: photoCradle.sizes.thumbnail.height + photoCradle.options.borderWeight * 2
    })
    .appendTo( $layerElement );
  
  var $thumbRails = $( '<div/>' )
    .css({
      position: 'absolute',
      overflow: 'hidden',
      top: 0,
      height: photoCradle.sizes.thumbnail.height + photoCradle.options.borderWeight * 2
    })
    .appendTo( $thumbContainer );
    
  var $thumbSlider = $( '<div/>' )
    .css({
      position: 'absolute', 
      top: 0,
      width: photoCradle.sources.length * ( photoCradle.sizes.thumbnail.width + photoCradle.options.borderWeight ) - photoCradle.options.borderWeight,
      height: photoCradle.sizes.thumbnail.height + photoCradle.options.borderWeight * 2
    })
    .appendTo($thumbRails);
    
  // create thumbnails elements
  var thumbnailList = [];
  var hoverThumbIndex = photoCradle.pointer.active;
  
  calculate.thumbOpacity = function ( i ) {
    var step = 0.1;
    var opacityByActive =  1 - ( Math.abs( i - photoCradle.pointer.active ) * step );
    var opacityByHover =  1 - ( Math.abs( i - hoverThumbIndex ) * step );
    opacity = Math.max( opacityByActive, opacityByHover );
    opacity = Math.max( opacity, step );
    
    return opacity;
  };
    
  $( photoCradle.sources ).each( function( i, img_opts ) {
    var thumb = photoCradle.getFillImage( 'thumbnail', i );
    
    thumb.$element
      .css({
        left: i * ( photoCradle.sizes.thumbnail.width + photoCradle.options.borderWeight ),
        top: photoCradle.options.borderWeight,
        opacity: 0,
        cursor: 'pointer'
      })
      .appendTo( $thumbSlider );
    
    // react on thumbnail click
    thumb.$element
      .click( function() {
          if ( i == photoCradle.pointer.active )
              return;
          
          photoCradle.setActive( i );
      } );
      
    thumbnailList.push( thumb );
  } );
  
  $photoCradle.bind( 'changeActive', function () {
    $thumbSlider.stop( true, true ).animate( { left: calculate.sliderLeft() }, 800, 'easeOutExpo' );
  } );
  
  var getVisibleRange = function () {
    var visibleRange = [ photoCradle.pointer.active - 2, photoCradle.pointer.active + 2 ];
    
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
  
  $photoCradle.bind( 'changeActive', updateThumbnailsOpacity );
  
  calculate.sliderLeft = function() {
    var shift = photoCradle.$element.offset().left + photoCradle.options.borderWeight;
    var left = 
      thumbnailList[ photoCradle.pointer.active ]
      ? (
        Math.round( photoCradle.sizes.preview.width / 2 ) 
        - parseInt( thumbnailList[ photoCradle.pointer.active ].$element.css( 'left' ) ) 
        - Math.round( photoCradle.sizes.thumbnail.width / 2 )
        + shift
      )
      : 0
    ;
    var minLeft = shift;
    left = left > minLeft ? minLeft : left;
    var maxLeft = -1 * ( $thumbSlider.width() - photoCradle.sizes.preview.width ) + shift;
    left = left < maxLeft ? maxLeft : left;
    
    return left;
  };
  
  // update containers size and position on window resize
  var updatePosition = (function () {
    $thumbRails.css({
      left: -1 * ( photoCradle.$element.offset().left + photoCradle.options.borderWeight ),
      width: $( window ).width()
    });
        
    $thumbSlider.css({
      left: calculate.sliderLeft()
    });
    
    return arguments.callee;
  })();
    
  $photoCradle.bind( 'resize', function () { updatePosition(); } );
  
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
          }, Math.abs( i - photoCradle.pointer.active ) * 50 );
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
        
        hoverThumbIndex = photoCradle.pointer.active;
        updateThumbnailsOpacity();
        
        $thumbContainer.css( { overflow: 'hidden' } );
      };
      
      lr.expanded = false;
      setTimeout( function () { if ( !lr.expanded ) collapseThumbnails(); }, 100 );
    } );
};

//init layers order
$.photoCradle.layer.originalShader = null;
$.photoCradle.layer.original = null;
$.photoCradle.layer.originalControl = null;
$.photoCradle.layer.originalLoader = null;

// original layer
$.photoCradle.layer.original = function( photoCradle, $layerElement ) {
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
      
    lr.original = photoCradle.getFillImage( 'original', 'active' );
    lr.preview = photoCradle.getFillImage( 'preview', 'active' )
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
                
              $( photoCradle ).trigger( "originalPreview" );
              
              lr.original.ready( function( original ) {
                if ( original.stop )
                  return;
                
                $( photoCradle ).trigger( "originalReady" );
                
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
                      $( photoCradle ).trigger( "originalClose" );
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
  
  $( photoCradle )
    // react on preview click
    .bind( 'previewClick', function() {
      $( photoCradle ).trigger( "originalOpen" );
    })
    
    // react on original open
    .bind( 'originalOpen', function() {
      active = true;
      
      switchOriginal( {
        widthStart: photoCradle.sizes.preview.width,
        heightStart: photoCradle.sizes.preview.height,
        leftStart: photoCradle.$element.offset().left - $( document.body ).scrollLeft(),
        topStart: photoCradle.$element.offset().top - $( document.body ).scrollTop(),
        opacityStart: 0.1
      } );
    })
    
    // react on control click
    .bind( 'changeActive', function() {
      if ( !active)
        return;
        
      // next slide
      if ( photoCradle.pointer.preactive == photoCradle.pointer.previous ) {
          switchOriginal( {
              leftStartDiff: $( window ).width() / 5,
              opacityStart: 0.1
          } );
      
      // previous slide
      } else if ( photoCradle.pointer.preactive == photoCradle.pointer.next ) {
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
$.photoCradle.layer.originalShader = function( photoCradle, $layerElement ) {
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
      $( photoCradle ).trigger( "originalClose" );
    } );
  
  var updateDim = function() {
    $shader.filter( ':visible' ).css({
      width: $(window).width(),
      height: $(window).height()
    });
  };
  
  var defaultBodyOverflow = $( document.body ).css( 'overflow' );
  
  $( photoCradle ).bind( "originalOpen", function() {
    // $( document.body ).css( { overflow: 'hidden' } );
    $shader.show();
    updateDim();
    $shader.animate({ opacity: 0.3 }, 'slow' );
  } );
  
  $( photoCradle ).bind( "originalClose", function() {
    $shader.animate({ opacity: 0 }, function() {
      $( this ).hide();
      // $( document.body ).css( { overflow: defaultBodyOverflow } );
    } );
  } );
  
  // react on window resize
  $( window ).resize( function() {updateDim(); } );
};

// fullscreen controls
$.photoCradle.layer.originalControl = function( photoCradle, $layerElement ) {
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
      photoCradle.setActive( photoCradle.pointer.next );
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
      photoCradle.setActive( photoCradle.pointer.previous );
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
  
    $( photoCradle ).bind( 'originalReady', function() { 
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
  
  $( photoCradle ).bind('originalClose', function () { 
    active = false;
    $controls.stop(true, true).fadeOut();
  });
  
  // react on window resize
  $( window ).resize( function() { updateDim(); } );
};

// fullscreen loader
$.photoCradle.layer.originalLoader = function( photoCradle, $layerElement ) {
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
  
  //$( photoCradle ).bind( 'originalOpen', function() { updateDim(); $loader.stop(true, true).show(); } );
  $( photoCradle ).bind( 'originalClose', function() { $loader.stop(true, true).hide(); } );
  //$( photoCradle ).bind( 'originalPreload', function() { $loader.stop(true, true).show(); } );
  $( photoCradle ).bind( 'originalPreview', function() { $loader.stop(true, true).show(); } );
  $( photoCradle ).bind( 'originalReady', function() { setTimeout(function() {$loader.stop(true, true).fadeOut();}, 1000); } );
  
  // react on window resize
  $( window ).resize( function() { updateDim(); } );
};

var flickrAPIKey = 'f53c32a7c8812bfe7d8e7c96ff0214e1';

// flickr service
$.photoCradle.service.flickr = function ( params, loadHandler ) {
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
$.photoCradle.service.picasa = function ( params, loadHandler ) {
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