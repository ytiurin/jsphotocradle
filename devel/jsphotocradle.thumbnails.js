(function( $ ) {

$.jsphotocradle.layer.fullThumbnails = null;
$.jsphotocradle.layer.briefThumbnails = null;

// shared functions

// thumbnails layer
$.jsphotocradle.layer.briefThumbnails = function( jsphotocradle, $layerElement ) {
	var lr = this;
	
	var $thumbPlane = $( '<div/>' )
		.css({
			position: 'absolute',
			overflow: 'hidden',
			left: jsphotocradle.options.borderWeight,
			top: jsphotocradle.sizes.preview.height + jsphotocradle.options.borderWeight,
			width: jsphotocradle.sizes.preview.width,
			height: jsphotocradle.sizes.thumbnail.height + jsphotocradle.options.borderWeight * 2
		})
		.appendTo( $layerElement );
		
	var $thumbSlider = $( '<div/>' )
		.css({
			position: 'absolute', 
			left: 0, top: 0,
			width: jsphotocradle.sources.length * ( jsphotocradle.sizes.thumbnail.width + jsphotocradle.options.borderWeight ) - jsphotocradle.options.borderWeight,
			height: jsphotocradle.sizes.thumbnail.height + jsphotocradle.options.borderWeight * 2
		})
		.appendTo($thumbPlane);
	
	// create thumbnails elements
	
	var thumbnailList = [];
	$( jsphotocradle.sources ).each( function( i, img_opts ) {
		var thumb = jsphotocradle.getFillImage( 'thumbnail', i );
		
		thumb.$element
			.css({
				left: i * ( jsphotocradle.sizes.thumbnail.width + jsphotocradle.options.borderWeight ),
				top: jsphotocradle.options.borderWeight,
				cursor: 'pointer'
			})
			.appendTo( $thumbSlider );
		
		// react on preview click
		thumb.$element.click(function() {
			jsphotocradle.setActive(i);
		});
		
		thumbnailList.push( thumb );
	} );
	
	var calculate = {
		sliderLeft: function() {
			var left = 
				Math.round( jsphotocradle.sizes.preview.width / 2 ) 
				- parseInt( thumbnailList[ jsphotocradle.pointer.active ].$element.css( 'left' ) ) 
				- Math.round( jsphotocradle.sizes.thumbnail.width / 2 );
			var minLeft = 0;
			left = left > minLeft ? minLeft : left;
			var maxLeft = -1 * ( $thumbSlider.width() - jsphotocradle.sizes.preview.width );
			left = left < maxLeft ? maxLeft : left;
			
			return left;
		}
	};
	
    $thumbSlider.css({left: calculate.sliderLeft()});
	
    // react on jsphotocradle change of active image
	var centralizeActive = function() {
    if (lr.expanded)
      return;
      
    $thumbSlider
      .stop( true, true )
      .animate({
        left: calculate.sliderLeft()
      }, 800, 'easeOutExpo');
	};
	
	$( jsphotocradle ).bind( 'changeActive', function() {
		centralizeActive();
	});
	
	$( jsphotocradle ).bind( 'briefThumbsLeave fullThumbsLeave', function() {
		setTimeout( centralizeActive, 100);
	});
	
	$thumbPlane
		.mouseenter(function() { $( jsphotocradle ).triggerHandler( "briefThumbsEnter" ); } )
		.mouseleave(function() { $( jsphotocradle ).triggerHandler( "briefThumbsLeave" ); } );
	
  lr.expanded = false;
  
	$( jsphotocradle )	
		.bind( "fullThumbsEnter fullThumbsLeave briefThumbsEnter briefThumbsLeave", function() { lr.expanded = !lr.expanded; } );
};


$.jsphotocradle.layer.fullThumbnails = function( jsphotocradle, $layerElement ) {
	var lr = this;
	
	var $thumbPlane = $( '<div/>' )
		.addClass( 'thumbnails-plane' )
		.css({
			position: 'absolute',
			overflow: 'hidden',
			visibility: 'hidden',
            opacity: 0
        })
		.appendTo( $layerElement );
    
	var $thumbSlider = $( '<div/>' )
		.addClass( 'thumbnails-slider' )
		.css({position: 'absolute'})
		.appendTo($thumbPlane);
	
    // update position on window resize
	var updatePosition = (function () {
        $thumbPlane.css({
            left: -1 * jsphotocradle.$element.offset().left,
            top: jsphotocradle.sizes.preview.height + jsphotocradle.options.borderWeight,
            width: $( window ).width(),
            height: jsphotocradle.sizes.thumbnail.height + jsphotocradle.options.borderWeight * 2
        });
            
	    $thumbSlider.css({
            left: jsphotocradle.$element.offset().left, 
            top: 0,
            width: jsphotocradle.sources.length * ( jsphotocradle.sizes.thumbnail.width + jsphotocradle.options.borderWeight ) + jsphotocradle.options.borderWeight,
            height: jsphotocradle.sizes.thumbnail.height + jsphotocradle.options.borderWeight * 2
        });
        
        return arguments.callee;
	})();
    
    $(jsphotocradle).bind('resize', function () { updatePosition(); });
    
	// create thumbnails elements
	
	var thumbnailList = [];
	$( jsphotocradle.sources ).each( function( i, img_opts ) {
		var thumb = jsphotocradle.getFillImage( 'thumbnail', i );
		
		thumb.$element
			.css({
				left: i * ( jsphotocradle.sizes.thumbnail.width + jsphotocradle.options.borderWeight ) + jsphotocradle.options.borderWeight,
				top: jsphotocradle.options.borderWeight,
				cursor: 'pointer'
			})
			.appendTo( $thumbSlider );
		
		// react on preview click
		thumb.$element.click(function() {
			jsphotocradle.setActive(i);
		});
		
		thumbnailList.push( thumb );
	} );
	
	var calculate = {
		sliderLeft: function() {
			var left = 
				Math.round( jsphotocradle.sizes.preview.width / 2 ) 
				- parseInt( thumbnailList[ jsphotocradle.pointer.active ].$element.css( 'left' ) ) 
				- Math.round( ( jsphotocradle.sizes.thumbnail.width ) / 2 )
				+ jsphotocradle.options.borderWeight;
			var minLeft = 0;
			left = left > minLeft ? minLeft : left;
			var maxLeft = -1 * ( $thumbSlider.width() - jsphotocradle.sizes.preview.width - jsphotocradle.options.borderWeight * 2 );
			left = left < maxLeft ? maxLeft : left;
			
			return left;
		}
	};
	
    $thumbSlider.css({left: calculate.sliderLeft() + jsphotocradle.$element.offset().left});
	
	// react on jsphotocradle change of active image
	$( jsphotocradle ).bind( 'changeActive', function() {
    if ( !lr.expanded )
      $thumbSlider.css({
        left: calculate.sliderLeft() + jsphotocradle.$element.offset().left
      });
	});
	
	$thumbPlane
		.mouseenter(function() { $( jsphotocradle ).triggerHandler( "fullThumbsEnter" ); } )
		.mouseleave(function() { $( jsphotocradle ).triggerHandler( "fullThumbsLeave" ); } );
	
    lr.expanded = false;

    $( jsphotocradle ).bind( "fullThumbsEnter fullThumbsLeave briefThumbsEnter briefThumbsLeave", function() { lr.expanded = !lr.expanded; } );

    $( jsphotocradle ).bind( 'briefThumbsEnter', function() {
        var fadeIn = function() {
            if ( !lr.expanded )
                return;
            
            if ($thumbPlane.css('opacity') > 0)
                return;
            
            $thumbPlane
                .stop( true, true )
                .css( { visibility: 'visible' } )
                .animate( { opacity: 0.5 }, 300 );
        };

        setTimeout( fadeIn, 100 );
    });

    $( jsphotocradle ).bind( 'fullThumbsEnter', function() {
        var fadeIn = function() {
            if ( !lr.expanded )
                return;

            $thumbPlane
                .stop( true, true )
                .css( { visibility: 'visible' } )
                .animate( { opacity: 1 }, 300 );
        };

        setTimeout( fadeIn, 100 );
    });

    $( jsphotocradle ).bind( 'briefThumbsLeave fullThumbsLeave', function() {
        var fadeOut = function() {
            if ( lr.expanded )
            return;

            $thumbPlane
                .stop( true, true )
                .animate({ opacity: 0 }, 300, function() {
                    $thumbPlane.css( { visibility: 'hidden' } );
                    $thumbSlider.css( {
                        left: calculate.sliderLeft() + jsphotocradle.$element.offset().left
                    } );
                } );
        };

        setTimeout( fadeOut, 100);
    });
};

})( jQuery );