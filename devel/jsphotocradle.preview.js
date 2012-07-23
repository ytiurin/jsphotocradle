(function( $ ) {

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

})( jQuery );