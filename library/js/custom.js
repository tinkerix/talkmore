//
// SmoothScroll for websites v1.3.8 (Balazs Galambosi)
// Licensed under the terms of the MIT license.
//
// You may use it in your theme if you credit me. 
// It is also free to use on any individual website.
//
// Exception:
// The only restriction would be not to publish any  
// extension for browsers or native application
// without getting a written permission first.
//
 
(function () {
  
// Scroll Variables (tweakable)
var defaultOptions = {
 
    // Scrolling Core
    frameRate        : 150, // [Hz]
    animationTime    : 400, // [px]
    stepSize         : 120, // [px]
 
    // Pulse (less tweakable)
    // ratio of "tail" to "acceleration"
    pulseAlgorithm   : true,
    pulseScale       : 4,
    pulseNormalize   : 1,
 
    // Acceleration
    accelerationDelta : 20,  // 20
    accelerationMax   : 1,   // 1
 
    // Keyboard Settings
    keyboardSupport   : true,  // option
    arrowScroll       : 50,     // [px]
 
    // Other
    touchpadSupport   : true,
    fixedBackground   : true, 
    excluded          : ''    
};
 
var options = defaultOptions;
 
 
// Other Variables
var isExcluded = false;
var isFrame = false;
var direction = { x: 0, y: 0 };
var initDone  = false;
var root = document.documentElement;
var activeElement;
var observer;
var deltaBuffer = [];
var isMac = /^Mac/.test(navigator.platform);
 
var key = { left: 37, up: 38, right: 39, down: 40, spacebar: 32, 
            pageup: 33, pagedown: 34, end: 35, home: 36 };
 
 
/***********************************************
 * SETTINGS
 ***********************************************/
 
var options = defaultOptions;
 
 
/***********************************************
 * INITIALIZE
 ***********************************************/
 
/**
 * Tests if smooth scrolling is allowed. Shuts down everything if not.
 */
function initTest() {
    if (options.keyboardSupport) {
        addEvent('keydown', keydown);
    }
}
 
/**
 * Sets up scrolls array, determines if frames are involved.
 */
function init() {
  
    if (initDone || !document.body) return;
 
    initDone = true;
 
    var body = document.body;
    var html = document.documentElement;
    var windowHeight = window.innerHeight; 
    var scrollHeight = body.scrollHeight;
    
    // check compat mode for root element
    root = (document.compatMode.indexOf('CSS') >= 0) ? html : body;
    activeElement = body;
    
    initTest();
 
    // Checks if this script is running in a frame
    if (top != self) {
        isFrame = true;
    }
 
    /**
     * This fixes a bug where the areas left and right to 
     * the content does not trigger the onmousewheel event
     * on some pages. e.g.: html, body { height: 100% }
     */
    else if (scrollHeight > windowHeight &&
            (body.offsetHeight <= windowHeight || 
             html.offsetHeight <= windowHeight)) {
 
        $.getDocHeight = function(){
        return Math.max(
            $(document).height(),
            $(window).height(),
            /* For opera: */
            document.documentElement.clientHeight
            );
        };
        var fullPageElem = document.createElement('div');
        fullPageElem.style.cssText = 'position:absolute; z-index:-10000; ' +
                                     'top:0; left:0; right:0; height:' + 
                                      $.getDocHeight() + 'px';
        fullPageElem.className = "fullPageElem";
        document.body.appendChild(fullPageElem);
        
        // DOM changed (throttled) to fix height
        var pendingRefresh;
        $(window).resize(function(){
                console.log('resize done');
                fullPageElem.style.height = '0';
                fullPageElem.style.height = $.getDocHeight()+ 'px';
        });
        var refresh = function () {
            if (pendingRefresh) return; // could also be: clearTimeout(pendingRefresh);
            pendingRefresh = setTimeout(function () {
                if (isExcluded) return; // could be running after cleanup
                fullPageElem.style.height = '0';
                fullPageElem.style.height = $.getDocHeight() + 'px';
                pendingRefresh = null;
            }, 500); // act rarely to stay fast
        };
  
        setTimeout(refresh, 10);
 
        // TODO: attributeFilter?
        var config = {
            attributes: true, 
            childList: true, 
            characterData: false 
            // subtree: true
        };
 
        observer = new MutationObserver(refresh);
        observer.observe(body, config);
 
        if (root.offsetHeight <= windowHeight) {
            var clearfix = document.createElement('div');   
            clearfix.style.clear = 'both';
            body.appendChild(clearfix);
        }
    }
 
    // disable fixed background
    if (!options.fixedBackground && !isExcluded) {
        body.style.backgroundAttachment = 'scroll';
        html.style.backgroundAttachment = 'scroll';
    }
}
 
/**
 * Removes event listeners and other traces left on the page.
 */
function cleanup() {
    observer && observer.disconnect();
    removeEvent(wheelEvent, wheel);
    removeEvent('mousedown', mousedown);
    removeEvent('keydown', keydown);
}
 
 
/************************************************
 * SCROLLING 
 ************************************************/
 
var que = [];
var pending = false;
var lastScroll = Date.now();
 
/**
 * Pushes scroll actions to the scrolling queue.
 */
function scrollArray(elem, left, top) {
    
    directionCheck(left, top);
 
    if (options.accelerationMax != 1) {
        var now = Date.now();
        var elapsed = now - lastScroll;
        if (elapsed < options.accelerationDelta) {
            var factor = (1 + (50 / elapsed)) / 2;
            if (factor > 1) {
                factor = Math.min(factor, options.accelerationMax);
                left *= factor;
                top  *= factor;
            }
        }
        lastScroll = Date.now();
    }          
    
    // push a scroll command
    que.push({
        x: left, 
        y: top, 
        lastX: (left < 0) ? 0.99 : -0.99,
        lastY: (top  < 0) ? 0.99 : -0.99, 
        start: Date.now()
    });
        
    // don't act if there's a pending queue
    if (pending) {
        return;
    }  
 
    var scrollWindow = (elem === document.body);
    
    var step = function (time) {
        
        var now = Date.now();
        var scrollX = 0;
        var scrollY = 0; 
    
        for (var i = 0; i < que.length; i++) {
            
            var item = que[i];
            var elapsed  = now - item.start;
            var finished = (elapsed >= options.animationTime);
            
            // scroll position: [0, 1]
            var position = (finished) ? 1 : elapsed / options.animationTime;
            
            // easing [optional]
            if (options.pulseAlgorithm) {
                position = pulse(position);
            }
            
            // only need the difference
            var x = (item.x * position - item.lastX) >> 0;
            var y = (item.y * position - item.lastY) >> 0;
            
            // add this to the total scrolling
            scrollX += x;
            scrollY += y;            
            
            // update last values
            item.lastX += x;
            item.lastY += y;
        
            // delete and step back if it's over
            if (finished) {
                que.splice(i, 1); i--;
            }           
        }
 
        // scroll left and top
        if (scrollWindow) {
            window.scrollBy(scrollX, scrollY);
        } 
        else {
            if (scrollX) elem.scrollLeft += scrollX;
            if (scrollY) elem.scrollTop  += scrollY;                    
        }
        
        // clean up if there's nothing left to do
        if (!left && !top) {
            que = [];
        }
        
        if (que.length) { 
            requestFrame(step, elem, (1000 / options.frameRate + 1)); 
        } else { 
            pending = false;
        }
    };
    
    // start a new queue of actions
    requestFrame(step, elem, 0);
    pending = true;
}
 
 
/***********************************************
 * EVENTS
 ***********************************************/
 
/**
 * Mouse wheel handler.
 * @param {Object} event
 */
function wheel(event) {
 
    if (!initDone) {
        init();
    }
    
    var target = event.target;
    var overflowing = overflowingAncestor(target);
 
    // use default if there's no overflowing
    // element or default action is prevented   
    // or it's a zooming event with CTRL 
    if (!overflowing || event.defaultPrevented || event.ctrlKey) {
        return true;
    }
    
    // leave embedded content alone (flash & pdf)
    if (isNodeName(activeElement, 'embed') || 
       (isNodeName(target, 'embed') && /\.pdf/i.test(target.src)) ||
       isNodeName(activeElement, 'object')) {
        return true;
    }
 
    var deltaX = -event.wheelDeltaX || event.deltaX || 0;
    var deltaY = -event.wheelDeltaY || event.deltaY || 0;
    
    if (isMac) {
        if (event.wheelDeltaX && isDivisible(event.wheelDeltaX, 120)) {
            deltaX = -120 * (event.wheelDeltaX / Math.abs(event.wheelDeltaX));
        }
        if (event.wheelDeltaY && isDivisible(event.wheelDeltaY, 120)) {
            deltaY = -120 * (event.wheelDeltaY / Math.abs(event.wheelDeltaY));
        }
    }
    
    // use wheelDelta if deltaX/Y is not available
    if (!deltaX && !deltaY) {
        deltaY = -event.wheelDelta || 0;
    }
 
    // line based scrolling (Firefox mostly)
    if (event.deltaMode === 1) {
        deltaX *= 40;
        deltaY *= 40;
    }
    
    // check if it's a touchpad scroll that should be ignored
    if (!options.touchpadSupport && isTouchpad(deltaY)) {
        return true;
    }
 
    // scale by step size
    // delta is 120 most of the time
    // synaptics seems to send 1 sometimes
    if (Math.abs(deltaX) > 1.2) {
        deltaX *= options.stepSize / 120;
    }
    if (Math.abs(deltaY) > 1.2) {
        deltaY *= options.stepSize / 120;
    }
    
    scrollArray(overflowing, deltaX, deltaY);
    event.preventDefault();
    scheduleClearCache();
}
 
/**
 * Keydown event handler.
 * @param {Object} event
 */
function keydown(event) {
 
    var target   = event.target;
    var modifier = event.ctrlKey || event.altKey || event.metaKey || 
                  (event.shiftKey && event.keyCode !== key.spacebar);
    
    // our own tracked active element could've been removed from the DOM
    if (!document.contains(activeElement)) {
        activeElement = document.activeElement;
    }
 
    // do nothing if user is editing text
    // or using a modifier key (except shift)
    // or in a dropdown
    // or inside interactive elements
    var inputNodeNames = /^(textarea|select|embed|object)$/i;
    var buttonTypes = /^(button|submit|radio|checkbox|file|color|image)$/i;
    if ( inputNodeNames.test(target.nodeName) ||
         isNodeName(target, 'input') && !buttonTypes.test(target.type) ||
         isNodeName(activeElement, 'video') ||
         isInsideYoutubeVideo(event) ||
         target.isContentEditable || 
         event.defaultPrevented   ||
         modifier ) {
      return true;
    }
    
    // spacebar should trigger button press
    if ((isNodeName(target, 'button') ||
         isNodeName(target, 'input') && buttonTypes.test(target.type)) &&
        event.keyCode === key.spacebar) {
      return true;
    }
    
    var shift, x = 0, y = 0;
    var elem = overflowingAncestor(activeElement);
    var clientHeight = elem.clientHeight;
 
    if (elem == document.body) {
        clientHeight = window.innerHeight;
    }
 
    switch (event.keyCode) {
        case key.up:
            y = -options.arrowScroll;
            break;
        case key.down:
            y = options.arrowScroll;
            break;         
        case key.spacebar: // (+ shift)
            shift = event.shiftKey ? 1 : -1;
            y = -shift * clientHeight * 0.9;
            break;
        case key.pageup:
            y = -clientHeight * 0.9;
            break;
        case key.pagedown:
            y = clientHeight * 0.9;
            break;
        case key.home:
            y = -elem.scrollTop;
            break;
        case key.end:
            var damt = elem.scrollHeight - elem.scrollTop - clientHeight;
            y = (damt > 0) ? damt+10 : 0;
            break;
        case key.left:
            x = -options.arrowScroll;
            break;
        case key.right:
            x = options.arrowScroll;
            break;            
        default:
            return true; // a key we don't care about
    }
 
    scrollArray(elem, x, y);
    event.preventDefault();
    scheduleClearCache();
}
 
/**
 * Mousedown event only for updating activeElement
 */
function mousedown(event) {
    activeElement = event.target;
}
 
 
/***********************************************
 * OVERFLOW
 ***********************************************/
 
var uniqueID = (function () {
    var i = 0;
    return function (el) {
        return el.uniqueID || (el.uniqueID = i++);
    };
})();
 
var cache = {}; // cleared out after a scrolling session
var clearCacheTimer;
 
//setInterval(function () { cache = {}; }, 10 * 1000);
 
function scheduleClearCache() {
    clearTimeout(clearCacheTimer);
    clearCacheTimer = setInterval(function () { cache = {}; }, 1*1000);
}
 
function setCache(elems, overflowing) {
    for (var i = elems.length; i--;)
        cache[uniqueID(elems[i])] = overflowing;
    return overflowing;
}
 
//  (body)                (root)
//         | hidden | visible | scroll |  auto  |
// hidden  |   no   |    no   |   YES  |   YES  |
// visible |   no   |   YES   |   YES  |   YES  |
// scroll  |   no   |   YES   |   YES  |   YES  |
// auto    |   no   |   YES   |   YES  |   YES  |
 
function overflowingAncestor(el) {
    var elems = [];
    var body = document.body;
    var rootScrollHeight = root.scrollHeight;
    do {
        var cached = cache[uniqueID(el)];
        if (cached) {
            return setCache(elems, cached);
        }
        elems.push(el);
        if (rootScrollHeight === el.scrollHeight) {
            var topOverflowsNotHidden = overflowNotHidden(root) && overflowNotHidden(body);
            var isOverflowCSS = topOverflowsNotHidden || overflowAutoOrScroll(root);
            if (isFrame && isContentOverflowing(root) || 
               !isFrame && isOverflowCSS) {
                return setCache(elems, getScrollRoot()); 
            }
        } else if (isContentOverflowing(el) && overflowAutoOrScroll(el)) {
            return setCache(elems, el);
        }
    } while (el = el.parentElement);
}
 
function isContentOverflowing(el) {
    return (el.clientHeight + 10 < el.scrollHeight);
}
 
// typically for <body> and <html>
function overflowNotHidden(el) {
    var overflow = getComputedStyle(el, '').getPropertyValue('overflow-y');
    return (overflow !== 'hidden');
}
 
// for all other elements
function overflowAutoOrScroll(el) {
    var overflow = getComputedStyle(el, '').getPropertyValue('overflow-y');
    return (overflow === 'scroll' || overflow === 'auto');
}
 
 
/***********************************************
 * HELPERS
 ***********************************************/
 
function addEvent(type, fn) {
    window.addEventListener(type, fn, false);
}
 
function removeEvent(type, fn) {
    window.removeEventListener(type, fn, false);  
}
 
function isNodeName(el, tag) {
    return (el.nodeName||'').toLowerCase() === tag.toLowerCase();
}
 
function directionCheck(x, y) {
    x = (x > 0) ? 1 : -1;
    y = (y > 0) ? 1 : -1;
    if (direction.x !== x || direction.y !== y) {
        direction.x = x;
        direction.y = y;
        que = [];
        lastScroll = 0;
    }
}
 
var deltaBufferTimer;
 
if (window.localStorage && localStorage.SS_deltaBuffer) {
    deltaBuffer = localStorage.SS_deltaBuffer.split(',');
}
 
function isTouchpad(deltaY) {
    if (!deltaY) return;
    if (!deltaBuffer.length) {
        deltaBuffer = [deltaY, deltaY, deltaY];
    }
    deltaY = Math.abs(deltaY)
    deltaBuffer.push(deltaY);
    deltaBuffer.shift();
    clearTimeout(deltaBufferTimer);
    deltaBufferTimer = setTimeout(function () {
        if (window.localStorage) {
            localStorage.SS_deltaBuffer = deltaBuffer.join(',');
        }
    }, 1000);
    return !allDeltasDivisableBy(120) && !allDeltasDivisableBy(100);
} 
 
function isDivisible(n, divisor) {
    return (Math.floor(n / divisor) == n / divisor);
}
 
function allDeltasDivisableBy(divisor) {
    return (isDivisible(deltaBuffer[0], divisor) &&
            isDivisible(deltaBuffer[1], divisor) &&
            isDivisible(deltaBuffer[2], divisor));
}
 
function isInsideYoutubeVideo(event) {
    var elem = event.target;
    var isControl = false;
    if (document.URL.indexOf ('www.youtube.com/watch') != -1) {
        do {
            isControl = (elem.classList && 
                         elem.classList.contains('html5-video-controls'));
            if (isControl) break;
        } while (elem = elem.parentNode);
    }
    return isControl;
}
 
var requestFrame = (function () {
      return (window.requestAnimationFrame       || 
              window.webkitRequestAnimationFrame || 
              window.mozRequestAnimationFrame    ||
              function (callback, element, delay) {
                 window.setTimeout(callback, delay || (1000/60));
             });
})();
 
var MutationObserver = (window.MutationObserver || 
                        window.WebKitMutationObserver ||
                        window.MozMutationObserver);  
 
var getScrollRoot = (function() {
  var SCROLL_ROOT;
  return function() {
    if (!SCROLL_ROOT) {
      var dummy = document.createElement('div');
      dummy.style.cssText = 'height:10000px;width:1px;';
      document.body.appendChild(dummy);
      var bodyScrollTop  = document.body.scrollTop;
      var docElScrollTop = document.documentElement.scrollTop;
      window.scrollBy(0, 1);
      if (document.body.scrollTop != bodyScrollTop)
        (SCROLL_ROOT = document.body);
      else 
        (SCROLL_ROOT = document.documentElement);
      window.scrollBy(0, -1);
      document.body.removeChild(dummy);
    }
    return SCROLL_ROOT;
  };
})();
 
 
/***********************************************
 * PULSE (by Michael Herf)
 ***********************************************/
 
/**
 * Viscous fluid with a pulse for part and decay for the rest.
 * - Applies a fixed force over an interval (a damped acceleration), and
 * - Lets the exponential bleed away the velocity over a longer interval
 * - Michael Herf, http://stereopsis.com/stopping/
 */
function pulse_(x) {
    var val, start, expx;
    // test
    x = x * options.pulseScale;
    if (x < 1) { // acceleartion
        val = x - (1 - Math.exp(-x));
    } else {     // tail
        // the previous animation ended here:
        start = Math.exp(-1);
        // simple viscous drag
        x -= 1;
        expx = 1 - Math.exp(-x);
        val = start + (expx * (1 - start));
    }
    return val * options.pulseNormalize;
}
 
function pulse(x) {
    if (x >= 1) return 1;
    if (x <= 0) return 0;
 
    if (options.pulseNormalize == 1) {
        options.pulseNormalize /= pulse_(1);
    }
    return pulse_(x);
}
 
var wheelEvent;
if ('onwheel' in document.createElement('div'))
    wheelEvent = 'wheel';
else if ('onmousewheel' in document.createElement('div'))
    wheelEvent = 'mousewheel';
 
if (wheelEvent) {
    addEvent(wheelEvent, wheel);
    addEvent('mousedown', mousedown);
    addEvent('load', init);
}
 
})();













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


