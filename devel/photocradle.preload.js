(function( $ ) {

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

})( jQuery );