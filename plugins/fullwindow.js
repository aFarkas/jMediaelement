/**
 * fullwindow plugin for the jMediaelement project | http://github.com/aFarkas/jMediaelement
 * @author Alexander Farkas
 * Copyright 2010, Alexander Farkas
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * 
 * API:
 * $('video').enterFullWindow() - enters fullWindow
 * $('video').exitFullWindow() - exits fullWindow
 * $('video').supportsFullWindow() - is fullwindow / position fixed supported (feature detection, not browser sniffing!)
 * 
 * Controls:
 * an element with the class 'fullscreen' generates a fullwindow-togglebutton
 * 
 * <a class="fullscreen" role="button" tabindex="0">toggle fullscreen</a>
 * 
 * Documentation:
 * http://protofunc.com/jme/plugins/fullwindow.html
 */

(function($){
	$.support.cssPointerEvents = ('pointerEvents' in $('<div />')[0].style);
	$.support.getBoundingClientRect = ('getBoundingClientRect' in $('<div />')[0]);
	
	/* helper methods */
	var pos = {
			relative: 1,
			absolute: 1
		},
		getPosedAncestors = function(elem){
		var ret 	= [],
			bodyReg = /^body|html$/i
		;
		if(elem.jquery){
			elem = elem[0];
		}
		elem = elem.parentNode;
		while( elem && !bodyReg.test(elem.nodeName) ){
			if( pos[ $.curCSS(elem, 'position') ] ){
				ret.push(elem);
			}
			elem = elem.parentNode;
		}
		
		return $(ret);
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
				$.data(this, name, {});
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
			position: 'static'
		},
		bodyCSS = {
			overflow: 'hidden'
		},
		win 	= $(window),
		doc 	= $(document),
		doSize 	= function(winDim, max, model){
			var ret = {};
			ret[model[0]] = max[model[0]];
			ret[model[1]] = max[model[0]] * model[2];
			
			ret.bottom = (winDim.height / 2) - (ret.height / 2);
			ret.top = ret.bottom;
			ret.left = (winDim.width / 2) - (ret.width / 2);
			ret.right = ret.left;
			return ret;
		},
		getSize	= function(rel, maxWidth, maxHeight){
			var width 	= win.width(),
				height	= win.height()
			;
			
			var winDim = {
					width: win.width(),
					height: win.height()
				},
				max 	= {
					width: maxWidth ? Math.min(winDim.width, maxWidth) : winDim.width,
					height: maxHeight ? Math.min(winDim.height, maxHeight) : winDim.height
				}
			;
			
			return doSize(winDim, max, (max.width / max.height > rel) ?  ['height', 'width', rel] : ['width', 'height', 1 / rel] );
		},
		supportsFullWindow
	;
	
	$.each(['Top', 'Left', 'Right', 'Bottom'], function(i, name){
		videoBaseCSS['padding'+ name] = 0;
		videoBaseCSS['margin'+ name] = 0;
		videoBaseCSS['border'+ name +'Width'] = 0;
	});
	
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
		win.bind('resize', function(){
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
				var bgCol = overlay.css('backgroundColor'),
					bgImg = overlay.css('backgroundImage')
				;
				if( (!bgCol || trans.test( bgCol ) ) && ( !bgImg || bgImg == 'none' ) ){
					overlay.css('backgroundColor', '#000');
				}
				overlay.insertAfter(video).show();
				isVisible = true;
			},
			hide: function(){
				if(!overlay || !isVisible){return;}
				overlay.hide().css('backgroundColor', '').detach();
				isVisible = false;
			}
		};
		
		return pub;
	})();
	
	$(function(){
		var div = $('<div style="visibility: hidden; postion: absolute; top: 0; left: 10px; padding: 10px;"><div style="position: fixed; top: 0;left: 0;" /></div>').appendTo('body');
		supportsFullWindow = !($('div', div).offset().left);
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
		startCSS: {},
		position: {}
	};
	
	/* 
	 * extend jme api
	 */
	$.multimediaSupport.fn._extend({
		supportsFullWindow: function(){
			return supportsFullWindow;
		},
		enterFullWindow: function(maxWidth, maxHeight){
			if(this.visualElem.hasClass('displays-fullscreen') || !supportsFullWindow){return;}
			var data 	= $.data(this.element, 'mediaElemSupport'),
				that 	= this,
				curDim 	= {
					width: this.visualElem.width(),
					height: this.visualElem.height()
				},
				rel 	= curDim.width / curDim.height,
				wrapper = ( data.controlWrapper && data.controlWrapper[0]) ? data.controlWrapper : this.visualElem,
				vidCss,
				videoCSS
			;
			
			data._$fullwindowScrollPosition = {
				top: win.scrollTop(),
				left: win.scrollLeft()
			};
			
			this._posedAncestors = getPosedAncestors(wrapper[0]).storeInlineStyle(parentsCss, 'fsstoredZindexInlineStyle');
				
			$('html, body')
				.addClass('contains-fullscreenvideo')
				.storeInlineStyle(bodyCSS, 'fsstoredInlineStyle')
			;
			
			if(data.controlWrapper && data.controlWrapper[0]){
				data.controlWrapper.addClass('wraps-fullscreen');
			}
			
			windowOverlay.show(wrapper);
			
			vidCss 	= getSize(rel, maxWidth, maxHeight);
			videoCSS= $.extend({}, videoBaseCSS, vidCss);
			
			this.visualElem
				.addClass('displays-fullscreen')
				.storeInlineStyle(videoCSS, 'fsstoredInlineStyle')
			;
			
			doc.bind('keydown.jmefullscreen', function(e){
				if(e.keyCode === 27){
					that.exitFullWindow();
				}
			});
			//IE 7 triggers resize event on enterFullWindow
			setTimeout(function(){
				win.bind('resize.jmefullscreen', function(){
					vidCss = getSize(rel, maxWidth, maxHeight);
					that.visualElem.css(vidCss);
					$(that.element).triggerHandler('fullwindowresize', vidCss);
					$(that.element).triggerHandler('resize');
				});
				$(that.element).triggerHandler('fullwindowresize', vidCss);
			}, 0);
			
			$(this.element).addClass('displays-fullscreen');
			
			this._trigger({type: 'fullwindow', isFullwindow: true, bbox: vidCss});
			$(this.element).triggerHandler('fullwindowresize', vidCss);
			$(this.element).triggerHandler('resize');
		},
		exitFullWindow: function(){
			if(!this.visualElem.hasClass('displays-fullscreen') || !supportsFullWindow){return;}
			var data 	= $.data(this.element, 'mediaElemSupport'),
				that 	= this,
				ancestors
			;
			if(this._posedAncestors){
				this._posedAncestors.storeInlineStyle('fsstoredZindexInlineStyle');
			}
			
			$('html, body')
				.css({overflow: 'auto'})
				.storeInlineStyle('fsstoredInlineStyle')
				.removeClass('contains-fullscreenvideo')
			;
			
			this.visualElem
				.storeInlineStyle('fsstoredInlineStyle')
				.removeClass('displays-fullscreen')
			;
			if(data.controlWrapper){
				data.controlWrapper.removeClass('wraps-fullscreen');
			}
						
			windowOverlay.hide();
			
			win.unbind('.jmefullscreen');
			doc.unbind('.jmefullscreen');
			$(this.element).removeClass('displays-fullscreen').unbind('.jmefullscreen');
			
			this._trigger({type: 'fullwindow', isFullwindow: false});
			$(this.element).triggerHandler('resize');
			if( data._$fullwindowScrollPosition ){
				win.scrollTop( data._$fullwindowScrollPosition.top );
				win.scrollLeft( data._$fullwindowScrollPosition.left );
				data._$fullwindowScrollPosition = false;
			}
		}
	}, true);
	
	
	/* 
	 * extend jme controls
	 */
	
	if ( $.fn.jmeControl ) {
		var supportJmefsButton = $.fn.jmeEmbed.defaults.jwPlayer && $.support.getBoundingClientRect && $.support.cssPointerEvents;
		if( $.fn.jmeEmbed.defaults.jwPlayer ){
			$.fn.jmeEmbed.defaults.jwPlayer.plugins.jmefs = $.multimediaSupport.jsPath + 'jmefs.swf';
			$(function(){
				var path = ($('script.jme-jwPlayer')[0] || {}).src;
				if(path){
					$.fn.jmeEmbed.defaults.jwPlayer.plugins.jmefs = path;
				}
			});
		}
		
		var fsID 		= 0,
			jmefsButton = {
			create: function(control, video, data, o){
				if(!supportJmefsButton || !data.controlWrapper || !$.contains(data.controlWrapper[0], control[0])){return;}
				var that 		= this,
					initActive 	= function(){
						that.jwPlayer = data.apis.jwPlayer;
						that.activate();
					},
					activate 	= function(){
						video
							.jmeReady(initActive)
							.one('jmeflashRefresh', initActive)
						;
					}
				;
				
				this.control = control;
				if(!this.control.attr('id')){
					fsID++;
					this.control.attr('id', 'fs-btn-'+ fsID);
				}
				this.wrapper = data.controlWrapper;
				this.video = video;
				this.data = data;
				video
					.bind('apiActivated', function(e, evt){
						if(evt.api === 'jwPlayer'){
							activate();
						}
					})
					.bind('apiDeActivated', function(e, evt){
						if(evt.api === 'jwPlayer'){
							that.deactivate();
						}
					})
				;
				if(data.name === 'jwPlayer'){
					activate();
				}
			},
			activate: function(){
				if(!this.jwPlayer.apiElem.jmefsSetButtonCursor || this.activated || this.data.name != 'jwPlayer'){return;}
				this.activated = true;
				var that = this,
					rePos = function(){
						if(that.timer){
							clearTimeout(that.timer);
						}
						that.timer = setTimeout(function(){
							that.setPos();
						}, 30);
					}
				;
				try{
					this.jwPlayer.apiElem.jmefsSetButtonCursor(true);
				} catch(e){return;}
				this.control.addClass('jme-flashbutton');
				this.wrapper.addClass('jme-flashbutton-wrapper');
				if(!this.setBtnCallback){
					this.jwPlayer.apiElem.jmefsSetButtonCallback('$.fn.jmeControl.defaults.fullscreen.jmeBtn', this.video.attr('id'), this.control.attr('id'));
					this.setBtnCallback = true;
				}
				this.video.bind('resize.jmeFSBtn', rePos);
				this.wrapper.bind('DOMSubtreeModified.jmeFSBtn', rePos);
				this.setPos();
			},
			deactivate: function(){
				this.activated = false;
				this.control.removeClass('jme-flashbutton');
				this.wrapper.removeClass('jme-flashbutton-wrapper').unbind('DOMSubtreeModified.jmeFSBtn');
				this.video.unbind('resize.jmeFSBtn');
				if(this.timer){
					clearTimeout(this.timer);
				}
				if(this.jwPlayer && this.jwPlayer.apiElem && this.jwPlayer.apiElem.jmefsSetButtonSize){
					try{
						this.jwPlayer.apiElem.jmefsSetButtonSize(0, 0);
						this.jwPlayer.apiElem.jmefsSetButtonPosition(-1, -1);
					} catch(e){return;}
				}
			},
			setPos: function(){
				if(!this.jwPlayer.isAPIReady || !this.jwPlayer.apiElem.jmefsSetButtonPosition){return;}
				var displayBBox = this.jwPlayer.apiElem.getBoundingClientRect(),
					btnBBox 	= this.control[0].getBoundingClientRect()
				;
				this.jwPlayer.apiElem.jmefsSetButtonPosition(btnBBox.left - displayBBox.left, btnBBox.top - displayBBox.top);
				this.jwPlayer.apiElem.jmefsSetButtonSize(btnBBox.width, btnBBox.height);
			}
		};
		
		
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
			
			if ( !supportsFullWindow && !video.supportsFullScreen() ) {
				control.addClass('fullscreen-unsupported ui-disabled');
				if(data.controlWrapper){
					data.controlWrapper.addClass('fullscreen-unsupported');
				}
				return;
			}
			var elems = $.fn.jmeControl.getBtn(control), changeState = function(){
				if (video.hasClass('displays-fullscreen')) {
					elems.text.text(elems.names[1]);
					elems.title.attr('title', elems.titleText[1]);
					elems.icon.addClass('ui-icon-circle-zoomout').removeClass('ui-icon-circle-zoomin');
				}
				else {
					elems.text.text(elems.names[0]);
					elems.title.attr('title', elems.titleText[0]);
					elems.icon.addClass('ui-icon-circle-zoomin').removeClass('ui-icon-circle-zoomout');
				}
			};
			if (o.addThemeRoller) {
				control.addClass('ui-state-default ui-corner-all');
			}
			if(o.fullscreen.tryFullScreen){
				$.multimediaSupport.beget(jmefsButton).create(control, video, data, o);
			}
			
			control.bind('ariaclick', function(){
				var isFullscreen = video.hasClass('displays-fullscreen');
				if( !isFullscreen ){
					video.play();
				}
				if ( o.fullscreen.tryFullScreen && !isFullscreen && video.supportsFullScreen() && video.enterFullScreen() ){
					return;
				}
				if ( isFullscreen ) {
					video.exitFullWindow();
				} else {
					video.enterFullWindow(o.fullscreen['max-width'], o.fullscreen['max-height']);
				}
				
				return false;
			});
			changeState();
			video.bind('fullwindow', changeState);
		},
		{
			tryFullScreen: true,
			'max-width': false,
			'max-height': false,
			jmeBtn: function(type, vid, cid){
				if(type === 'resize'){
					$(document.getElementById(vid)).triggerHandler('resize');				
				} else {
					$(document.getElementById(cid))[(type === 'jmefsButtonOver') ? 'addClass' : 'removeClass']('jme-over ui-state-over');
				}
			}
		});
		
	}
})(jQuery);