jQuery(document).ready(function($) {

if (!Modernizr.svg) {
	 var img = $("img[src$='.svg']").each(function() {
		 var src = $(this).attr("src"); 
		 var path = src.substring(0,src.lastIndexOf('/')); 
		 var fileName = src.substring(src.lastIndexOf('/'));
		 var newSrc = path+fileName.replace("svg","png");
		 $(this).attr("src",newSrc);
	 });
}



$(function() {
  $('a[href*=#]:not([href=#]):not(a[data-toggle="tab"])').click(function() {
	if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
	  var target = $(this.hash);
	  target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
	  if (target.length) {
		$('html,body').animate({
		  scrollTop: target.offset().top
		}, 1000);
		return false;
	  }
	}
  });
});



// Set slide width





var appScreenWidth = debounce(function() {
	$('.appscreens-frame').width( $('.appscreens--phoneFrame img').outerWidth() );
}, 500);
$(window).on('load', function(){

	appScreenWidth();
});
// All window.resize would be changed to rAF
$(window).on('resize', function(){
	window.requestAnimationFrame(appScreenWidth);
});





var controller = new ScrollMagic.Controller();

var tween = TweenMax.fromTo($('.appscreens-frame'), 0.0001,
	{y: '16%'},
	{y: '105%', force3D: true, ease: Cubic.easeOut}
);


var scene = new ScrollMagic.Scene({triggerElement: $("#phone__trigger"), duration: $('._container__mobile-2').position().top - 150, triggerHook: 0})
	.setTween(tween);
	// .addIndicators({name: "Trigger"}) // add indicators (requires plugin)
	// .addTo(controller);

var touchScene = new ScrollMagic.Scene({triggerElement: "#howitworks", duration: 100, triggerHook: 0.5})
	// .addIndicators({name: "Touch Trigger"}) // add indicators (requires plugin)
	.addTo(controller);

var slider = $('.appscreens--phone-1st-fold .ui-slider');
var slide = slider.find('.ui-slide');
var slideCount = slide.length;
var current = 1, prev = slideCount;
function ui_slider() {

	slider.addClass('slide-'+current);
	slider.removeClass('slide-'+prev);
	prev = current;
	if(current >= slideCount) {
		current = 0;
	}
	current++;
	
}
// ui_slider();
// var moveSlide = setInterval(ui_slider, 2000);


var moveSlide;
// scene.on("leave", sceneLeave);
function sceneLeave() {
	$('.appscreens--phone-1st-fold').hide();
	$('.appscreens--phone-2nd-fold').show();
	clearInterval(moveSlide);
}

// scene.on("enter", sceneEnter);
function sceneEnter() {
	$('.appscreens--phone-1st-fold').show();
	$('.appscreens--phone-2nd-fold').hide();
	moveSlide = setInterval(ui_slider, 2000);
}


// Use scene.progress when touch device is detected and change the animation
var runSlider, runTabs = true;
function sceneProgress(event) {
	if(event.progress > 0.8) {
		$('.appscreens-frame').addClass('scrollDown');
		if(runSlider) {
			// clearInterval(moveSlide);
			sceneLeave();
			runSlider = false;
			runTabs = true;
		}
	} else {
		$('.appscreens-frame').removeClass('scrollDown');
		if(runTabs) {
			sceneEnter();
			runTabs = false;
			runSlider = true;
		}
	}
}





$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
	console.log($(this).attr('href'))
	$('.ui-feature').fadeOut();
	switch( $(this).attr('href') ) {
		case '#usage': $('#ui-feature-1').fadeIn();
		break;
		case '#recommendation': $('#ui-feature-2').fadeIn();
		break;
		case '#manage': $('#ui-feature-3').fadeIn();
		break;
        case '#bill': $('#ui-feature-4').fadeIn();
        break;
	}
});



