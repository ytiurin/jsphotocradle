(function( $ ) {

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
  
  $( photocradle )
    // react on preview mouseenter
    .bind( 'previewMouseEnter', function() {
      previewZoomed = true;
      
      setTimeout( function() {
        if ( previewZoomed )
          previewZoom({
            width: Math.round( photocradle.sizes.preview.width * 1.1 ),
            height: Math.round( photocradle.sizes.preview.height * 1.1 ),
            left: -1 * Math.round( photocradle.sizes.preview.width * 0.05 ),
            top: -1 * Math.round( photocradle.sizes.preview.height * 0.05 )
          });
      }, 100);
    })
    
    // react on preview mouseleave
    .bind( 'previewMouseLeave', function() {
      previewZoomed = false;
      
      setTimeout( function() {
        if ( !previewZoomed )
          previewZoom({
            width: photocradle.sizes.preview.width,
            height: photocradle.sizes.preview.height,
            left: 0,
            top: 0
          })
      }, 100);
    });
  */
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
      // ,
      // opacity: 0
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
  
  // show/hide on hover
  // var $controls = $([$controlNext.get(0), $controlPrev.get(0)]);
  // var controlsVisible = false;
  
  // var handleControlOpacity = function ( opacity, $el ) {
    // setTimeout( function () {
      // opacity = controlsVisible ? opacity : 0;
      // ( $el ? $el : $controls ).animate( { opacity: opacity }, 200 );
    // }, 100);
  // };
  
  // $photocradle
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

})( jQuery );