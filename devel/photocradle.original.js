(function( $ ) {

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

})( jQuery );