// Load Retina images
$('img').dense({
	glue: '@'
});




// IN TESTING I FOUND WHEN YOU TOUCH ON A DEVICE WITH TOUCH AND MOUSE IT WILL REGISTER A TOUCH EVENT AND THE FUNCTION CALLS INSIDE IT WONT RUN.
// THIS BEHAVIOUR IS UNVOIDABLE FOR NOW. WILL LOOK INTO IT LATER OR IF SOMEONE HAS A BETTER SOLUTION IT WOULD BE AWESOME.
// PS: IF YOU FIND SOME SOLUTION MESSAGE TWEET ME AT @virajs0ni
// function mouseInteractions(event) {
// 	if (event.type === 'mousemove' && event.type !== 'touchstart') {
// 		initializeMouseBehavior();
// 		// return true;
// 	}
// 	$(window).off('touchstart mousemove', mouseInteractions);
// }
// $(window).on('touchstart mousemove', mouseInteractions);
// function initializeMouseBehavior() {

// 	scene.addTo(controller);
// 	scene.on("leave", sceneLeave);
// 	scene.on("enter", sceneEnter);

// }

scene.addTo(controller);
scene.on("leave", sceneLeave);
scene.on("enter", sceneEnter);
touchScene.off("progress", sceneProgress);
function touchInteractions(event) {
	if (event.type !== 'mousemove' && event.type === 'touchstart') {
		initializeTouchBehavior();
	} else {
		initializeMouseBehavior();
	}
	$(window).off('mousemove touchstart', touchInteractions);
}
$(window).on('mousemove touchstart', touchInteractions);
function initializeTouchBehavior() {
	$('html').removeClass('mousePresent').addClass('touchPresent')
	scene.remove();
	scene.off("leave", sceneLeave);
	scene.off("enter", sceneEnter);
	// sceneLeave(); // Call it once to clear the settimeout interval
	clearInterval(moveSlide); // Call it once to clear the settimeout interval



	touchScene.on("progress", sceneProgress);
}
function initializeMouseBehavior() {
	$('html').addClass('mousePresent').removeClass('touchPresent');
}











