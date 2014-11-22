/**
 * photocradle.js
 * Javascript image gallery that delivers photos you store on services like Flickr or Picasa to your personal website or blog.
 * http://yevhentiurin.github.com/photocradle/
 *
 * Copyright (c) 2013 Yevhen Tiurin
 * Licensed under the LGPL Version 3 license.
 * http://www.gnu.org/licenses/lgpl.txt
 *
 * Date: November 22, 2014
 **/

(function( $ ) {

var debug = false;
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

// preview layer
$.photocradle.layer.preview = function( photocradle, $layerElement ) {
  var lr = this;
  
  lr.preview = photocradle.getFillImage( 'preview', 'active' );
  
  var $frameElement = $( '<div/>' )
    .css({
      position: 'relative',
      overflow: 'hidden',
      left: photocradle.options.borderWeight,
      top: photocradle.options.borderWeight,
      width: photocradle.sizes.preview.width,
      height: photocradle.sizes.preview.height
    })
    .mouseenter( function() {
      $( photocradle ).trigger( 'previewMouseEnter' );
    })
    .mouseleave( function() {
      $( photocradle ).trigger( 'previewMouseLeave' );
    })
    .append( lr.preview.$element );
    
  var slidePreviews = function( direction ) {
    if ( lr.preview != undefined ) {
      lr.preview.stop = true;

      var oldPreview = lr.preview;
      
      oldPreview.$element
        .stop(true, true)
        .animate({
          left: ( photocradle.sizes.preview.width + parseInt( photocradle.options.borderWeight * 5 )) * (direction == 'left' ? -1 : 1)
        }, 300, 'easeOutExpo', function() {
          oldPreview.$element.detach();
        });
    }

    lr.preview = photocradle.getFillImage( 'preview', 'active' )
      .ready( function( preview ) {
        if ( preview.stop )
          return;
          
        preview
          .setSize( photocradle.sizes.preview.width, photocradle.sizes.preview.height )
          .$element
            .appendTo( $frameElement )
            .css({ 
              left: ( photocradle.sizes.preview.width + parseInt( photocradle.options.borderWeight * 5 ) ) * (direction == 'left' ? 1 : -1)
            })
            .stop(true, true)
            .animate( { left: 0 }, 300, 'easeOutExpo' );
      } );
  };
    
  // react on image change
  $( photocradle ).bind( 'changeActive', { photocradle: photocradle }, function( e ) {
    var photocradle = e.data.photocradle;
    
    // slide left
    if ( photocradle.pointer.preactive == photocradle.pointer.previous ) {
      slidePreviews( 'left' );
      return;
  
    // slide right
    } else if ( photocradle.pointer.preactive == photocradle.pointer.next ) {
    slidePreviews( 'right' );
      return;
    };

    // fade in
    lr.preview.$element.detach();
    
    lr.preview = photocradle.getFillImage( 'preview', 'active' )
      .ready( function( preview ) {
        preview
          .setSize( photocradle.sizes.preview.width, photocradle.sizes.preview.height )
          .$element
            .hide()
            .appendTo( $frameElement )
            .fadeIn();
      } );
  });
  
  $frameElement.appendTo($layerElement);
};

// preview controls
$.photocradle.layer.previewControl = function( photocradle, $layerElement ) {
  var $photocradle = $( photocradle );
  
  var $controlPreview = $( '<div/>' )
    .css({
      position: 'absolute',
      cursor: 'pointer',
      left: Math.round( photocradle.sizes.preview.width / 4 ),
      top: photocradle.options.borderWeight,
      width: Math.round( photocradle.sizes.preview.width / 2 ),
      height: photocradle.sizes.preview.height,
      // ie hack
      background: '#fff',
      opacity: 0
    })
    .click( function() {
      $photocradle.trigger( 'previewClick' );
    })
    .appendTo( $layerElement );
  
  var $controlNext = $( '<div/>' )
    .addClass( 'control-next' )
    .css({
      position: 'absolute',
      cursor: 'pointer'
    })
        
    .click( function () { $photocradle.trigger( 'previewControlNextClick' ); })
    .mouseenter( function () { $photocradle.trigger( 'previewControlNextMouseEnter' ); })
    .mouseleave( function () { $photocradle.trigger( 'previewControlNextMouseLeave' ); })
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
        
    .click( function () { $photocradle.trigger( 'previewControlPreviousClick' ); })
    .mouseenter( function () { $photocradle.trigger( 'previewControlPreviousMouseEnter' ); })
    .mouseleave( function () { $photocradle.trigger( 'previewControlPreviousMouseLeave' ); })
        
    .appendTo( $layerElement )
  ;
    
  if (photocradle.sizes.preview.height <= 240) {
    $layerElement.addClass('mini');
  };
  
  $controlNext.css({
    left: Math.round(photocradle.sizes.preview.width - $controlNext.width() + photocradle.options.borderWeight),
    top: Math.round((photocradle.sizes.preview.height - $controlNext.height()) / 2 + photocradle.options.borderWeight)
  });

  $controlPrev.css({
    left: photocradle.options.borderWeight,
    top: Math.round((photocradle.sizes.preview.height - $controlNext.height()) / 2 + photocradle.options.borderWeight)
  });
  
  // controls behaviour
  $photocradle
    .bind( 'previewControlNextClick', function () {
      photocradle.setActive( photocradle.pointer.next );
    })
    .bind( 'previewControlPreviousClick', function () {
      photocradle.setActive( photocradle.pointer.previous );
    })
  ;
};

// preload layer
$.photocradle.layer.preload = function( photocradle, $layerElement ) {
  var lr = this;
  var $photocradle = $( photocradle );
  
  var thumb;
  var pointerName;
  var opRand;
  var bringThumb = function () {
    var thisOpRand = opRand;
    
    if ( thumb != undefined )
      thumb.$element.detach();
            
    var previewImage = photocradle.getFillImage( 'preview', photocradle.pointer[pointerName] );
    
    previewImage.ready( function () {
      if ( thisOpRand != opRand )
        return;
          
      thumb = photocradle.getFillImage( 'thumbnail', photocradle.pointer[pointerName] );
      
      if ( pointerName == 'next' ) {
        var thumbLeft = photocradle.sizes.preview.width + photocradle.options.borderWeight * 4;
        var thumbAnimDir = 1;
      
      } else if ( pointerName == 'previous' ) {
        var thumbLeft = ( photocradle.sizes.thumbnail.width + photocradle.options.borderWeight * 2 ) * -1;
        var thumbAnimDir = -1;
      };
      
      thumb.$element
        .appendTo( $layerElement )
        .css({
          left: thumbLeft + photocradle.options.borderWeight * 8 * thumbAnimDir,
          top: ( photocradle.sizes.preview.height - photocradle.sizes.thumbnail.height ) / 2 + photocradle.options.borderWeight,
          opacity: 0
        })
        .animate({ 
          left: thumbLeft, 
          opacity: 1 
        }, 800, 'easeOutExpo')
      ;
    } );
  };
  
  $photocradle
    .bind( 'previewControlNextMouseEnter previewControlNextClick', function () { pointerName = 'next'; opRand = Math.random(); bringThumb(); } )
    .bind( 'previewControlNextMouseLeave', function () { opRand = Math.random(); thumb.$element.detach(); })
    .bind( 'previewControlPreviousMouseEnter previewControlPreviousClick', function () { pointerName = 'previous'; opRand = Math.random(); bringThumb(); } )
    .bind( 'previewControlPreviousMouseLeave', function () { opRand = Math.random(); thumb.$element.detach(); })
  ;
};

// thumbnails layer
$.photocradle.layer.thumbnails = function( photocradle, $layerElement ) {
  var lr = this;
  var $photocradle = $( photocradle );
  var calculate = {};

  var $thumbContainer = $( '<div/>' )
    .css({
      position: 'absolute',
      overflow: 'hidden',
      left: photocradle.options.borderWeight,
      top: photocradle.sizes.preview.height + photocradle.options.borderWeight,
      width: photocradle.sizes.preview.width,
      height: photocradle.sizes.thumbnail.height + photocradle.options.borderWeight * 2
    })
    .appendTo( $layerElement );
  
  var $thumbRails = $( '<div/>' )
    .css({
      position: 'absolute',
      overflow: 'hidden',
      top: 0,
      height: photocradle.sizes.thumbnail.height + photocradle.options.borderWeight * 2
    })
    .appendTo( $thumbContainer );
    
  var $thumbSlider = $( '<div/>' )
    .css({
      position: 'absolute', 
      top: 0,
      width: photocradle.sources.length * ( photocradle.sizes.thumbnail.width + photocradle.options.borderWeight ) - photocradle.options.borderWeight,
      height: photocradle.sizes.thumbnail.height + photocradle.options.borderWeight * 2
    })
    .appendTo($thumbRails);
    
  // create thumbnails elements
  var thumbnailList = [];
  var hoverThumbIndex = photocradle.pointer.active;
  
  calculate.thumbOpacity = function ( i ) {
    var step = 0.1;
    var opacityByActive =  1 - ( Math.abs( i - photocradle.pointer.active ) * step );
    var opacityByHover =  1 - ( Math.abs( i - hoverThumbIndex ) * step );
    opacity = Math.max( opacityByActive, opacityByHover );
    opacity = Math.max( opacity, step );
    
    return opacity;
  };
    
  $( photocradle.sources ).each( function( i, img_opts ) {
    var thumb = photocradle.getFillImage( 'thumbnail', i );
    
    thumb.$element
      .css({
        left: i * ( photocradle.sizes.thumbnail.width + photocradle.options.borderWeight ),
        top: photocradle.options.borderWeight,
        opacity: 0,
        cursor: 'pointer'
      })
      .appendTo( $thumbSlider );
    
    // react on thumbnail click
    thumb.$element
      .click( function() {
          if ( i == photocradle.pointer.active )
              return;
          
          photocradle.setActive( i );
      } );
      
    thumbnailList.push( thumb );
  } );
  
  $photocradle.bind( 'changeActive', function () {
    $thumbSlider.stop( true, true ).animate( { left: calculate.sliderLeft() }, 800, 'easeOutExpo' );
  } );
  
  var getVisibleRange = function () {
    var visibleRange = [ photocradle.pointer.active - 2, photocradle.pointer.active + 2 ];
    
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
  
  $photocradle.bind( 'changeActive', updateThumbnailsOpacity );
  
  calculate.sliderLeft = function() {
    var shift = photocradle.$element.offset().left + photocradle.options.borderWeight;
    var left = 
      thumbnailList[ photocradle.pointer.active ]
      ? (
        Math.round( photocradle.sizes.preview.width / 2 ) 
        - parseInt( thumbnailList[ photocradle.pointer.active ].$element.css( 'left' ) ) 
        - Math.round( photocradle.sizes.thumbnail.width / 2 )
        + shift
      )
      : 0
    ;
    var minLeft = shift;
    left = left > minLeft ? minLeft : left;
    var maxLeft = -1 * ( $thumbSlider.width() - photocradle.sizes.preview.width ) + shift;
    left = left < maxLeft ? maxLeft : left;
    
    return left;
  };
  
  // update containers size and position on window resize
  var updatePosition = (function () {
    $thumbRails.css({
      left: -1 * ( photocradle.$element.offset().left + photocradle.options.borderWeight ),
      width: $( window ).width()
    });
        
    $thumbSlider.css({
      left: calculate.sliderLeft()
    });
    
    return arguments.callee;
  })();
    
  $photocradle.bind( 'resize', function () { updatePosition(); } );
  
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
          }, Math.abs( i - photocradle.pointer.active ) * 50 );
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
        
        hoverThumbIndex = photocradle.pointer.active;
        updateThumbnailsOpacity();
        
        $thumbContainer.css( { overflow: 'hidden' } );
      };
      
      lr.expanded = false;
      setTimeout( function () { if ( !lr.expanded ) collapseThumbnails(); }, 100 );
    } );
};

