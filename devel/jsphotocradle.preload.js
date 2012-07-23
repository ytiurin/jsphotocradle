(function( $ ) {

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

})( jQuery );