// Disable hover effects on touches
var isMouseDetected, isTouchDetected;
function mouseDetect(event) {
	if (event.type === 'mousemove') {
		isMouseDetected = true;
		$('body').removeClass('touched');
	}
	$(window).off('mousemove', mouseDetect);
}
$(window).on('mousemove', mouseDetect);

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







var teamEqualHeights = debounce(function() {
	var eqHeightElement = $('.member__description');
	eqHeightElement.css('height','auto'); //solve for all you browser stretchers out there!
	setEqualHeight(eqHeightElement, true, false);
}, 500);

var testimonialEqualHeights = debounce(function() {
	var eqHeightElement = $('.testimonial');
	eqHeightElement.css('height','auto'); //solve for all you browser stretchers out there!
	setEqualHeight(eqHeightElement, true, false);
}, 500);

$(window).on('ready load', function(){
	teamEqualHeights();
	testimonialEqualHeights()
});
// All window.resize would be changed to rAF
$(window).on('resize', function(){
	window.requestAnimationFrame(teamEqualHeights);
	window.requestAnimationFrame(testimonialEqualHeights);
});












// Media queries | Enquirejs


	var minQuery_992 = "screen and (min-width: 992px)",
		minHandle_992 = {
			setup : function(){
				$('body').addClass('min992');
			},
			match : function(){
				$('body').addClass('min992');
				enable_992_responsive();
			},
			unmatch : function(){
				$('body').removeClass('min992');
				disable_992_responsive();
			},
			deferSetup: true
		};
		enquire.register(minQuery_992, minHandle_992);



		function disable_992_responsive() {

			// scene.remove();
			// scene.off("leave", sceneLeave);
			// scene.off("enter", sceneEnter);
			// sceneLeave(); // Call it once to clear the settimeout interval
		}
		function enable_992_responsive() {
			
			// scene.addTo(controller);
			// scene.on("leave", sceneLeave);
			// scene.on("enter", sceneEnter);

		}




	// var minQuery_orientation = "screen and (orientation: portrait)",
	// 	minHandle_orientation = {
	// 		setup : function(){
	// 			$('body').addClass('orientation__portrait');
	// 		},
	// 		match : function(){
	// 			$('body').addClass('orientation__portrait');
	// 			// enable_orientation_responsive();
	// 		},
	// 		unmatch : function(){
	// 			$('body').removeClass('orientation__portrait');
	// 			// disable_orientation_responsive();
	// 		},
	// 		deferSetup: true
	// 	};
	// 	enquire.register(minQuery_orientation, minHandle_orientation);






