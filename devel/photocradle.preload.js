(function( $ ) {

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

})( jQuery );