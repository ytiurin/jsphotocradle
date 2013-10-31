(function( $ ) {

var debug = false;
debug = window.console != undefined ? debug : false;

//***************************
$.photocradle = {
	options: {
		firstImageIndex: 0,
		borderWeight: 4,
		enableLayers: {}
	},
	
	layer: {}
};

//***************************
$.fn.photocradle = function( options ) {
    opts = {};
    $.extend(opts, $.photocradle.options, options);
    
	return this.each( function() {
		if ( $( this ).find( '.photocradle' ).length == 0 )
			new CTGallery( this, opts );
	});
};

// photocradle constructor
function CTGallery( element, options ) {
	var photocradle = this;
	
	photocradle.options = options;
	photocradle.active = photocradle.preactive = photocradle.options.firstImageIndex;
	
	photocradle.$container = $( element );
	
	var initSizes = (function() {
		var sizes = {};
		sizes.previewWidth = Math.round( photocradle.$container.width() - photocradle.options.borderWeight * 2 );
		sizes.previewHeight = Math.round( ( photocradle.$container.height() - photocradle.options.borderWeight * 3 ) / 5 * 4 );
		sizes.thumbnailWidth = Math.round( ( photocradle.$container.width() - photocradle.options.borderWeight * 6 ) / 5 );
		sizes.thumbnailHeight = Math.round( ( photocradle.$container.height() - photocradle.options.borderWeight * 3 ) / 5 );
		
		return sizes;
	})();
	
	photocradle.sizes = {
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
	
	photocradle.$area = $( '<div class="photocradle" />' )
        .appendTo( document.body );
	
	photocradle.$element = $( '<div class="photocradle-box" />' )
		.css( { 
			position: 'absolute',
			left: photocradle.$container.offset().left,
			top: photocradle.$container.offset().top,
			width: photocradle.$container.width(), 
			height: photocradle.$container.height()
		} )
        // make gallery container overlap other elements
        .mouseover(function () {
            var zIndex = 0;
            $('*').each(function (i, el) {
                var elZIndex = parseInt($(el).css('z-index'));
                zIndex = elZIndex > zIndex ? elZIndex : zIndex;
            });
            photocradle.$element.css({zIndex: ++zIndex});
        })
		.appendTo( photocradle.$area );
	
	// update position on window resize
	$(window).resize(function () {
        photocradle.$element
            .css( { 
                left: photocradle.$container.offset().left,
                top: photocradle.$container.offset().top
            } );
        $(photocradle).trigger('resize');
	});
	
    // build layers
	var i = 0;
	$.each( $.photocradle.layer, function( name, layer ) {
		var $layerElement = $( '<div/>' )
			.css({
				position: 'absolute',
				zIndex: 1000 + i
			})
			.addClass( name )
			.appendTo( photocradle.$element );
			
		new layer( photocradle, $layerElement );
		i++;
	});
	
    // add shader
    var $shader = $( '<div class="photocradle-shader"/>' )
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
		.appendTo( photocradle.$area );
        
	photocradle.$element
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

    //debug ? console.log( photocradle ) : null;
};

// photocradle prototype
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
		var photocradle = this;
		ind = ind == 'active' ? photocradle.active : ind;
		
		var fimage = new FillImage( photocradle.options.images[ ind ][ type ] );
		fimage.width( photocradle.sizes[ type ].width );
		fimage.height( photocradle.sizes[ type ].height );
		
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
$.photocradle.layer.preview = function( photocradle, $layerElement ) {
	var lr = this;
	
	lr.preview = photocradle.getFillImage( 'preview', 'active' );
	
	var $frameElement = $( '<div/>' )
		.css({
			position: 'relative',
			overflow: 'hidden',
			left: photocradle.options.borderWeight,
			top: photocradle.options.borderWeight,
			width: photocradle.sizes.preview.width,
			height: photocradle.sizes.preview.height
		})
		.mouseenter( function() {
			$( photocradle ).trigger( 'previewMouseEnter' );
		})
		.mouseleave( function() {
			$( photocradle ).trigger( 'previewMouseLeave' );
		})
		.append( lr.preview.$element );
		
	// react on image change
	$( photocradle ).bind( 'changeActive', { photocradle: photocradle }, function( e ) {
		var photocradle = e.data.photocradle;
		
		lr.preview.$element.detach();
		
		lr.preview = photocradle.getFillImage( 'preview', 'active' )
			.ready( function( preview ) {
				preview
					.width( photocradle.sizes.preview.width )
					.height( photocradle.sizes.preview.height )
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
          left: ( photocradle.sizes.preview.width + parseInt( photocradle.options.borderWeight * 5 )) * (direction == 'left' ? -1 : 1)
        }, 300, 'easeOutExpo', function() {
          oldPreview.$element.detach();
        });
    }
    
    lr.preview = photocradle.getFillImage( 'preview', 'active' )
      .ready( function( preview ) {
        if ( preview.stop )
          return;
          
        preview
          .width( photocradle.sizes.preview.width )
          .height( photocradle.sizes.preview.height )
          .$element
            .appendTo( $frameElement )
            .css({ 
              left: ( photocradle.sizes.preview.width + parseInt( photocradle.options.borderWeight * 5 ) ) * (direction == 'left' ? 1 : -1)
            })
            .stop(true, true)
            .animate( { left: 0 }, 300, 'easeOutExpo' );
      } );
  };
  
	$( photocradle )
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
	
	$( photocradle )
		// react on preview mouseenter
		.bind( 'previewMouseEnter', function() {
			previewZoomed = true;
			
			setTimeout( function() {
				if ( previewZoomed )
					previewZoom({
						width: Math.round( photocradle.sizes.preview.width * 1.1 ),
						height: Math.round( photocradle.sizes.preview.height * 1.1 ),
						left: -1 * Math.round( photocradle.sizes.preview.width * 0.05 ),
						top: -1 * Math.round( photocradle.sizes.preview.height * 0.05 )
					});
			}, 100);
		})
		
		// react on preview mouseleave
		.bind( 'previewMouseLeave', function() {
			previewZoomed = false;
			
			setTimeout( function() {
				if ( !previewZoomed )
					previewZoom({
						width: photocradle.sizes.preview.width,
						height: photocradle.sizes.preview.height,
						left: 0,
						top: 0
					})
			}, 100);
		});
	*/
	$frameElement.appendTo($layerElement);
};

// preview controls
$.photocradle.layer.previewControl = function( photocradle, $layerElement ) {
	var $controlPreview = $( '<div/>' )
		.css({
			position: 'absolute',
			cursor: 'pointer',
			left: Math.round( photocradle.sizes.preview.width / 4 ),
			top: photocradle.options.borderWeight,
			width: Math.round( photocradle.sizes.preview.width / 2 ),
			height: photocradle.sizes.preview.height
		})
		.click( function() {
			$( photocradle ).trigger( 'previewClick' );
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
			photocradle.setActiveNext();
		});
  
    // control pervious
	var $controlPrev = $('<div/>')
		.addClass('control-prev')
		.css({
			position: 'absolute',
			cursor: 'pointer'
		})
		.click(function () {
			photocradle.setActivePrev();
		})
		.appendTo($layerElement);
    
    if (photocradle.sizes.preview.height <= 240) {
        $controlNext.addClass('mini');
        $controlPrev.addClass('mini');
    }
  
    $controlNext.css({
        left: Math.round(photocradle.sizes.preview.width - $controlNext.width() + photocradle.options.borderWeight),
        top: Math.round((photocradle.sizes.preview.height - $controlNext.height()) / 2 + photocradle.options.borderWeight)
    });
  
    $controlPrev.css({
        left: photocradle.options.borderWeight,
        top: Math.round((photocradle.sizes.preview.height - $controlNext.height()) / 2 + photocradle.options.borderWeight)
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
    
    $(photocradle).bind('previewMouseEnter', controlsShowHandler).bind('previewMouseLeave', controlsHideHandler);
    $controlPreview.mouseenter(controlsShowHandler).mouseleave(controlsHideHandler);
    $controlNext.mouseenter(controlsShowHandler).mouseleave(controlsHideHandler);
    $controlPrev.mouseenter(controlsShowHandler).mouseleave(controlsHideHandler);
};

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
			width: photocradle.options.images.length * ( photocradle.sizes.thumbnail.width + photocradle.options.borderWeight ) - photocradle.options.borderWeight,
			height: photocradle.sizes.thumbnail.height + photocradle.options.borderWeight * 2
		})
		.appendTo($thumbPlane);
	
	// create thumbnails elements
	
	var thumbnailList = [];
	$( photocradle.options.images ).each( function( i, img_opts ) {
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
				- parseInt( thumbnailList[ photocradle.active ].$element.css( 'left' ) ) 
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
	
	$( photocradle ).bind( 'changeActive changeActiveNext changeActivePrev', function() {
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
            width: photocradle.options.images.length * ( photocradle.sizes.thumbnail.width + photocradle.options.borderWeight ) + photocradle.options.borderWeight,
            height: photocradle.sizes.thumbnail.height + photocradle.options.borderWeight * 2
        });
        
        return arguments.callee;
	})();
    
    $(photocradle).bind('resize', function () { updatePosition(); });
    
	// create thumbnails elements
	
	var thumbnailList = [];
	$( photocradle.options.images ).each( function( i, img_opts ) {
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
				- parseInt( thumbnailList[ photocradle.active ].$element.css( 'left' ) ) 
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
	$( photocradle ).bind( 'changeActive changeActiveNext changeActivePrev', function() {
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

//init layers order
$.photocradle.layer.originalShader = null;
$.photocradle.layer.original = null;
$.photocradle.layer.originalControl = null;
$.photocradle.layer.originalLoader = null;

// original layer
$.photocradle.layer.original = function( photocradle, $layerElement ) {
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
			
		lr.original = photocradle.getFillImage( 'original', 'active' )
			.preload( function( original ) {
				if ( original.stop )
					return;
        
                $( photocradle ).triggerHandler( "originalPreload" );
				var origDim = calculateOriginalDimentions( original.image.naturalWidth, original.image.naturalHeight );
				
				lr.preview = photocradle.getFillImage( 'preview', 'active' )
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
										
                                    $( photocradle ).triggerHandler( "originalPreview" );
                                    
									original.ready( function( original ) {
										if ( original.stop )
											return;
                    
                                        $( photocradle ).triggerHandler( "originalReady" );
										
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
											$( photocradle ).triggerHandler( "originalClose" );
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
	
	$( photocradle )
		// react on preview click
		.bind( 'previewClick', function() {
			$( photocradle ).triggerHandler( "originalOpen" );
		})
		
		// react on original open
		.bind( 'originalOpen', function() {
			active = true;
			$( document.body ).css( { overflow: 'hidden' } );
			
			switchOriginal( {
				widthStart: photocradle.sizes.preview.width,
				heightStart: photocradle.sizes.preview.height,
				leftStart: photocradle.$element.offset().left - $( document.body ).scrollLeft(),
				topStart: photocradle.$element.offset().top - $( document.body ).scrollTop(),
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
$.photocradle.layer.originalShader = function( photocradle, $layerElement ) {
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
			$( photocradle ).triggerHandler( "originalClose" );
		} );
	
	var updateDim = function() {
		$shader.filter( ':visible' ).css({
			width: $(window).width(),
			height: $(window).height()
		});
	};
	
	var defaultBodyOverflow = $( document.body ).css( 'overflow' );
	
	$( photocradle ).bind( "originalOpen", function() {
		$( document.body ).css( { overflow: 'hidden' } );
		$shader.show();
		updateDim();
		$shader.animate({ opacity: 0.7 }, 'slow' );
	} );
	
	$( photocradle ).bind( "originalClose", function() {
		$shader.animate({ opacity: 0 }, function() {
			$( this ).hide();
			$( document.body ).css( { overflow: defaultBodyOverflow } );
		} );
	} );
	
	// react on window resize
	$( window ).resize( function() {updateDim(); } );
};

// fullscreen controls
$.photocradle.layer.originalControl = function( photocradle, $layerElement ) {
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
			photocradle.setActiveNext();
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
			photocradle.setActivePrev();
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
	
    $( photocradle ).bind( 'originalReady', function() { 
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
	
	$( photocradle ).bind('originalClose', function () { 
        active = false;
        $controls.stop(true, true).fadeOut();
    });
	
	// react on window resize
	$( window ).resize( function() { updateDim(); } );
};

// fullscreen loader
$.photocradle.layer.originalLoader = function( photocradle, $layerElement ) {
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
	
	//$( photocradle ).bind( 'originalOpen', function() { updateDim(); $loader.stop(true, true).show(); } );
	$( photocradle ).bind( 'originalClose', function() { $loader.stop(true, true).hide(); } );
	//$( photocradle ).bind( 'originalPreload', function() { $loader.stop(true, true).show(); } );
	$( photocradle ).bind( 'originalPreview', function() { $loader.stop(true, true).show(); } );
	$( photocradle ).bind( 'originalReady', function() { setTimeout(function() {$loader.stop(true, true).fadeOut();}, 1000); } );
	
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
    
    requester.$element.photocradle(options);
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