function isNumber(evt) {
	evt = (evt) ? evt : window.event;
	var charCode = (evt.which) ? evt.which : evt.keyCode;
	if (charCode > 31 && (charCode < 48 || charCode > 57)) {
		return false;
	}
	// if (evt.which != 8 && evt.which != 0 && (evt.which < 48 || evt.which > 57)) {
	// 	return false;
	// }
	return true;
}


$('input[type=tel]').on('keypress', function(event){
	return isNumber(event);
});



// Send SMS to phone
	function phonenumber(inputtxt)  
	{  

		var phoneno = /^\d{10}$/;  
		if(inputtxt.val().match(phoneno))
		{  
			return true;  
		}  
		else  
		{  
			// console.log($(inputtxt))
			$(inputtxt).siblings('.error').text("Phone number should be 10 digits without spaces or '+' sign. Ex. 9848012345");
			// alert("Phone number should be 10 digits without spaces or '+' sign. Ex. 9848012345");
			return false;
		}  
	}  

	function onSubmit(input_field)
	{

		if (!phonenumber(input_field)) {
			return false;
		} else {
		
			var incomingUrl = window.location.href;

			// do httpRequest to send SMS
			var xmlhttp = new XMLHttpRequest();
			xmlhttp.open("POST","http://api.talkmoreapp.com/v1/growth/sms_install",true);
			xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

			//sendsms.html is only shown when referrer is set
			xmlhttp.send("mobileNumber="+input_field.val()+"&url=http://a.localytics.com/android?id=com.tinkerix.talkmore"+
				encodeURIComponent("&"+incomingUrl.substring(incomingUrl.indexOf('referrer'))));
			document.getElementById('referrer').value=decodeURIComponent(incomingUrl.substring(incomingUrl.indexOf('referrer')+9));
			
			return true;
		}
	}