//init layers order
$.photocradle.layer.originalShader = null;
$.photocradle.layer.original = null;
$.photocradle.layer.originalControl = null;
$.photocradle.layer.originalLoader = null;

// original layer
$.photocradle.layer.original = function( photocradle, $layerElement ) {
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
      
    lr.original = photocradle.getFillImage( 'original', 'active' );
    lr.preview = photocradle.getFillImage( 'preview', 'active' )
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
                
              $( photocradle ).trigger( "originalPreview" );
              
              lr.original.ready( function( original ) {
                if ( original.stop )
                  return;
                
                $( photocradle ).trigger( "originalReady" );
                
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
                      $( photocradle ).trigger( "originalClose" );
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
  
  $( photocradle )
    // react on preview click
    .bind( 'previewClick', function() {
      $( photocradle ).trigger( "originalOpen" );
    })
    
    // react on original open
    .bind( 'originalOpen', function() {
      active = true;
      
      switchOriginal( {
        widthStart: photocradle.sizes.preview.width,
        heightStart: photocradle.sizes.preview.height,
        leftStart: photocradle.$element.offset().left - $( document.body ).scrollLeft(),
        topStart: photocradle.$element.offset().top - $( document.body ).scrollTop(),
        opacityStart: 0.1
      } );
    })
    
    // react on control click
    .bind( 'changeActive', function() {
      if ( !active)
        return;
        
      // next slide
      if ( photocradle.pointer.preactive == photocradle.pointer.previous ) {
          switchOriginal( {
              leftStartDiff: $( window ).width() / 5,
              opacityStart: 0.1
          } );
      
      // previous slide
      } else if ( photocradle.pointer.preactive == photocradle.pointer.next ) {
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
$.photocradle.layer.originalShader = function( photocradle, $layerElement ) {
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
      $( photocradle ).trigger( "originalClose" );
    } );
  
  var updateDim = function() {
    $shader.filter( ':visible' ).css({
      width: $(window).width(),
      height: $(window).height()
    });
  };
  
  var defaultBodyOverflow = $( document.body ).css( 'overflow' );
  
  $( photocradle ).bind( "originalOpen", function() {
    // $( document.body ).css( { overflow: 'hidden' } );
    $shader.show();
    updateDim();
    $shader.animate({ opacity: 0.3 }, 'slow' );
  } );
  
  $( photocradle ).bind( "originalClose", function() {
    $shader.animate({ opacity: 0 }, function() {
      $( this ).hide();
      // $( document.body ).css( { overflow: defaultBodyOverflow } );
    } );
  } );
  
  // react on window resize
  $( window ).resize( function() {updateDim(); } );
};

// fullscreen controls
$.photocradle.layer.originalControl = function( photocradle, $layerElement ) {
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
      photocradle.setActive( photocradle.pointer.next );
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
      photocradle.setActive( photocradle.pointer.previous );
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
  
    $( photocradle ).bind( 'originalReady', function() { 
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
  
  $( photocradle ).bind('originalClose', function () { 
    active = false;
    $controls.stop(true, true).fadeOut();
  });
  
  // react on window resize
  $( window ).resize( function() { updateDim(); } );
};

// fullscreen loader
$.photocradle.layer.originalLoader = function( photocradle, $layerElement ) {
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
  
  //$( photocradle ).bind( 'originalOpen', function() { updateDim(); $loader.stop(true, true).show(); } );
  $( photocradle ).bind( 'originalClose', function() { $loader.stop(true, true).hide(); } );
  //$( photocradle ).bind( 'originalPreload', function() { $loader.stop(true, true).show(); } );
  $( photocradle ).bind( 'originalPreview', function() { $loader.stop(true, true).show(); } );
  $( photocradle ).bind( 'originalReady', function() { setTimeout(function() {$loader.stop(true, true).fadeOut();}, 1000); } );
  
  // react on window resize
  $( window ).resize( function() { updateDim(); } );
};

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