/**
 * fullwindow plugin for the jMediaelement project | http://github.com/aFarkas/jMediaelement
 * @author Alexander Farkas
 * Copyright 2010, Alexander Farkas
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * 
 * API:
 * $('video').enterFullWindow(options) - enters fullWindow
 * Options:
 * - posMediaCtrl: true
 * - constrainMediaCtrl: true
 * - posMediaState: true
 *		
 *	
 * $('video').exitFullWindow() - exits fullWindow
 * $('video').supportsFullWindow() - is fullwindow / position fixed supported (feature detection, not browser sniffing!)
 * 
 * Controls:
 * an element with the class 'fullscreen' generates a fullwindow-togglebutton
 * 
 * <a class="fullscreen" role="button" tabindex="0">toggle fullscreen</a>
 * 
 */

(function($){
	
	/* helper methods */
	$.fn.offsetAncestors = function(){
		var ret 	= [],
			bodyReg = /^body|html$/i
		;
		this.each(function(){
			var elem = $(this).offsetParent()[0];
			while( elem && !bodyReg.test(elem.nodeName) ){
				ret.push(elem);
				elem = $(elem).offsetParent()[0];
			}
		});
		return this.pushStack(ret, 'offestAncestors');
	};
	
	var zIndexReg = /zIndex/;
	$.fn.storeInlineStyle = function(styles, name){
		if(!styles && !name){
			name = 'storedInlineStyle';
		} else if(typeof styles === 'string'){
			name =  styles;
			styles = false;
		} else {
			name = name || 'storedInlineStyle';
		}
		
		return this.each(function(){
			var data 	= $.data(this, name) || $.data(this, name, {}),
				elemS 	= this.style,
				elem 	= this
			;
			
			if(!styles){
				if(!data){return;}
				$(this).css(data);
				data = {};
			} else {
				$.each(styles, function(prop, val){
					data[prop] = elemS[prop];
					//ie7 reports zIndex always as inline-style
					if( prop === 'zIndex' && data[prop] !== '' && !$.support.style && !zIndexReg.test( elem.style.cssText ) ){
						data[prop] = '';
					}
				});
				$(this).css(styles);
			}
		});
	};
	
	var videoBaseCSS = {
			position: 'fixed',
			zIndex: 99999,
			width: 'auto',
			height: 'auto'
		},
		parentsCss 	= {
			zIndex: 99998
		},
		bodyCSS = {
			overflow: 'hidden'
		},
		win 	= $(window),
		doc 	= $(document),
		getSize	= function(rel){
			var width 	= win.width(),
				height	= win.height(),
				winRel 	= width / height,
				ret 	= {}
			;
			if(winRel > rel){
				ret.height = height;
				ret.width = height * rel;
				
				ret.bottom = 0;
				ret.top = 0;
				ret.left = (width / 2) - (ret.width / 2);
				ret.right = ret.left;
			} else {
				ret.width = width;
				ret.height = width / rel;
				
				ret.right = 0;
				ret.left = 0;
				ret.width = width;
				ret.top = (height / 2) - (ret.height / 2);
				ret.bottom = ret.top;
			}
			return ret;
		},
		supportsFullWindow
	;
	
	var windowOverlay = (function(){
		var trans 	= /transparent|rgba\(0, 0, 0, 0\)/,
			overlay = $('<div class="fullwindow-overlay" />')
						.css({
							position: 'fixed',
							display: 'none',
							right: 0,
							bottom: 0,
							top: 0,
							left: 0,
							zIndex: 99990
						}), 
			isVisible, timer
		;
		
		// IE7/IE8 retrigger
		$(window).bind('resize', function(){
			if(isVisible){
				clearTimeout(timer);
				timer = setTimeout(function(){
					overlay.css({top: -1, left: -1, right: -1, bottom: -1});
					setTimeout(function(){
						overlay.css({top: 0, left: 0, right: 0, bottom: 0});
					}, 1);
				}, 100);
			}
		});
		
		var pub = {
			show: function(video){
				if(!overlay || isVisible){return;}
				if( trans.test( overlay.css('backgroundColor') ) && overlay.css('backgroundImage') == 'none' ){
					var color = $.curCSS(video, 'backgroundColor');
					overlay.css('backgroundColor', (!trans.test(color)) ? color :'#000');
				}
				overlay.insertAfter(video).show();
				isVisible = true;
			},
			hide: function(){
				if(!overlay || !isVisible){return;}
				overlay.hide().detach();
				isVisible = false;
			}
		};
		
		return pub;
	})();
	
	$(function(){
		var div = $('<div style="position: fixed; visibility: hidden; height: 0; width: 0; margin: 0; padding: 0; border: none;" />').appendTo('body');
		supportsFullWindow = ($.curCSS(div[0], 'position', true) === 'fixed');
		div.remove();
	});
	
	
	var defaultOverlayCSS = {
		position: 'fixed',
		zIndex: 999996
	};
	
	$.fn.videoOverlay = function(o){
		o = $.extend(true, {}, $.fn.videoOverlay.defaults, o);
		if( !o.video ){return this;}
		o.video = $(o.video);
		var overlayCSS 	= $.extend({}, defaultOverlayCSS, o.startCSS),
			dynPos		= o.position
		;
		if( !$.isFunction( o.position ) ){
			$.each(o.position, function(styleName, posval){
				overlayCSS[styleName] = posval;
			});
			o.position = function(css){
				var ret = {};
				for(var name in dynPos){
					ret[name] = css[name];
				}
				return ret;
			};
		}
		
		return this.each(function(){
			var overlay = $(this);
			o.video
				.bind({
					fullwindow: function(e, evt){
						if( !evt.isFullwindow ){
							//restore old css
							overlay
								.storeInlineStyle('fsstoredOverlay')
								.removeClass(o.fullscreenClass)
							;
						} else {
							//store pre css
							overlay
								.storeInlineStyle(overlayCSS, 'fsstoredOverlay')
								.addClass(o.fullscreenClass)
							;
						}
					},
					fullwindowresize: function(e, evt){
						overlay.css( o.position(evt) );
					}
				})
			;
		});
	};
	
	$.fn.videoOverlay.defaults = {
		video: false,
		fullscreenClass: 'videooverlay-infullscreen',
		startCSS: {
//			height: 'auto',
//			width: 'auto'
		},
		position: {
//			bottom: 0,
//			left: 0,
//			right: 0,
//			top: 0,
//			width: 0,
//			height: 0
		}
	};
	
	/* 
	 * extend jme api
	 */
	$.multimediaSupport.fn._extend({
		supportsFullWindow: function(){
			return supportsFullWindow;
		},
		enterFullWindow: function(o){
			if(this.visualElem.hasClass('displays-fullscreen') || !supportsFullWindow){return;}
			o = $.extend({}, $.fn.jmeControl.defaults.fullscreen, o);
			var data 	= $.data(this.element, 'mediaElemSupport'),
				that 	= this,
				curDim 	= {
					width: this.visualElem.width(),
					height: this.visualElem.height()
				},
				rel 	= curDim.width / curDim.height,
				ctrlBar = data.controlBar || $([]),
				state	= data.mediaState || $([]),
				parent  = this.visualElem.parent(),
				vidCss,
				videoCSS
			;
			
			windowOverlay.show(this.element);
			if( !$.support.style || o.debug ){
				this.visualElem.offsetAncestors().storeInlineStyle(parentsCss, 'fsstoredZindexInlineStyle');
			}
			
			parent
				.storeInlineStyle({
					height: parent.height(),
					width: parent.width()
				}, 'fsstoredInlineStyle')
			;
			
			$('html, body')
				.addClass('contains-fullscreenvideo')
				.storeInlineStyle(bodyCSS, 'fsstoredInlineStyle')
			;
			
			if(data.controlWrapper){
				data.controlWrapper.addClass('wraps-fullscreen');
			}
			
			ctrlBar.addClass('controls-fullscreenvideo');
			if(o.posMediaCtrl){
				ctrlBar.videoOverlay({
					fullscreenClass: 'controls-fullscreenvideo',
					video: this.element,
					startCSS: {
						width: 'auto'
					},
					position: {
						bottom: 0,
						left: 0,
						right: 0
					}
				});
			}
			
			if(o.posMediaState){
				state.videoOverlay({
					video: this.element,
					startCSS: {
						width: 'auto',
						height: 'auto'
					},
					position: {
						bottom: 0,
						left: 0,
						right: 0,
						top: 0,
						wdith: 0,
						height: 0
					}
				});
			}
			vidCss 	= getSize(rel);
			videoCSS= $.extend({}, videoBaseCSS, vidCss);
			
			
				
			this.visualElem
				.addClass('displays-fullscreen')
				.storeInlineStyle(videoCSS, 'fsstoredInlineStyle')
			;
			
			doc.bind('keydown.jmefullscreen', function(e){
				if(e.keyCode === 27){
					that.exitFullWindow(o);
				}
			});
			//IE 7 triggers resize event on enterFullWindow
			setTimeout(function(){
				win.bind('resize.jmefullscreen', function(){
					vidCss = getSize(rel);
					that.visualElem.css(vidCss);
					$(that.element).triggerHandler('fullwindowresize', vidCss);
					$(that.element).triggerHandler('resize');
				});
				$(that.element).triggerHandler('fullwindowresize', vidCss);
			}, 0);
			
			$(this.element).addClass('displays-fullscreen');
			
			this._trigger({type: 'fullwindow', isFullwindow: true});
			$(this.element).triggerHandler('fullwindowresize', vidCss);
			$(this.element).triggerHandler('resize');
		},
		exitFullWindow: function(o){
			if(!this.visualElem.hasClass('displays-fullscreen') || !supportsFullWindow){return;}
			var data 	= $.data(this.element, 'mediaElemSupport'),
				that 	= this
			;
			$('html, body')
				.storeInlineStyle('fsstoredInlineStyle')
				.removeClass('contains-fullscreenvideo')
			;
			
			this.visualElem
				.storeInlineStyle('fsstoredInlineStyle')
				.removeClass('displays-fullscreen')
				.parent()
				.storeInlineStyle('fsstoredInlineStyle')
			;
			if(data.controlWrapper){
				data.controlWrapper.removeClass('wraps-fullscreen');
			}
						
			windowOverlay.hide();
			if( !$.support.style || o.debug ){
				setTimeout(function(){
					that.visualElem.offsetAncestors().storeInlineStyle('fsstoredZindexInlineStyle');
				}, 0);
			}
			win.unbind('.jmefullscreen');
			doc.unbind('.jmefullscreen');
			$(this.element).removeClass('displays-fullscreen').unbind('.jmefullscreen');
			this._trigger({type: 'fullwindow', isFullwindow: false});
			$(this.element).triggerHandler('resize');
		}
	});
	
	
	/* 
	 * extend jme controls
	 */
	$.fn.jmeControl.addControl('video-box', function(control, video, data, o){
		control.videoOverlay({
			video: video,
			startCSS: {
				width: 'auto',
				height: 'auto',
				zIndex: 99998
			},
			position: {
				bottom: 0,
				left: 0,
				right: 0,
				top: 0,
				wdith: 0,
				height: 0
			}
		});
	});
	$.fn.jmeControl.addControl('fullscreen', function(control, video, data, o){
		if(!supportsFullWindow){
			control.addClass('fullscreen-unsupported ui-disabled');
			return;
		}
		var elems 		= $.fn.jmeControl.getBtn(control),
			changeState = function(){
				if(video.hasClass('displays-fullscreen')){
					elems.text.text(elems.names[1]);
					elems.title.attr('title', elems.titleText[1]);
					elems.icon
						.addClass('ui-icon-circle-zoomout')
						.removeClass('ui-icon-circle-zoomin')
					;
				} else {
					elems.text.text(elems.names[0]);
					elems.title.attr('title', elems.titleText[0]);
					elems.icon
						.addClass('ui-icon-circle-zoomin')
						.removeClass('ui-icon-circle-zoomout')
					;
				}
			}
		;
		if(o.addThemeRoller){
			control.addClass('ui-state-default ui-corner-all');
		}
		control
			.bind('ariaclick', function(){
				if(data.name !== 'nativ' && video.supportsFullScreen()){
					video.enterFullScreen();
				} else {
					if(video.hasClass('displays-fullscreen')){
						video.exitFullWindow(o.fullscreen);
					} else {
						video.enterFullWindow(o.fullscreen);
					}
				}
				return false;
			})
		;
		changeState();
		video.bind('fullwindow', changeState);
	});
	
	$.fn.jmeControl.defaults.fullscreen = {
		posMediaCtrl: true,
		posMediaState: true
	};
	
})(jQuery);
