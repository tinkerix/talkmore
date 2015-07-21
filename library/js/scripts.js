$ = jQuery;

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
// MIT license
(function() {
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
								   || window[vendors[x]+'CancelRequestAnimationFrame'];
	}
 
	if (!window.requestAnimationFrame)
		window.requestAnimationFrame = function(callback, element) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
			  timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};
 
	if (!window.cancelAnimationFrame)
		window.cancelAnimationFrame = function(id) {
			clearTimeout(id);
		};
}());


// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};


// COMMENTED OUT BEACAUSE OF FAQ PROBLEM
// $(function() {
//   $('a[href*=#]:not([href=#])').click(function() {
//     if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
//       var target = $(this.hash);
//       target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
//       if (target.length) {
//         $('html,body').animate({
//           scrollTop: target.offset().top
//         }, 1000);
//         return false;
//       }
//     }
//   });
// });


/* ::Height Fix on columns */
/* ------------------------------------------------------------ */
function setEqualHeight(columns, flag, minHeight) {
	var flag, minHeight;
	var tallestcolumn = 0;
	if(flag) {
		columns.each(
		function() {
			currentHeight = $(this).height();
			if(currentHeight > tallestcolumn) {
				tallestcolumn  = currentHeight;
				}
			}
		);
		if(minHeight) {
			columns.css('min-height', tallestcolumn);
		} else {
			columns.height(tallestcolumn);
			columns.css('min-height', '');
		}
		
	} else {
		columns.height('');
	}
}




// Accordian for nav services
function enableAccordian(element) {
	$(element).find('.collapse-group').each(function(){
			var self = this;
			// setTimeout(function(){
				$(this).find('.collapse').slideUp();

			// }, 400);
			$(this).find('.collapse-toggle').on('click', function(e){
				e.preventDefault();
				if($(this).parents().find(self).find('.collapse').css('display') === 'block') {
					$(element).find('.collapse-group .collapse').not($(this).parents().find(self).find('.collapse')).slideUp();
				} else {
					$(element).find('.collapse-group .collapse').slideUp();
				}
				// console.log($('#footer-accordion .collapse-group').find('.collapse').length)
				$(this).parents().find(self).find('.collapse').slideToggle();
			});
		});

	// console.log($(element).find('.collapse-group:first-child .collapse').html())
	$(element).find('.collapse-group:first-child .collapse').slideDown();

}

function disableAccordian(element) {
	$(element).find('.collapse-group').each(function(){
		$(this).find('.collapse').slideDown();
		// $(this).find('.collapse-toggle').on('click', function(e){
		// 	e.preventDefault();
		// });
		$(this).find('.collapse-toggle').off('click')
		// $(element).preventDefault();
	});
}




