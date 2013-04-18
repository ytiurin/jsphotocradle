(function( $ ) {

var debug = false;
debug = window.console != undefined ? debug : false;

//***************************
$.photoCradle = {
	options: {
		firstImageIndex: 0,
		borderWeight: 4,
		enableLayers: {}
	},
	
	layer: {}
};

//***************************
$.fn.photoCradle = function( options ) {
    opts = {};
    $.extend(opts, $.photoCradle.options, options);
    
	return this.each( function() {
		if ( $( this ).find( '.photoCradle' ).length == 0 )
			new CTGallery( this, opts );
	});
};

// photoCradle constructor
function CTGallery( element, options ) {
	var photoCradle = this;
	
	photoCradle.options = options;
	photoCradle.active = photoCradle.preactive = photoCradle.options.firstImageIndex;
	
	photoCradle.$container = $( element );
	
	var initSizes = (function() {
		var sizes = {};
		sizes.previewWidth = Math.round( photoCradle.$container.width() - photoCradle.options.borderWeight * 2 );
		sizes.previewHeight = Math.round( ( photoCradle.$container.height() - photoCradle.options.borderWeight * 3 ) / 5 * 4 );
		sizes.thumbnailWidth = Math.round( ( photoCradle.$container.width() - photoCradle.options.borderWeight * 6 ) / 5 );
		sizes.thumbnailHeight = Math.round( ( photoCradle.$container.height() - photoCradle.options.borderWeight * 3 ) / 5 );
		
		return sizes;
	})();
	
	photoCradle.sizes = {
		preview: {
			width: initSizes.previewWidth,
			height: initSizes.previewHeight
		},
		thumbnail: {
			width: initSizes.thumbnailWidth,
			height: initSizes.thumbnailHeight
		},
		original: {
			width: 0,
			height: 0
		}
	};
	
	photoCradle.$area = $( '<div class="photoCradle" />' )
        .appendTo( document.body );
	
	photoCradle.$element = $( '<div class="photoCradle-box" />' )
		.css( { 
			position: 'absolute',
			left: photoCradle.$container.offset().left,
			top: photoCradle.$container.offset().top,
			width: photoCradle.$container.width(), 
			height: photoCradle.$container.height()
		} )
        // make gallery container overlap other elements
        .mouseover(function () {
            var zIndex = 0;
            $('*').each(function (i, el) {
                var elZIndex = parseInt($(el).css('z-index'));
                zIndex = elZIndex > zIndex ? elZIndex : zIndex;
            });
            photoCradle.$element.css({zIndex: ++zIndex});
        })
		.appendTo( photoCradle.$area );
	
	// update position on window resize
	$(window).resize(function () {
        photoCradle.$element
            .css( { 
                left: photoCradle.$container.offset().left,
                top: photoCradle.$container.offset().top
            } );
        $(photoCradle).trigger('resize');
	});
	
    // build layers
	var i = 0;
	$.each( $.photoCradle.layer, function( name, layer ) {
		var $layerElement = $( '<div/>' )
			.css({
				position: 'absolute',
				zIndex: 1000 + i
			})
			.addClass( name )
			.appendTo( photoCradle.$element );
			
		new layer( photoCradle, $layerElement );
		i++;
	});
	
    // add shader
    var $shader = $( '<div class="photoCradle-shader"/>' )
		.css({ 
			background: '#000',
			position: 'fixed', 
			left: 0,
			top: 0,
			width: 1,
			height: 1,
			opacity: 0
		})
		.hide()
		.appendTo( photoCradle.$area );
        
	photoCradle.$element
        .mouseenter( function() {
            $shader
                .css({
                    opacity: 0,
                    display: 'block',
                    width: $(window).width(),
                    height: $(window).height()
                })
                .animate({ opacity: 0.3 }, 'slow' );
        } )
        .mouseleave( function() {
            $shader.hide();
        } );

    //debug ? console.log( photoCradle ) : null;
};

// photoCradle prototype
CTGallery.prototype = {
	// changes active image index
	setActive: function( active ) {
		this.preactive = this.active;
		this.active = parseInt( active );
		
		$( this ).triggerHandler( "changeActive" );
		
		return this;
	},
	
	// sets active image index to next image
	setActiveNext: function() {
		this.preactive = this.active;
		this.active = this.options.images.length == ++this.active ? 0 : this.active;
		
		$( this ).triggerHandler( "changeActiveNext" );
		
		return this;
	},
	
	// sets active image index to next image
	setActivePrev: function() {
		this.preactive = this.active;
		this.active = -1 == --this.active ? this.options.images.length - 1 : this.active;
		
		$( this ).triggerHandler( "changeActivePrev" );
		
		return this;
	},
	
	// creates and returns a fillimage
	getFillImage: function( type, ind ) {
		var photoCradle = this;
		ind = ind == 'active' ? photoCradle.active : ind;
		
		var fimage = new FillImage( photoCradle.options.images[ ind ][ type ] );
		fimage.width( photoCradle.sizes[ type ].width );
		fimage.height( photoCradle.sizes[ type ].height );
		
		return fimage;
	}
};

// fillImage constructor
function FillImage( src ) {
	var eimage = this;
	
	eimage.$element = $( '<div style="position:absolute;overflow:hidden;" />' );
	
	eimage.image = new Image;
	$( eimage.image )
		.css( {
			position: 'absolute',
			'-moz-user-select': 'none',
			'-khtml-user-select': 'none',
			'-webkit-user-select': 'none',
			'user-select': 'none'
		} )
		.attr( 'unselectable', true )
		.hide()
		.load( function() { $(this).show(); } )
		.appendTo( eimage.$element );
		
	eimage.image.src = src;
	eimage.sizeAvailable = false;
	var sizeAvailableTrigger = function() {
		if ( parseInt(eimage.image.naturalWidth + eimage.image.naturalHeight) != 0 ) {
			$( eimage ).trigger( 'sizeAvailable' );
			eimage.sizeAvailable = true;
		};
		
		setTimeout(function() {if ( !eimage.sizeAvailable ) sizeAvailableTrigger();}, 10);
	};
	sizeAvailableTrigger();
	
	//debug ? console.log( eimage ) : null;
};
 
// fillImage prototype
FillImage.prototype = {
	preload: function( handler ) {
		var fimage = this;
		
		if (typeof( handler ) != 'function')
			return this;
			
		$( fimage ).one( 'sizeAvailable', function() { handler( fimage ); } );
		
		if ( fimage.sizeAvailable )
			$( fimage ).trigger( 'sizeAvailable' );
		
		return this;
	},
	
	ready: function( handler ) {
		var fimage = this;
		
		if (typeof( handler ) != 'function')
			return this;
		
		$( fimage.image ).one( 'load', function() { handler( fimage ); } );
		
		if ( fimage.image.complete )
			$( fimage.image ).trigger( 'load' );
			
		return this;
	},

	__updateSize: function() {
		var eimage = this;
		
		eimage.preload( function() {
			function sizeFill( containerWidth, containerHeight, canvasRatio, imageRatio )
			{
				if ( canvasRatio >= imageRatio ) {
					var imageWidth = containerWidth;
					var imageHeight = containerWidth / imageRatio;
					
				} else {
					var imageWidth = containerHeight * imageRatio;
					var imageHeight = containerHeight;
				};
				
				return { width: imageWidth, height: imageHeight };
			};
			
			var containerWidth = eimage.$element.width();
			var containerHeight = eimage.$element.height();
			var canvasRatio = containerWidth / containerHeight;
			var imageRatio = eimage.image.width / eimage.image.height;
			
			var imageSize = sizeFill( containerWidth, containerHeight, canvasRatio, imageRatio );
			
			var imageLeft = ( containerWidth - imageSize.width ) / 2;
			var imageTop = ( containerHeight - imageSize.height ) / 2;
			
			$( eimage.image ).css({
				width: Math.ceil( imageSize.width ),
				height: Math.ceil( imageSize.height ), 
				left: Math.ceil( imageLeft ), 
				top: Math.ceil( imageTop )
			});
		} );
	},

	width: function( width ) {
		var fimage = this;
		
		fimage.$element.width( width );
		fimage.__updateSize();
		
		return this;
	},

	height: function( height ) {
		var fimage = this;
		
		fimage.$element.height( height );
		fimage.__updateSize();
		
		return this;
	}
};

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
		
	// react on image change
	$( photoCradle ).bind( 'changeActive', { photoCradle: photoCradle }, function( e ) {
		var photoCradle = e.data.photoCradle;
		
		lr.preview.$element.detach();
		
		lr.preview = photoCradle.getFillImage( 'preview', 'active' )
			.ready( function( preview ) {
				preview
					.width( photoCradle.sizes.preview.width )
					.height( photoCradle.sizes.preview.height )
					.$element
						.hide()
						.appendTo( $frameElement )
						.fadeIn();
			} );
	});
	
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
          .width( photoCradle.sizes.preview.width )
          .height( photoCradle.sizes.preview.height )
          .$element
            .appendTo( $frameElement )
            .css({ 
              left: ( photoCradle.sizes.preview.width + parseInt( photoCradle.options.borderWeight * 5 ) ) * (direction == 'left' ? 1 : -1)
            })
            .stop(true, true)
            .animate( { left: 0 }, 300, 'easeOutExpo' );
      } );
  };
  
	$( photoCradle )
		// react on image change to next
		.bind( 'changeActiveNext', function() {
      slidePreviews( 'left' );
		})
		// react on image change to prev
		.bind( 'changeActivePrev', function() {
      slidePreviews( 'right' );
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
	var $controlPreview = $( '<div/>' )
		.css({
			position: 'absolute',
			cursor: 'pointer',
			left: Math.round( photoCradle.sizes.preview.width / 4 ),
			top: photoCradle.options.borderWeight,
			width: Math.round( photoCradle.sizes.preview.width / 2 ),
			height: photoCradle.sizes.preview.height
		})
		.click( function() {
			$( photoCradle ).trigger( 'previewClick' );
		})
        .appendTo( $layerElement );
	
	var $controlNext = $( '<div/>' )
		.addClass( 'control-next' )
		.css({
			position: 'absolute',
			cursor: 'pointer'
		})
		
		.appendTo($layerElement)
		
		.click(function () {
			photoCradle.setActiveNext();
		});
  
    // control pervious
	var $controlPrev = $('<div/>')
		.addClass('control-prev')
		.css({
			position: 'absolute',
			cursor: 'pointer'
		})
		.click(function () {
			photoCradle.setActivePrev();
		})
		.appendTo($layerElement);
    
    if (photoCradle.sizes.preview.height <= 240) {
        $controlNext.addClass('mini');
        $controlPrev.addClass('mini');
    }
  
    $controlNext.css({
        left: Math.round(photoCradle.sizes.preview.width - $controlNext.width() + photoCradle.options.borderWeight),
        top: Math.round((photoCradle.sizes.preview.height - $controlNext.height()) / 2 + photoCradle.options.borderWeight)
    });
  
    $controlPrev.css({
        left: photoCradle.options.borderWeight,
        top: Math.round((photoCradle.sizes.preview.height - $controlNext.height()) / 2 + photoCradle.options.borderWeight)
    });
    
    // show/hide on hover
    var $controls = $([$controlNext.get(0), $controlPrev.get(0)]).hide();
    var controlsVisible = false;
    var controlsShowHandler = function () {
        controlsVisible = true;
        setTimeout(function () {if (controlsVisible) $controls.fadeIn(300);}, 100);
    };
    var controlsHideHandler = function () {
        controlsVisible = false;
        setTimeout(function () {if (!controlsVisible) $controls.fadeOut(300);}, 100);
    };
    
    $(photoCradle).bind('previewMouseEnter', controlsShowHandler).bind('previewMouseLeave', controlsHideHandler);
    $controlPreview.mouseenter(controlsShowHandler).mouseleave(controlsHideHandler);
    $controlNext.mouseenter(controlsShowHandler).mouseleave(controlsHideHandler);
    $controlPrev.mouseenter(controlsShowHandler).mouseleave(controlsHideHandler);
};

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
			width: photoCradle.options.images.length * ( photoCradle.sizes.thumbnail.width + photoCradle.options.borderWeight ) - photoCradle.options.borderWeight,
			height: photoCradle.sizes.thumbnail.height + photoCradle.options.borderWeight * 2
		})
		.appendTo($thumbPlane);
	
	// create thumbnails elements
	
	var thumbnailList = [];
	$( photoCradle.options.images ).each( function( i, img_opts ) {
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
				- parseInt( thumbnailList[ photoCradle.active ].$element.css( 'left' ) ) 
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
	
	$( photoCradle ).bind( 'changeActive changeActiveNext changeActivePrev', function() {
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
            width: photoCradle.options.images.length * ( photoCradle.sizes.thumbnail.width + photoCradle.options.borderWeight ) + photoCradle.options.borderWeight,
            height: photoCradle.sizes.thumbnail.height + photoCradle.options.borderWeight * 2
        });
        
        return arguments.callee;
	})();
    
    $(photoCradle).bind('resize', function () { updatePosition(); });
    
	// create thumbnails elements
	
	var thumbnailList = [];
	$( photoCradle.options.images ).each( function( i, img_opts ) {
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
				- parseInt( thumbnailList[ photoCradle.active ].$element.css( 'left' ) ) 
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
	$( photoCradle ).bind( 'changeActive changeActiveNext changeActivePrev', function() {
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

//init layers order
$.photoCradle.layer.originalShader = null;
$.photoCradle.layer.original = null;
$.photoCradle.layer.originalControl = null;
$.photoCradle.layer.originalLoader = null;

// original layer
$.photoCradle.layer.original = function( photoCradle, $layerElement ) {
	var setWinBorder = 10;
	var lr = this;
	var active = false;
	
	var calculateOriginalDimentions = function( originalWidth, originalHeight ) {
		var winWidth = $(window).width() - setWinBorder * 2;
		var winHeight = $(window).height() - setWinBorder * 2;
		var winRatio = winWidth / winHeight;
		var origRatio = originalWidth / originalHeight;
		//console.log(winRatio + ' ? ' + origRatio);
		
		if ( winRatio >= origRatio ) {
			var fullWidth = winHeight * origRatio;
			var fullHeight = winHeight;
			var absLeft = ( winWidth - fullWidth ) / 2;
			var absTop = 0 ;
			
		} else {
			var fullWidth = winWidth;
			var fullHeight = winWidth / origRatio;
			var absLeft = 0;
			var absTop = ( winHeight - fullHeight ) / 2;
		};
		
		var fullLeft = absLeft + setWinBorder;
		var fullTop = absTop + setWinBorder;
		
		return { width: fullWidth, height: fullHeight, left: fullLeft, top: fullTop };
	};
	
	var switchOriginal = function( options ) {
		if ( lr.original != undefined ) {
			lr.original.stop = true;
			lr.original.$element.detach();
		};
		
		if ( lr.preview != undefined ) {
			lr.preview.stop = true;
			lr.preview.$element.detach();
		}
			
		lr.original = photoCradle.getFillImage( 'original', 'active' )
			.preload( function( original ) {
				if ( original.stop )
					return;
        
                $( photoCradle ).triggerHandler( "originalPreload" );
				var origDim = calculateOriginalDimentions( original.image.naturalWidth, original.image.naturalHeight );
				
				lr.preview = photoCradle.getFillImage( 'preview', 'active' )
					.ready( function( preview ) {
						if ( preview.stop )
							return;
							
						preview.$element
							.css({ 
								boxShadow: '0 0 20px #000',
								position: 'fixed',
								opacity: options.opacityStart ? options.opacityStart : 1,
								width: options.widthStart ? options.widthStart : origDim.width,
								height: options.heightStart ? options.heightStart : origDim.height,
								left: options.leftStart ? options.leftStart : ( 
									options.leftStartDiff ? origDim.left + options.leftStartDiff : origDim.left
								),
								top: options.topStart ? options.topStart : ( 
									options.topStartDiff ? origDim.top + options.topStartDiff : origDim.top
								)
							})
							.appendTo( $layerElement )
							.animate( {
								opacity: 1,
								width: origDim.width,
								height: origDim.height,
								left: origDim.left,
								top: origDim.top
							}, {
								duration: 300, 
								easing: 'easeOutExpo',
								
								step: function( now, fx ) {
									if ( fx.prop == 'width' ) {
										preview.width( fx.now );
										
									} else if ( fx.prop == 'height' ) {
										preview.height( fx.now );
									};
								},
								
								complete: function() {
									if ( !active )
										return;
										
                                    $( photoCradle ).triggerHandler( "originalPreview" );
                                    
									original.ready( function( original ) {
										if ( original.stop )
											return;
                    
                                        $( photoCradle ).triggerHandler( "originalReady" );
										
										original
											.width( origDim.width )
											.height( origDim.height )
											.$element
												.css({
													position: 'fixed',
													left: origDim.left,
													top: origDim.top
												})
												.hide()
												.appendTo( $layerElement )
												.fadeIn( 3000, function() {
													$( this ).css({	boxShadow: '0 0 20px #000' });
													preview.$element.hide();
												} );
										
                                            original.$element.click( function() {
											$( photoCradle ).triggerHandler( "originalClose" );
										} );
									} );
								}
							});
					} );
          
                    // upate size and position on window resize
                    $(window).resize(function () {
                        var origDim = calculateOriginalDimentions( original.image.naturalWidth, original.image.naturalHeight );

                        original
                            .width( origDim.width )
                            .height( origDim.height )
                            .$element.css({
                                left: origDim.left,
                                top: origDim.top
                            });
                    });
			});
	};
	
	$( photoCradle )
		// react on preview click
		.bind( 'previewClick', function() {
			$( photoCradle ).triggerHandler( "originalOpen" );
		})
		
		// react on original open
		.bind( 'originalOpen', function() {
			active = true;
			$( document.body ).css( { overflow: 'hidden' } );
			
			switchOriginal( {
				widthStart: photoCradle.sizes.preview.width,
				heightStart: photoCradle.sizes.preview.height,
				leftStart: photoCradle.$element.offset().left - $( document.body ).scrollLeft(),
				topStart: photoCradle.$element.offset().top - $( document.body ).scrollTop(),
				opacityStart: 0.1
			} );
		})
		
		// react on next control click
		.bind( 'changeActiveNext', function() {
			if ( !active)
				return;
				
			switchOriginal( {
				leftStartDiff: $( window ).width() / 5,
				opacityStart: 0.1
			} );
		})
		
		// react on prev control click
		.bind( 'changeActivePrev', function() {
			if ( !active)
				return;
				
			switchOriginal( {
				leftStartDiff: $( window ).width() / 5 * -1,
				opacityStart: 0.1
			} );
		})
		
		// react on original close
		.bind( "originalClose", function() {
			active = false;
            lr.original.stop = lr.preview.stop = true;
			
			lr.original.$element.detach();
			lr.preview.$element.fadeOut( function() { $(this).detach(); } );
		} );
};

// shader layer
$.photoCradle.layer.originalShader = function( photoCradle, $layerElement ) {
	var $shader = $( '<div/>' )
		.css({ 
			background: '#000',
			position: 'fixed', 
			left: 0,
			top: 0,
			width: 1,
			height: 1,
			opacity: 0
		})
		.hide()
		.appendTo($layerElement)
		
		.click( function() {
			$( photoCradle ).triggerHandler( "originalClose" );
		} );
	
	var updateDim = function() {
		$shader.filter( ':visible' ).css({
			width: $(window).width(),
			height: $(window).height()
		});
	};
	
	var defaultBodyOverflow = $( document.body ).css( 'overflow' );
	
	$( photoCradle ).bind( "originalOpen", function() {
		$( document.body ).css( { overflow: 'hidden' } );
		$shader.show();
		updateDim();
		$shader.animate({ opacity: 0.7 }, 'slow' );
	} );
	
	$( photoCradle ).bind( "originalClose", function() {
		$shader.animate({ opacity: 0 }, function() {
			$( this ).hide();
			$( document.body ).css( { overflow: defaultBodyOverflow } );
		} );
	} );
	
	// react on window resize
	$( window ).resize( function() {updateDim(); } );
};

// fullscreen controls
$.photoCradle.layer.originalControl = function( photoCradle, $layerElement ) {
    var active = false;
    
	//control next
	var $controlNext = $( '<div/>' )
		.addClass( 'control-next' )
		.css({
            position: 'fixed',
            cursor: 'pointer'
        })
		.hide()
		.appendTo( $layerElement )
		.click( function() {
			photoCradle.setActiveNext();
		});
   
  //control previous
	var $controlPrev = $( '<div/>' )
		.addClass( 'control-prev' )
		.css({
            position: 'fixed',
            cursor: 'pointer'
        })
		.hide()
		.appendTo( $layerElement )
		.click( function() {
			photoCradle.setActivePrev();
		});
	
	var updateDim = (function() {
		$controlNext.css({
			left: Math.round( $( window ).width() - $controlNext.width() - ( $( window ).width() / 20 ) ),
			top: Math.round( ( $( window ).height() - $controlNext.height() ) / 2 )
		});
    
		$controlPrev.css({
			left: Math.round( $( window ).width() / 20 ),
			top: Math.round( ( $( window ).height() - $controlNext.height() ) / 2 )
		});
		
		return arguments.callee;
	})();
    
    var $controls = $([$controlNext.get(0), $controlPrev.get(0)]);
	
    $( photoCradle ).bind( 'originalReady', function() { 
        if (!active) {
            active = true;
            updateDim();
            
            setTimeout(function () {
                if (active)
                    $controls
                        .stop(true, true)
                        .show()
                        .css({opacity: 0})
                        .animate({opacity: 0.5}, 'slow'); 
            }, 1000);
        };
    } );
    
    $controls
        .mouseenter(function () {
            $(this)
                .stop(true, true)
                .css({opacity: 0.5})
                .animate({opacity: 1}, 'slow'); 
        })
        .mouseleave(function () {
            $(this)
                .stop(true, true)
                .css({opacity: 1})
                .animate({opacity: 0.5}, 'slow'); 
        });
	
	$( photoCradle ).bind('originalClose', function () { 
        active = false;
        $controls.stop(true, true).fadeOut();
    });
	
	// react on window resize
	$( window ).resize( function() { updateDim(); } );
};

// fullscreen loader
$.photoCradle.layer.originalLoader = function( photoCradle, $layerElement ) {
	var $loader = $( '<div/>' )
		.addClass( 'loader' )
		.css({position: 'fixed'})
		.hide()
		.appendTo( $layerElement );
  
	var updateDim = (function() {
		$loader.css({
			left: Math.round( ( $( window ).width() - $loader.width() ) / 2 ),
			top: Math.round( ( $( window ).height() - $loader.height() ) / 2 )
		});
    
		return arguments.callee;
	})();
	
	//$( photoCradle ).bind( 'originalOpen', function() { updateDim(); $loader.stop(true, true).show(); } );
	$( photoCradle ).bind( 'originalClose', function() { $loader.stop(true, true).hide(); } );
	//$( photoCradle ).bind( 'originalPreload', function() { $loader.stop(true, true).show(); } );
	$( photoCradle ).bind( 'originalPreview', function() { $loader.stop(true, true).show(); } );
	$( photoCradle ).bind( 'originalReady', function() { setTimeout(function() {$loader.stop(true, true).fadeOut();}, 1000); } );
	
	// react on window resize
	$( window ).resize( function() { updateDim(); } );
};

$.photoCradleFlickr = {
  options: {
    api_key: 'f53c32a7c8812bfe7d8e7c96ff0214e1',
    limit: 100
  },
  
  sizes: {
    square: 's',
    thumbnail: 't',
    small: 'm',
    large: 'b',
    original: 'o'
  }
};

//***************************
$.fn.photoCradleFlickr = function(url, options) {
    opts = {};
	$.extend(opts, $.photoCradleFlickr.options, options);
	
	return this.each( function() {
    new FlickrRequester(this, url, opts);
	});
  
  return this;
};

//***************************
function FlickrRequester(element, url, options) {
  var requester = this;
  requester.$element = $(element);
  requester.options = options;
  
  // photoset
  if (/sets/.test(url) != false) {
    requester.loadPhotoset(url);
  
  // gallery
  } else if (/galleries/.test(url) != false) {
    requester.loadGallery(url);
  
  // photostream
  } else {
    requester.loadPhotostream(url);
  };
};

FlickrRequester.prototype = {
  //*********************************
  initPhotos: function (photos) {
    var requester = this;
    var options = {images: []};
    $.extend(options, requester.options);
    
    $.each(photos, function (i, p) {
        options.images.push({
            thumbnail: 'http://farm'+p.farm+'.static.flickr.com/'+p.server+'/'+p.id+'_'+p.secret+'_t.jpg',
            preview: 'http://farm'+p.farm+'.static.flickr.com/'+p.server+'/'+p.id+'_'+p.secret+'_m.jpg',
            original: 'http://farm'+p.farm+'.static.flickr.com/'+p.server+'/'+p.id+'_'+p.secret+'_b.jpg',
            title: p.title
        });
    });
    
    requester.$element.photoCradle(options);
  },
  
  //*********************************
  loadPhotostream: function (url) {
    var requester = this;
    
    $.ajax({
      url: 'http://api.flickr.com/services/rest/',
      data: {
        method: 'flickr.urls.lookupUser',
        url: url,
        api_key: requester.options.api_key, 
        format: 'json', 
        nojsoncallback: 1
      },
      
      dataType: 'json',
      success: function (r) {
        $.ajax({
          url: 'http://api.flickr.com/services/rest/',
          dataType: 'json',
          data: {
            method: 'flickr.people.getPublicPhotos',
            api_key: requester.options.api_key,
            user_id: r.user.id,
            per_page: requester.options.limit,
            format: 'json',
            nojsoncallback: 1
          },
          
          success: function (r) {
            if (r.photos != undefined)
              requester.initPhotos(r.photos.photo);
          }
        });
      }
    });
  },
  
  //*********************************
  loadGallery: function (url) {
    var requester = this;
    
    $.ajax({
      url: 'http://api.flickr.com/services/rest/',
      data: {
        method: 'flickr.urls.lookupGallery',
        url: url,
        api_key: requester.options.api_key, 
        format: 'json', 
        nojsoncallback: 1
      },
      
      dataType: 'json',
      success: function (r) {
        $.ajax({
          url: 'http://api.flickr.com/services/rest/',
          dataType: 'json',
          data: {
            method: 'flickr.galleries.getPhotos',
            api_key: requester.options.api_key,
            gallery_id: r.gallery.id,
            per_page: requester.options.limit,
            format: 'json',
            nojsoncallback: 1
          },
          
          success: function (r) {
            if (r.photos != undefined)
              requester.initPhotos(r.photos.photo);
          }
        });
      }
    });
  },
  
  //*********************************
  loadPhotoset: function (url) {
    var requester = this;
    
		var param = url.split('/');
		var photoset_id = '';
		while(photoset_id.length == 0) photoset_id = param.pop();
		
    $.ajax({
      url: 'http://api.flickr.com/services/rest/',
      data: {
        method: 'flickr.photosets.getPhotos',
        url: url,
        api_key: requester.options.api_key,
        photoset_id: photoset_id,
        per_page: requester.options.limit,
        format: 'json', 
        nojsoncallback: 1
      },
      
      dataType: 'json',
      success: function (r) {
        if (r.photoset != undefined)
          requester.initPhotos(r.photoset.photo);
      }
    });
  }
};

})( jQuery );