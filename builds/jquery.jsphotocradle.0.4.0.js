(function( $ ) {

var debug = false;
debug = window.console != undefined ? debug : false;

//***************************
$.jsphotocradle = {
	options: {
		firstImageIndex: 0,
		borderWeight: 4,
		enableLayers: {}
	},
	
	layer: {}
};

//***************************
$.fn.jsphotocradle = function( options ) {
    opts = {};
    $.extend(opts, $.jsphotocradle.options, options);
    
	return this.each( function() {
		if ( $( this ).find( '.jsphotocradle' ).length == 0 )
			new CTGallery( this, opts );
	});
};

// jsphotocradle constructor
function CTGallery( element, options ) {
	var jsphotocradle = this;
	
	jsphotocradle.options = options;
	jsphotocradle.active = jsphotocradle.preactive = jsphotocradle.options.firstImageIndex;
	
	jsphotocradle.$container = $( element );
	
	var initSizes = (function() {
		var sizes = {};
		sizes.previewWidth = Math.round( jsphotocradle.$container.width() - jsphotocradle.options.borderWeight * 2 );
		sizes.previewHeight = Math.round( ( jsphotocradle.$container.height() - jsphotocradle.options.borderWeight * 3 ) / 5 * 4 );
		sizes.thumbnailWidth = Math.round( ( jsphotocradle.$container.width() - jsphotocradle.options.borderWeight * 6 ) / 5 );
		sizes.thumbnailHeight = Math.round( ( jsphotocradle.$container.height() - jsphotocradle.options.borderWeight * 3 ) / 5 );
		
		return sizes;
	})();
	
	jsphotocradle.sizes = {
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
	
	jsphotocradle.$area = $( '<div class="jsphotocradle" />' )
        .appendTo( document.body );
	
	jsphotocradle.$element = $( '<div class="jsphotocradle-box" />' )
		.css( { 
			position: 'absolute',
			left: jsphotocradle.$container.offset().left,
			top: jsphotocradle.$container.offset().top,
			width: jsphotocradle.$container.width(), 
			height: jsphotocradle.$container.height()
		} )
        // make gallery container overlap other elements
        .mouseover(function () {
            var zIndex = 0;
            $('*').each(function (i, el) {
                var elZIndex = parseInt($(el).css('z-index'));
                zIndex = elZIndex > zIndex ? elZIndex : zIndex;
            });
            jsphotocradle.$element.css({zIndex: ++zIndex});
        })
		.appendTo( jsphotocradle.$area );
	
	// update position on window resize
	$(window).resize(function () {
        jsphotocradle.$element
            .css( { 
                left: jsphotocradle.$container.offset().left,
                top: jsphotocradle.$container.offset().top
            } );
        $(jsphotocradle).trigger('resize');
	});
	
    // build layers
	var i = 0;
	$.each( $.jsphotocradle.layer, function( name, layer ) {
		var $layerElement = $( '<div/>' )
			.css({
				position: 'absolute',
				zIndex: 1000 + i
			})
			.addClass( name )
			.appendTo( jsphotocradle.$element );
			
		new layer( jsphotocradle, $layerElement );
		i++;
	});
	
    // add shader
    var $shader = $( '<div class="jsphotocradle-shader"/>' )
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
		.appendTo( jsphotocradle.$area );
        
	jsphotocradle.$element
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

    //debug ? console.log( jsphotocradle ) : null;
};

// jsphotocradle prototype
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
		var jsphotocradle = this;
		ind = ind == 'active' ? jsphotocradle.active : ind;
		
		var fimage = new FillImage( jsphotocradle.options.images[ ind ][ type ] );
		fimage.width( jsphotocradle.sizes[ type ].width );
		fimage.height( jsphotocradle.sizes[ type ].height );
		
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
		
	// react on image change
	$( jsphotocradle ).bind( 'changeActive', { jsphotocradle: jsphotocradle }, function( e ) {
		var jsphotocradle = e.data.jsphotocradle;
		
		lr.preview.$element.detach();
		
		lr.preview = jsphotocradle.getFillImage( 'preview', 'active' )
			.ready( function( preview ) {
				preview
					.width( jsphotocradle.sizes.preview.width )
					.height( jsphotocradle.sizes.preview.height )
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
          .width( jsphotocradle.sizes.preview.width )
          .height( jsphotocradle.sizes.preview.height )
          .$element
            .appendTo( $frameElement )
            .css({ 
              left: ( jsphotocradle.sizes.preview.width + parseInt( jsphotocradle.options.borderWeight * 5 ) ) * (direction == 'left' ? 1 : -1)
            })
            .stop(true, true)
            .animate( { left: 0 }, 300, 'easeOutExpo' );
      } );
  };
  
	$( jsphotocradle )
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
	var $controlPreview = $( '<div/>' )
		.css({
			position: 'absolute',
			cursor: 'pointer',
			left: Math.round( jsphotocradle.sizes.preview.width / 4 ),
			top: jsphotocradle.options.borderWeight,
			width: Math.round( jsphotocradle.sizes.preview.width / 2 ),
			height: jsphotocradle.sizes.preview.height
		})
		.click( function() {
			$( jsphotocradle ).trigger( 'previewClick' );
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
			jsphotocradle.setActiveNext();
		});
  
    // control pervious
	var $controlPrev = $('<div/>')
		.addClass('control-prev')
		.css({
			position: 'absolute',
			cursor: 'pointer'
		})
		.click(function () {
			jsphotocradle.setActivePrev();
		})
		.appendTo($layerElement);
    
    if (jsphotocradle.sizes.preview.height <= 240) {
        $controlNext.addClass('mini');
        $controlPrev.addClass('mini');
    }
  
    $controlNext.css({
        left: Math.round(jsphotocradle.sizes.preview.width - $controlNext.width() + jsphotocradle.options.borderWeight),
        top: Math.round((jsphotocradle.sizes.preview.height - $controlNext.height()) / 2 + jsphotocradle.options.borderWeight)
    });
  
    $controlPrev.css({
        left: jsphotocradle.options.borderWeight,
        top: Math.round((jsphotocradle.sizes.preview.height - $controlNext.height()) / 2 + jsphotocradle.options.borderWeight)
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
    
    $(jsphotocradle).bind('previewMouseEnter', controlsShowHandler).bind('previewMouseLeave', controlsHideHandler);
    $controlPreview.mouseenter(controlsShowHandler).mouseleave(controlsHideHandler);
    $controlNext.mouseenter(controlsShowHandler).mouseleave(controlsHideHandler);
    $controlPrev.mouseenter(controlsShowHandler).mouseleave(controlsHideHandler);
};

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
			width: jsphotocradle.options.images.length * ( jsphotocradle.sizes.thumbnail.width + jsphotocradle.options.borderWeight ) - jsphotocradle.options.borderWeight,
			height: jsphotocradle.sizes.thumbnail.height + jsphotocradle.options.borderWeight * 2
		})
		.appendTo($thumbPlane);
	
	// create thumbnails elements
	
	var thumbnailList = [];
	$( jsphotocradle.options.images ).each( function( i, img_opts ) {
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
				- parseInt( thumbnailList[ jsphotocradle.active ].$element.css( 'left' ) ) 
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
	
	$( jsphotocradle ).bind( 'changeActive changeActiveNext changeActivePrev', function() {
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
            width: jsphotocradle.options.images.length * ( jsphotocradle.sizes.thumbnail.width + jsphotocradle.options.borderWeight ) + jsphotocradle.options.borderWeight,
            height: jsphotocradle.sizes.thumbnail.height + jsphotocradle.options.borderWeight * 2
        });
        
        return arguments.callee;
	})();
    
    $(jsphotocradle).bind('resize', function () { updatePosition(); });
    
	// create thumbnails elements
	
	var thumbnailList = [];
	$( jsphotocradle.options.images ).each( function( i, img_opts ) {
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
				- parseInt( thumbnailList[ jsphotocradle.active ].$element.css( 'left' ) ) 
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
	$( jsphotocradle ).bind( 'changeActive changeActiveNext changeActivePrev', function() {
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

//init layers order
$.jsphotocradle.layer.originalShader = null;
$.jsphotocradle.layer.original = null;
$.jsphotocradle.layer.originalControl = null;
$.jsphotocradle.layer.originalLoader = null;

// original layer
$.jsphotocradle.layer.original = function( jsphotocradle, $layerElement ) {
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
			
		lr.original = jsphotocradle.getFillImage( 'original', 'active' )
			.preload( function( original ) {
				if ( original.stop )
					return;
        
                $( jsphotocradle ).triggerHandler( "originalPreload" );
				var origDim = calculateOriginalDimentions( original.image.naturalWidth, original.image.naturalHeight );
				
				lr.preview = jsphotocradle.getFillImage( 'preview', 'active' )
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
										
                                    $( jsphotocradle ).triggerHandler( "originalPreview" );
                                    
									original.ready( function( original ) {
										if ( original.stop )
											return;
                    
                                        $( jsphotocradle ).triggerHandler( "originalReady" );
										
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
											$( jsphotocradle ).triggerHandler( "originalClose" );
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
	
	$( jsphotocradle )
		// react on preview click
		.bind( 'previewClick', function() {
			$( jsphotocradle ).triggerHandler( "originalOpen" );
		})
		
		// react on original open
		.bind( 'originalOpen', function() {
			active = true;
			$( document.body ).css( { overflow: 'hidden' } );
			
			switchOriginal( {
				widthStart: jsphotocradle.sizes.preview.width,
				heightStart: jsphotocradle.sizes.preview.height,
				leftStart: jsphotocradle.$element.offset().left - $( document.body ).scrollLeft(),
				topStart: jsphotocradle.$element.offset().top - $( document.body ).scrollTop(),
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
$.jsphotocradle.layer.originalShader = function( jsphotocradle, $layerElement ) {
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
			$( jsphotocradle ).triggerHandler( "originalClose" );
		} );
	
	var updateDim = function() {
		$shader.filter( ':visible' ).css({
			width: $(window).width(),
			height: $(window).height()
		});
	};
	
	var defaultBodyOverflow = $( document.body ).css( 'overflow' );
	
	$( jsphotocradle ).bind( "originalOpen", function() {
		$( document.body ).css( { overflow: 'hidden' } );
		$shader.show();
		updateDim();
		$shader.animate({ opacity: 0.7 }, 'slow' );
	} );
	
	$( jsphotocradle ).bind( "originalClose", function() {
		$shader.animate({ opacity: 0 }, function() {
			$( this ).hide();
			$( document.body ).css( { overflow: defaultBodyOverflow } );
		} );
	} );
	
	// react on window resize
	$( window ).resize( function() {updateDim(); } );
};

// fullscreen controls
$.jsphotocradle.layer.originalControl = function( jsphotocradle, $layerElement ) {
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
			jsphotocradle.setActiveNext();
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
			jsphotocradle.setActivePrev();
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
	
    $( jsphotocradle ).bind( 'originalReady', function() { 
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
	
	$( jsphotocradle ).bind('originalClose', function () { 
        active = false;
        $controls.stop(true, true).fadeOut();
    });
	
	// react on window resize
	$( window ).resize( function() { updateDim(); } );
};

// fullscreen loader
$.jsphotocradle.layer.originalLoader = function( jsphotocradle, $layerElement ) {
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
	
	//$( jsphotocradle ).bind( 'originalOpen', function() { updateDim(); $loader.stop(true, true).show(); } );
	$( jsphotocradle ).bind( 'originalClose', function() { $loader.stop(true, true).hide(); } );
	//$( jsphotocradle ).bind( 'originalPreload', function() { $loader.stop(true, true).show(); } );
	$( jsphotocradle ).bind( 'originalPreview', function() { $loader.stop(true, true).show(); } );
	$( jsphotocradle ).bind( 'originalReady', function() { setTimeout(function() {$loader.stop(true, true).fadeOut();}, 1000); } );
	
	// react on window resize
	$( window ).resize( function() { updateDim(); } );
};

$.jsphotocradleFlickr = {
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
$.fn.jsphotocradleFlickr = function(url, options) {
    opts = {};
	$.extend(opts, $.jsphotocradleFlickr.options, options);
	
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
    
    requester.$element.jsphotocradle(options);
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