// as the page loads, call these scripts
jQuery(document).ready(function($) {




/* ::Custom JS */
/* ------------------------------------------------------------ */

// Sticky Nav
var stickyNav = debounce(function() {
	$('#header__height').css('height', $('.header').height())
	$('.header').addClass('stickyNav')
}, 500);
$(window).on('ready load', function(){
	stickyNav();
});
// All window.resize would be changed to rAF
$(window).on('resize', function(){
	window.requestAnimationFrame(stickyNav);
})






$('.drop-down-parent:not(.drop-down-nav)').click(function(e) {
	$(this).toggleClass('drop-down-open');
	e.stopPropagation();
})
$(document).on('touchstart click', function(e){
	if ( $(e.target).closest('.drop-down-parent:not(.drop-down-nav)').length === 0 ) {
		$('.drop-down-parent:not(.drop-down-nav)').removeClass('drop-down-open');
	}
});
$('.drop-down-parent').each(function(){
	$(this).find('.drop-down .nav-link').click(function(event) {
		$(this).parents('.drop-down-parent').find('.drop-down-clicker').text($(this).find('p').text());
	});
});


// Hamburger Menu .top-nav.ham-nav
$('.hamburger').on('click', function(){
	if(!$('body').hasClass('hamburger-active')) {
		$('body').addClass('hamburger-active');
	} else  {
		$('body').removeClass('hamburger-active');
	}
});











// Disable hover effects on touches
var isMouseDetected, isTouchDetected;
function touchDetect(event) {
	if (event.type === 'touchstart') {
		isTouchDetected = false;
		if(!isMouseDetected) {
			$('body').addClass('touched')
		}
	}
	$(window).off('touchstart', touchDetect);
}
$(window).on('touchstart', touchDetect);

function mouseDetect(event) {
	if (event.type === 'mousemove') {
		isMouseDetected = true;
		$('body').removeClass('touched')
	}
	$(window).off('mousemove', mouseDetect);
}
$(window).on('mousemove', mouseDetect);






// Parallax Hero Units

/* Scroll animate function by invisionapp.com blog
 *
 *
 *
 */
var animate = function(element, duration, translate, scale) {
	
	TweenLite.to(element, duration, {
		force3D: true,
		y: translate,
		scale: scale,
		ease: Cubic.easeOut,
		// opacity: opacity
	});

};
var scrollPosition = function(scrollTop) {
	if (scrollTop <= $('.hero-unit--animate').height()) {
		animate($('.hero-unit--animate .bo--overlay__block'), 0, (scrollTop / 1) * 1, (scrollTop / 2000) + 1);
	}
};

// IN TESTING I FOUND WHEN YOU TOUCH ON A DEVICE WITH TOUCH AND MOUSE IT WILL REGISTER A TOUCH EVENT AND THE FUNCTION CALLS INSIDE IT WONT RUN.
// THIS BEHAVIOUR IS UNVOIDABLE FOR NOW. WILL LOOK INTO IT LATER OR IF SOMEONE HAS A BETTER SOLUTION IT WOULD BE AWESOME.
// PS: IF YOU FIND SOME SOLUTION MESSAGE TWEET ME AT @virajs0ni
function mouseInteractions(event) {
	if (event.type === 'mousemove' && event.type !== 'touchstart') {
		initializeMouseBehavior();
		// return true;
	}
	$(window).off('touchstart mousemove', mouseInteractions);
}
$(window).on('touchstart mousemove', mouseInteractions);
function initializeMouseBehavior() {
	scrollPosition( $(this).scrollTop() );
	$(window).on('scroll', function() {
		// scrollPosition( $(this).scrollTop().bind(this) );
		window.requestAnimationFrame(function(){
			scrollPosition( $(this).scrollTop() );
		});
	});
}











// Scroll Reveal on components when they come in viewport
var config = {
	enter:    'bottom',
	move:     '30px',
	over:     '0.6s',
	easing:   'cubic-bezier(0.42, 0, 0, 1)',

	scale:    { direction: 'up', power: '50%' },
	rotate:   { x: 0, y: 0, z: 0 },

	opacity:  0,
	mobile:   false,
	reset:    false,
	vFactor:  0.30,
}
window.sr = new scrollReveal(config);


















// TODO: MOVE TO SPECIFIC PAGES ONLY WHICH HAVE BAND OVER'S
/* ::Band-over function */
/* ------------------------------------------------------------ */
var bottomMarginOffset;

var bandParent;
var bandParentTop;
var bandHeight;
var verticalCenter = true;

var bands = document.getElementsByClassName('band-over-block');
function alginBandOver() {

	for(var i = 0; i<bands.length;i++) {
		var band = bands[i];
	if($(band).hasClass('no-band-margin')) {
			bottomMarginOffset = 0;
		} else {
			// bottomMarginOffset = 130;
			bottomMarginOffset = 0;
		}
		bandParent = $(band).closest('.bo-parent');
		bandParentTop = bandParent.prev();
		if(verticalCenter) {
			bandHeight = band.clientHeight;
		} else {
			bandHeight = 80;
		}
		$(band).css({
			'margin-top': -bandHeight/2/*,
			'margin-bottom': bottomMarginOffset*/
		}).addClass('margin-bottom-'+bottomMarginOffset);
		bandParentTop.css('padding-bottom', (bandHeight/2));
		
		/***************
		** SPECIAL CASE FOR CURRENT WEBSITE ONLY (HOSTMAKER.CO). DELETE THIS CODE WHEN USING IN OTHER WEBSITES
		***************/
		/**********OLD CODE**********/
		// bandParentTop.css('padding-bottom', (bandHeight/2));

		/**********NEW CODE**********/
		if(bandParentTop.hasClass('hero-unit--container')) {
			bandParentTop.find('.hero-unit--center').css({
				'height' : '100%'
			});
			bandParentTop.find('.hero-unit--content-container').css({
				'margin-top' : -bandHeight/4
			});
			debounce(function() {
				if(verticalCenter) {
					bandParentTop.find('.hero-unit--center').css({
						'height' : (bandHeight/2) + parseInt( $('.hero-unit--center').height() )
					})
				} else {
					bandParentTop.find('.hero-unit--center').css({
						'height' : (bandHeight/2) + parseInt( $('.hero-unit--center').height() )
					});
				}
			}, 250)();
		}
	}
}

var alginBandOverONRESIZE = debounce(function() {
	alginBandOver();
}, 250);











if( $('body').hasClass('page-template-page-global-contact') || $('body').hasClass('page-template-page-about') ) {

	var infoboxEqualHeights = debounce(function() {
		var eqHeightElement = $('.ib--infobox .ib__content-outer');
		eqHeightElement.css('height','auto'); //solve for all you browser stretchers out there!
		setEqualHeight(eqHeightElement, true, false);
	}, 500);

	$(window).on('ready load', function(){
		infoboxEqualHeights();
	});
	// All window.resize would be changed to rAF
	$(window).on('resize', function(){
		window.requestAnimationFrame(infoboxEqualHeights);
	})

}




if( $('body').hasClass('page-template-page-about') ) {

	var about_bandOver_equalHeights = debounce(function() {
		var eqHeightElement = $('._container--values .band-over-block .bo-inner div');
		eqHeightElement.css('height','auto'); //solve for all you browser stretchers out there!
		setEqualHeight(eqHeightElement, true, false);
	}, 500);
	$(window).on('ready load', function(){
		about_bandOver_equalHeights();
	});
	// All window.resize would be changed to rAF
	$(window).on('resize', function(){
		window.requestAnimationFrame(about_bandOver_equalHeights);
	});

}




















var columnContent_equalHeights = debounce(function() {
	$('.cc-container__row').each(function(){
		var eqHeightElement = $(this).find('.cc-image-title-copy')
		eqHeightElement.css('height','auto'); //solve for all you browser stretchers out there!
		setEqualHeight(eqHeightElement, true, false);
		// toggle_equalHeights(eqHeightElement, is_480)
	});
}, 500);

$(window).on('ready load', function(){
	if(typeof is_480 !== "undefined" && is_480 === true) {
		$('.cc-container__row').each(function(){
			var eqHeightElement = $(this).find('.cc-image-title-copy')
			eqHeightElement.css('height','auto'); //solve for all you browser stretchers out there!
		});
	} else {
		columnContent_equalHeights();
	}
});
// All window.resize would be changed to rAF
$(window).on('resize', function(){
	if(typeof is_480 !== "undefined" && is_480 === true) {
		$('.cc-container__row').each(function(){
			var eqHeightElement = $(this).find('.cc-image-title-copy')
			eqHeightElement.css('height','auto'); //solve for all you browser stretchers out there!
		});
	} else {
		window.requestAnimationFrame(columnContent_equalHeights);
	}
})


// #CREATE A EQUAL HEIGHT TOGGLING FUNCTION
// function toggle_equalHeights(_eqHeightElement, disableBreakpoint) {
// 	if(typeof disableBreakpoint !== "undefined" && disableBreakpoint === true) {
// 		eqHeightElement = _eqHeightElement;
// 		eqHeightElement.css('height','auto'); //solve for all you browser stretchers out there!
// 	} else {
// 		// equalheightFunction;
// 		setEqualHeight(eqHeightElement, true, false);
// 	}
// }



if( $('body').hasClass('page-template-page-careers') ) {

	var careerCard_equalHeights = debounce(function() {
		var eqHeightElement = $('.ib--career-card .career-card__outer');
		eqHeightElement.css('height','auto'); //solve for all you browser stretchers out there!
		setEqualHeight(eqHeightElement, true, false);
	}, 500);

	$(window).on('ready load', function(){
		careerCard_equalHeights();
	});
	// All window.resize would be changed to rAF
	$(window).on('resize', function(){
		window.requestAnimationFrame(careerCard_equalHeights);
	});	


	// TODO: LOAD ON CAREERS PAGE only
	$(".hero-unit--center__content a").click(function(e) {
		e.preventDefault();
		$('html, body').animate({
			scrollTop: $($(".hero-unit--center__content a").attr('href')).offset().top
		}, 2000);
	});




}




var pricingCard_equalHeights = debounce(function() {
	var eqHeightElement = $('.pricing-cards__outer .cc__copy, .pricing-cards__outer .cc__title');
	eqHeightElement.css('height','auto'); //solve for all you browser stretchers out there!
	setEqualHeight(eqHeightElement, true, false);
}, 500);

$(window).on('ready load', function(){
	pricingCard_equalHeights();
});
// All window.resize would be changed to rAF
$(window).on('resize', function(){
	window.requestAnimationFrame(pricingCard_equalHeights);
});


























// DETECT IS IT A TAP OR CLICK, BASED ON IT RUN THE SPECIFIC CODE. 
// HERE IT IS CHECKING IS IT A TAP OR A CLICK ON NAV DROPDOWN
$(document).on('touchstart mouseenter mouseleave', function(e){
	if ( $(e.target).closest('.drop-down-nav').length === 0 ) {
		$('.drop-down-nav').removeClass('drop-down-open');
	}
});


$('.drop-down-nav').each(function(){
	$(this).on('touchstart mouseenter mouseleave', function(e) {
		if (e.type === 'touchstart' || e.type === 'touchstart' && e.type === 'mouseenter' || e.type === 'touchstart' && e.type === 'mouseleave') {
			$(this).find('.drop-down-clicker a').click(function(e){
				return false;
			})
			// console.log('Touch interaction!');
			$(this).addClass('drop-down-open');
			return true;
		}
		else if (e.type === 'mouseenter' && e.type !== 'touchstart') {
			// console.log('Mouse interaction!');
			$(this).addClass('drop-down-open');
			return true;
		}
		else if (e.type === 'mouseleave') {
			// console.log('Mouse out!');
			$(this).removeClass('drop-down-open');
			return true;
		}
	});
});























































// Media queries | Enquirejs


	var maxQuery_767 = "screen and (max-width: 767px)",
		maxHandle_767 = {
			setup : function(){
				$('body').addClass('max767');
			},
			match : function(){
				$('body').addClass('max767');
				enable_767_responsive();
			},
			unmatch : function(){
				$('body').removeClass('max767');
				disable_767_responsive();
			},
			deferSetup: true
		};
		enquire.register(maxQuery_767, maxHandle_767);



		function enable_767_responsive() {
			verticalCenter = false;
			
			// Navigation Accordian
			$('.nav-links-floated').each(function(){
				enableAccordian(this);
			});

		}
		function disable_767_responsive() {
			verticalCenter = true;

			// Navigation Accordian
			$('.nav-links-floated').each(function(){
				disableAccordian(this);
			});

		}








	var maxQuery_480 = "screen and (max-width: 480px)",
		maxHandle_480 = {
			setup : function(){
				$('body').addClass('max480');
				var is_480 = true;
			},
			match : function(){
				$('body').addClass('max480');
				enable_480_responsive();
			},
			unmatch : function(){
				$('body').removeClass('max480');
				disable_480_responsive();
			},
			deferSetup: true
		};
		enquire.register(maxQuery_480, maxHandle_480);



		function enable_480_responsive() {
			is_480 = true;
		}
		function disable_480_responsive() {
			is_480 = false;
		}







	// The functions are run here so that the variables are initialized based on the media queries.
	// Eg: verticalCenter is set to false below 767px. If the function runs before the variable is set then it will fire the wrong statement.
	alginBandOver();
	window.addEventListener('resize', function(){
		window.requestAnimationFrame(alginBandOverONRESIZE);		
	});






	/*---------- Smooth Scroll Function ---------------*/

	$.fn.scrollView = function () {
	  return this.each(function () {
		  $('html, body').animate({
			  scrollTop: $(this).offset().top - 80
		  }, 1000);
	  });
	}

	if(location.hash) {
		$(location.hash).scrollView();
	}


 
});