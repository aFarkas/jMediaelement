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
		barCSS 	= {
			bottom: 0,
			left: 0,
			right: 0,
			position: 'fixed',
			zIndex: 9999999,
			width: 'auto'
		},
		stateCSS = {
			bottom: 0,
			left: 0,
			right: 0,
			top: 0,
			position: 'fixed',
			zIndex: 999995,
			width: 'auto',
			height: 'auto'
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
	
	var videoOverlay = (function(){
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
			isVisible
		;
		var pub = {
			show: function(video){
				if(!overlay || isVisible){return;}
				if( trans.test( overlay.css('backgroundColor') ) ){
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
	
	$.multimediaSupport.fn._extend({
		supportsFullWindow: function(){
			return supportsFullWindow;
		},
		enterFullWindow: function(o){
			if(this.visualElem.hasClass('displays-fullscreen') || !supportsFullWindow){return;}
			
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
			
			videoOverlay.show(this.element);
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
				ctrlBar.storeInlineStyle(barCSS, 'fsstoredInlineStyle');
				if(o.constrainMediaCtrl){
					$(this.element)
						.bind('fullwindowresize.jmefullscreen', function(e, data){
							barCSS.bottom = data.bottom;
							barCSS.left = data.left;
							barCSS.right = data.right;
							ctrlBar.css(barCSS);
						})
					;
				}
			}
			
			if(o.posMediaState){
				state.storeInlineStyle(stateCSS, 'fsstoredInlineStyle');
				if(o.constrainMediaCtrl){
					$(this.element)
						.bind('fullwindowresize.jmefullscreen', function(e, data){
							state.css($.extend({}, data));
						})
					;
				}
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
			}, 0);
			
			$(this.element).addClass('displays-fullscreen');
			
			this._trigger('fullwindow', {isFullwindow: true});
			$(this.element).triggerHandler('fullwindowresize', vidCss);
			$(this.element).triggerHandler('resize');
		},
		exitFullWindow: function(o){
			if(!this.visualElem.hasClass('displays-fullscreen') || !supportsFullWindow){return;}
			var data 	= $.data(this.element, 'mediaElemSupport'),
				ctrlBar = data.controlBar || $([]),
				state	= data.mediaState || $([]),
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
			
			ctrlBar
				.storeInlineStyle('fsstoredInlineStyle')
				.removeClass('controls-fullscreenvideo')
			;
			state.storeInlineStyle('fsstoredInlineStyle');
			
			videoOverlay.hide();
			if( !$.support.style || o.debug ){
				setTimeout(function(){
					that.visualElem.offsetAncestors().storeInlineStyle('fsstoredZindexInlineStyle');
				}, 0);
			}
			win.unbind('.jmefullscreen');
			doc.unbind('.jmefullscreen');
			$(this.element).removeClass('displays-fullscreen').unbind('.jmefullscreen');
			this._trigger('fullwindow', {isFullwindow: false});
			$(this.element).triggerHandler('resize');
		}
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
			})
		;
		changeState();
		video.bind('fullwindow', changeState);
	});
	
	$.fn.jmeControl.defaults.fullscreen = {
		posMediaCtrl: true,
		constrainMediaCtrl: true,
		posMediaState: true
	};
	
})(jQuery);
