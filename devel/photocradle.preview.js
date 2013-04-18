(function( $ ) {

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
  
  $( photoCradle )
    // react on preview mouseenter
    .bind( 'previewMouseEnter', function() {
      previewZoomed = true;
      
      setTimeout( function() {
        if ( previewZoomed )
          previewZoom({
            width: Math.round( photoCradle.sizes.preview.width * 1.1 ),
            height: Math.round( photoCradle.sizes.preview.height * 1.1 ),
            left: -1 * Math.round( photoCradle.sizes.preview.width * 0.05 ),
            top: -1 * Math.round( photoCradle.sizes.preview.height * 0.05 )
          });
      }, 100);
    })
    
    // react on preview mouseleave
    .bind( 'previewMouseLeave', function() {
      previewZoomed = false;
      
      setTimeout( function() {
        if ( !previewZoomed )
          previewZoom({
            width: photoCradle.sizes.preview.width,
            height: photoCradle.sizes.preview.height,
            left: 0,
            top: 0
          })
      }, 100);
    });
  */
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
      // ,
      // opacity: 0
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
  
  // show/hide on hover
  // var $controls = $([$controlNext.get(0), $controlPrev.get(0)]);
  // var controlsVisible = false;
  
  // var handleControlOpacity = function ( opacity, $el ) {
    // setTimeout( function () {
      // opacity = controlsVisible ? opacity : 0;
      // ( $el ? $el : $controls ).animate( { opacity: opacity }, 200 );
    // }, 100);
  // };
  
  // $photoCradle
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