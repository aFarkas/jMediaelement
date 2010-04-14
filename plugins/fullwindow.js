(function($){
	
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
			var data = $.data(this, name) || $.data(this, name, {}),
				elemS = this.style
			;
			if(!styles){
				$(this).css(data);
				data = {};
			} else {
				$.each(styles, function(prop, val){
					data[prop] = elemS[prop];
				});
				$(this).css(styles);
			}
		});
	};
	
	var videoBaseCSS = {
			position: 'fixed',
			zIndex: 9998
		},
		barCSS 	= {
			bottom: 0,
			left: 0,
			right: 0,
			position: 'fixed',
			zIndex: 9999
		},
		bodyCSS = {
			overflow: 'hidden'
		},
		win 	= $(window),
		doc 	= $(document),
		getSize	= function(rel){
			var width 	= $(window).width(),
				height	= win.height(),
				winRel 	= width / height,
				ret 	= {}
			;
			if(winRel > rel){
				ret.height = height;
				ret.width = ret.height * rel;
				ret.top = 0;
				ret.left = (width / 2) - (ret.width / 2);
			} else {
				ret.width = width;
				ret.height = ret.width / rel;
				ret.left = 0;
				ret.top = (height / 2) - (ret.height / 2);
			}
			return ret;
		},
		supportsFullWindow
	;
	
	var videoOverlay = (function(){
		var trans = /transparent|rgba\(0, 0, 0, 0\)/,
			overlay, isVisible
		;
		var pub = {
			init: function(){
				overlay = $('<div class="fullwindow-overlay" />')
					.css({
						position: 'fixed',
						display: 'none',
						height: '100%',
						width: '100%',
						top: 0,
						left: 0,
						zIndex: 9997
					})
					.appendTo('body')
				;
			},
			show: function(video){
				if(!overlay || isVisible){return;}
				if(trans.test(overlay.css('backgroundColor'))){
					var color = $.curCSS(video, 'backgroundColor');
					overlay.css('backgroundColor', (!trans.test(color)) ? color :'#000');
				}
				overlay.show();
				isVisible = true;
			},
			hide: function(){
				if(!overlay || !isVisible){return;}
				overlay.hide();
				isVisible = false;
			}
		};
		return pub;
	})();
	
	$(function(){
		videoOverlay.init();
		var div = $('<div style="position: fixed; visibility: hidden; height: 0; width: 0; margin: 0; padding: 0; border: none;" />').appendTo('body');
		supportsFullWindow = ($.curCSS(div[0], 'position', true) === 'fixed');
		div.remove();
	});
	
	$.multimediaSupport.fn._extend({
		supportsFullWindow: function(){
			return supportsFullWindow;
		},
		enterFullWindow: function(){
			if(this.visualElem.hasClass('displays-fullscreen') || !supportsFullWindow){return;}
			
			var data 	= $.data(this.element, 'mediaElemSupport'),
				that 	= this,
				curDim 	= {
					width: this.visualElem.width(),
					height: this.visualElem.height()
				},
				rel 	= curDim.width / curDim.height,
				ctrlBar = data.controlBar || $([]),
				parent  = this.visualElem.parent(),
				videoCSS= $.extend({}, videoBaseCSS, getSize(rel))
			;
						
			videoOverlay.show(this.element);
			
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
			
			ctrlBar
				.addClass('controls-fullscreenvideo')
				.storeInlineStyle(barCSS, 'fsstoredInlineStyle')
			;
						
			this.visualElem
				.addClass('displays-fullscreen')
				.storeInlineStyle(videoCSS, 'fsstoredInlineStyle')
			;
			
			doc.bind('keydown.fullscreen', function(e){
				if(e.keyCode === 27){
					that.exitFullWindow();
				}
			});
			//IE 7 triggers resize event on enterFullWindow
			setTimeout(function(){
				win.bind('resize.fullscreen', function(){
					that.visualElem.css(getSize(rel));
				});
			}, 0);
			this._trigger('fullwindow');
			$(this.element).triggerHandler('resize');
		},
		exitFullWindow: function(){
			if(!this.visualElem.hasClass('displays-fullscreen') || !supportsFullWindow){return;}
			var data 	= $.data(this.element, 'mediaElemSupport'),
				ctrlBar = data.controlBar || $([])
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
			
			ctrlBar
				.storeInlineStyle('fsstoredInlineStyle')
				.removeClass('controls-fullscreenvideo')
			;
			
			videoOverlay.hide();
			
			win.unbind('.fullscreen');
			doc.unbind('.fullscreen');
			this._trigger('fullwindow');
			$(this.element).triggerHandler('resize');
		}
	});
	
	$.fn.registerMMControl.addControl('fullscreen', function(control, video, data, o){
		if(!supportsFullWindow){
			control.addClass('fullscreen-unsupported ui-disabled');
			return;
		}
		var elems 		= $.fn.registerMMControl.getBtn(control),
			changeState = function(){
				if(video.hasClass('displays-fullscreen')){
					elems.text.text(elems.names[1]);
					elems.icon
						.addClass('ui-icon-circle-zoomout')
						.removeClass('ui-icon-circle-zoomin')
					;
				} else {
					elems.text.text(elems.names[0]);
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
			.each(changeState)
			.bind('click', function(){
				if(video.supportsFullScreen()){
					video.enterFullScreen();
				} else {
					if(video.hasClass('displays-fullscreen')){
						video.exitFullWindow();
					} else {
						video.enterFullWindow();
					}
				}
			})
		;
		video.bind('fullwindow', changeState);
	});
	
	
})(jQuery);
