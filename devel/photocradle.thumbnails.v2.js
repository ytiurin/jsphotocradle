(function( $ ) {

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

})( jQuery );