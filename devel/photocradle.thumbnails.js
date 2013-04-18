(function( $ ) {

$.photoCradle.layer.fullThumbnails = null;
$.photoCradle.layer.briefThumbnails = null;

// shared functions

// thumbnails layer
$.photoCradle.layer.briefThumbnails = function( photoCradle, $layerElement ) {
	var lr = this;
	
	var $thumbPlane = $( '<div/>' )
		.css({
			position: 'absolute',
			overflow: 'hidden',
			left: photoCradle.options.borderWeight,
			top: photoCradle.sizes.preview.height + photoCradle.options.borderWeight,
			width: photoCradle.sizes.preview.width,
			height: photoCradle.sizes.thumbnail.height + photoCradle.options.borderWeight * 2
		})
		.appendTo( $layerElement );
		
	var $thumbSlider = $( '<div/>' )
		.css({
			position: 'absolute', 
			left: 0, top: 0,
			width: photoCradle.sources.length * ( photoCradle.sizes.thumbnail.width + photoCradle.options.borderWeight ) - photoCradle.options.borderWeight,
			height: photoCradle.sizes.thumbnail.height + photoCradle.options.borderWeight * 2
		})
		.appendTo($thumbPlane);
	
	// create thumbnails elements
	
	var thumbnailList = [];
	$( photoCradle.sources ).each( function( i, img_opts ) {
		var thumb = photoCradle.getFillImage( 'thumbnail', i );
		
		thumb.$element
			.css({
				left: i * ( photoCradle.sizes.thumbnail.width + photoCradle.options.borderWeight ),
				top: photoCradle.options.borderWeight,
				cursor: 'pointer'
			})
			.appendTo( $thumbSlider );
		
		// react on preview click
		thumb.$element.click(function() {
			photoCradle.setActive(i);
		});
		
		thumbnailList.push( thumb );
	} );
	
	var calculate = {
		sliderLeft: function() {
			var left = 
				Math.round( photoCradle.sizes.preview.width / 2 ) 
				- parseInt( thumbnailList[ photoCradle.pointer.active ].$element.css( 'left' ) ) 
				- Math.round( photoCradle.sizes.thumbnail.width / 2 );
			var minLeft = 0;
			left = left > minLeft ? minLeft : left;
			var maxLeft = -1 * ( $thumbSlider.width() - photoCradle.sizes.preview.width );
			left = left < maxLeft ? maxLeft : left;
			
			return left;
		}
	};
	
    $thumbSlider.css({left: calculate.sliderLeft()});
	
    // react on photoCradle change of active image
	var centralizeActive = function() {
    if (lr.expanded)
      return;
      
    $thumbSlider
      .stop( true, true )
      .animate({
        left: calculate.sliderLeft()
      }, 800, 'easeOutExpo');
	};
	
	$( photoCradle ).bind( 'changeActive', function() {
		centralizeActive();
	});
	
	$( photoCradle ).bind( 'briefThumbsLeave fullThumbsLeave', function() {
		setTimeout( centralizeActive, 100);
	});
	
	$thumbPlane
		.mouseenter(function() { $( photoCradle ).triggerHandler( "briefThumbsEnter" ); } )
		.mouseleave(function() { $( photoCradle ).triggerHandler( "briefThumbsLeave" ); } );
	
  lr.expanded = false;
  
	$( photoCradle )	
		.bind( "fullThumbsEnter fullThumbsLeave briefThumbsEnter briefThumbsLeave", function() { lr.expanded = !lr.expanded; } );
};


$.photoCradle.layer.fullThumbnails = function( photoCradle, $layerElement ) {
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
            left: -1 * photoCradle.$element.offset().left,
            top: photoCradle.sizes.preview.height + photoCradle.options.borderWeight,
            width: $( window ).width(),
            height: photoCradle.sizes.thumbnail.height + photoCradle.options.borderWeight * 2
        });
            
	    $thumbSlider.css({
            left: photoCradle.$element.offset().left, 
            top: 0,
            width: photoCradle.sources.length * ( photoCradle.sizes.thumbnail.width + photoCradle.options.borderWeight ) + photoCradle.options.borderWeight,
            height: photoCradle.sizes.thumbnail.height + photoCradle.options.borderWeight * 2
        });
        
        return arguments.callee;
	})();
    
    $(photoCradle).bind('resize', function () { updatePosition(); });
    
	// create thumbnails elements
	
	var thumbnailList = [];
	$( photoCradle.sources ).each( function( i, img_opts ) {
		var thumb = photoCradle.getFillImage( 'thumbnail', i );
		
		thumb.$element
			.css({
				left: i * ( photoCradle.sizes.thumbnail.width + photoCradle.options.borderWeight ) + photoCradle.options.borderWeight,
				top: photoCradle.options.borderWeight,
				cursor: 'pointer'
			})
			.appendTo( $thumbSlider );
		
		// react on preview click
		thumb.$element.click(function() {
			photoCradle.setActive(i);
		});
		
		thumbnailList.push( thumb );
	} );
	
	var calculate = {
		sliderLeft: function() {
			var left = 
				Math.round( photoCradle.sizes.preview.width / 2 ) 
				- parseInt( thumbnailList[ photoCradle.pointer.active ].$element.css( 'left' ) ) 
				- Math.round( ( photoCradle.sizes.thumbnail.width ) / 2 )
				+ photoCradle.options.borderWeight;
			var minLeft = 0;
			left = left > minLeft ? minLeft : left;
			var maxLeft = -1 * ( $thumbSlider.width() - photoCradle.sizes.preview.width - photoCradle.options.borderWeight * 2 );
			left = left < maxLeft ? maxLeft : left;
			
			return left;
		}
	};
	
    $thumbSlider.css({left: calculate.sliderLeft() + photoCradle.$element.offset().left});
	
	// react on photoCradle change of active image
	$( photoCradle ).bind( 'changeActive', function() {
    if ( !lr.expanded )
      $thumbSlider.css({
        left: calculate.sliderLeft() + photoCradle.$element.offset().left
      });
	});
	
	$thumbPlane
		.mouseenter(function() { $( photoCradle ).triggerHandler( "fullThumbsEnter" ); } )
		.mouseleave(function() { $( photoCradle ).triggerHandler( "fullThumbsLeave" ); } );
	
    lr.expanded = false;

    $( photoCradle ).bind( "fullThumbsEnter fullThumbsLeave briefThumbsEnter briefThumbsLeave", function() { lr.expanded = !lr.expanded; } );

    $( photoCradle ).bind( 'briefThumbsEnter', function() {
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

    $( photoCradle ).bind( 'fullThumbsEnter', function() {
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

    $( photoCradle ).bind( 'briefThumbsLeave fullThumbsLeave', function() {
        var fadeOut = function() {
            if ( lr.expanded )
            return;

            $thumbPlane
                .stop( true, true )
                .animate({ opacity: 0 }, 300, function() {
                    $thumbPlane.css( { visibility: 'hidden' } );
                    $thumbSlider.css( {
                        left: calculate.sliderLeft() + photoCradle.$element.offset().left
                    } );
                } );
        };

        setTimeout( fadeOut, 100);
    });
};

})( jQuery );