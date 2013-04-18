(function( $ ) {

$.photocradle.layer.fullThumbnails = null;
$.photocradle.layer.briefThumbnails = null;

// shared functions

// thumbnails layer
$.photocradle.layer.briefThumbnails = function( photocradle, $layerElement ) {
	var lr = this;
	
	var $thumbPlane = $( '<div/>' )
		.css({
			position: 'absolute',
			overflow: 'hidden',
			left: photocradle.options.borderWeight,
			top: photocradle.sizes.preview.height + photocradle.options.borderWeight,
			width: photocradle.sizes.preview.width,
			height: photocradle.sizes.thumbnail.height + photocradle.options.borderWeight * 2
		})
		.appendTo( $layerElement );
		
	var $thumbSlider = $( '<div/>' )
		.css({
			position: 'absolute', 
			left: 0, top: 0,
			width: photocradle.sources.length * ( photocradle.sizes.thumbnail.width + photocradle.options.borderWeight ) - photocradle.options.borderWeight,
			height: photocradle.sizes.thumbnail.height + photocradle.options.borderWeight * 2
		})
		.appendTo($thumbPlane);
	
	// create thumbnails elements
	
	var thumbnailList = [];
	$( photocradle.sources ).each( function( i, img_opts ) {
		var thumb = photocradle.getFillImage( 'thumbnail', i );
		
		thumb.$element
			.css({
				left: i * ( photocradle.sizes.thumbnail.width + photocradle.options.borderWeight ),
				top: photocradle.options.borderWeight,
				cursor: 'pointer'
			})
			.appendTo( $thumbSlider );
		
		// react on preview click
		thumb.$element.click(function() {
			photocradle.setActive(i);
		});
		
		thumbnailList.push( thumb );
	} );
	
	var calculate = {
		sliderLeft: function() {
			var left = 
				Math.round( photocradle.sizes.preview.width / 2 ) 
				- parseInt( thumbnailList[ photocradle.pointer.active ].$element.css( 'left' ) ) 
				- Math.round( photocradle.sizes.thumbnail.width / 2 );
			var minLeft = 0;
			left = left > minLeft ? minLeft : left;
			var maxLeft = -1 * ( $thumbSlider.width() - photocradle.sizes.preview.width );
			left = left < maxLeft ? maxLeft : left;
			
			return left;
		}
	};
	
    $thumbSlider.css({left: calculate.sliderLeft()});
	
    // react on photocradle change of active image
	var centralizeActive = function() {
    if (lr.expanded)
      return;
      
    $thumbSlider
      .stop( true, true )
      .animate({
        left: calculate.sliderLeft()
      }, 800, 'easeOutExpo');
	};
	
	$( photocradle ).bind( 'changeActive', function() {
		centralizeActive();
	});
	
	$( photocradle ).bind( 'briefThumbsLeave fullThumbsLeave', function() {
		setTimeout( centralizeActive, 100);
	});
	
	$thumbPlane
		.mouseenter(function() { $( photocradle ).triggerHandler( "briefThumbsEnter" ); } )
		.mouseleave(function() { $( photocradle ).triggerHandler( "briefThumbsLeave" ); } );
	
  lr.expanded = false;
  
	$( photocradle )	
		.bind( "fullThumbsEnter fullThumbsLeave briefThumbsEnter briefThumbsLeave", function() { lr.expanded = !lr.expanded; } );
};


$.photocradle.layer.fullThumbnails = function( photocradle, $layerElement ) {
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
            left: -1 * photocradle.$element.offset().left,
            top: photocradle.sizes.preview.height + photocradle.options.borderWeight,
            width: $( window ).width(),
            height: photocradle.sizes.thumbnail.height + photocradle.options.borderWeight * 2
        });
            
	    $thumbSlider.css({
            left: photocradle.$element.offset().left, 
            top: 0,
            width: photocradle.sources.length * ( photocradle.sizes.thumbnail.width + photocradle.options.borderWeight ) + photocradle.options.borderWeight,
            height: photocradle.sizes.thumbnail.height + photocradle.options.borderWeight * 2
        });
        
        return arguments.callee;
	})();
    
    $(photocradle).bind('resize', function () { updatePosition(); });
    
	// create thumbnails elements
	
	var thumbnailList = [];
	$( photocradle.sources ).each( function( i, img_opts ) {
		var thumb = photocradle.getFillImage( 'thumbnail', i );
		
		thumb.$element
			.css({
				left: i * ( photocradle.sizes.thumbnail.width + photocradle.options.borderWeight ) + photocradle.options.borderWeight,
				top: photocradle.options.borderWeight,
				cursor: 'pointer'
			})
			.appendTo( $thumbSlider );
		
		// react on preview click
		thumb.$element.click(function() {
			photocradle.setActive(i);
		});
		
		thumbnailList.push( thumb );
	} );
	
	var calculate = {
		sliderLeft: function() {
			var left = 
				Math.round( photocradle.sizes.preview.width / 2 ) 
				- parseInt( thumbnailList[ photocradle.pointer.active ].$element.css( 'left' ) ) 
				- Math.round( ( photocradle.sizes.thumbnail.width ) / 2 )
				+ photocradle.options.borderWeight;
			var minLeft = 0;
			left = left > minLeft ? minLeft : left;
			var maxLeft = -1 * ( $thumbSlider.width() - photocradle.sizes.preview.width - photocradle.options.borderWeight * 2 );
			left = left < maxLeft ? maxLeft : left;
			
			return left;
		}
	};
	
    $thumbSlider.css({left: calculate.sliderLeft() + photocradle.$element.offset().left});
	
	// react on photocradle change of active image
	$( photocradle ).bind( 'changeActive', function() {
    if ( !lr.expanded )
      $thumbSlider.css({
        left: calculate.sliderLeft() + photocradle.$element.offset().left
      });
	});
	
	$thumbPlane
		.mouseenter(function() { $( photocradle ).triggerHandler( "fullThumbsEnter" ); } )
		.mouseleave(function() { $( photocradle ).triggerHandler( "fullThumbsLeave" ); } );
	
    lr.expanded = false;

    $( photocradle ).bind( "fullThumbsEnter fullThumbsLeave briefThumbsEnter briefThumbsLeave", function() { lr.expanded = !lr.expanded; } );

    $( photocradle ).bind( 'briefThumbsEnter', function() {
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

    $( photocradle ).bind( 'fullThumbsEnter', function() {
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

    $( photocradle ).bind( 'briefThumbsLeave fullThumbsLeave', function() {
        var fadeOut = function() {
            if ( lr.expanded )
            return;

            $thumbPlane
                .stop( true, true )
                .animate({ opacity: 0 }, 300, function() {
                    $thumbPlane.css( { visibility: 'hidden' } );
                    $thumbSlider.css( {
                        left: calculate.sliderLeft() + photocradle.$element.offset().left
                    } );
                } );
        };

        setTimeout( fadeOut, 100);
    });
};

})( jQuery );