// var phoneno = /^\d{10}$/;
// var input_field;
// $('.si--input-form').each(function(){
// 	input_field = $(this).find('input[type=tel]').value;
// 	$(this).submit(function(){
// 		if(input_field.match(phoneno)) {

// 			var incomingUrl = window.location.href;
// 			// do httpRequest to send SMS
// 			var xmlhttp = new XMLHttpRequest();
// 			xmlhttp.open("POST","http://api.talkmoreapp.com/v1/growth/sms_install",true);
// 			xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
// 			//sendsms.html is only shown when referrer is set
// 			xmlhttp.send("mobileNumber="+document.getElementById('phone').value+"&url=http://a.localytics.com/android?id=com.tinkerix.talkmore"+
// 				encodeURIComponent("&"+incomingUrl.substring(incomingUrl.indexOf('referrer'))));
// 			document.getElementById('referrer').value=decodeURIComponent(incomingUrl.substring(incomingUrl.indexOf('referrer')+9));
// 			return true;

// 		} else {
// 			$(this).find('.error').text('Phone number should be 10 digits without spaces or '+' sign. Ex. 9848012345')
// 			return true;
// 		}
// 	})
// })





var input_field;
$('.si--input-form').each(function(){
	$(this).submit(function(){
		input_field = $(this).find('input[type=tel]');
		return onSubmit(input_field);
	})
})










}); //document.ready