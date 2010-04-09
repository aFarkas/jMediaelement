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
				$.each(data, function(prop, val){
					elemS[prop] = val || '';
				});
				data = {};
			} else {
				$.each(styles, function(prop){
					data[prop] = elemS[prop];
				});
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
			var width 	= $(window).width() - 20,
				height	= win.height() - 30,
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
		var overlay, isVisible;
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
				if(overlay.css('backgroundColor') === 'transparent'){
					var color = $.curCSS(video, 'backgroundColor');
					overlay.css('backgroundColor', (color !== 'transparent') ? color :'#000');
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
				videoCSS= $.extend({}, videoBaseCSS, getSize(rel))
			;
			$('html, body')
				.addClass('contains-fullscreenvideo')
				.storeInlineStyle(bodyCSS, 'fsstoredInlineStyle')
				.css(bodyCSS)
			;
			
			videoOverlay.show(this.element);
			
			this.visualElem
				.parent()
				.storeInlineStyle(curDim, 'fsstoredInlineStyle')
				.css(curDim)
			;
			
			ctrlBar
				.addClass('controls-fullscreenvideo')
				.storeInlineStyle(barCSS, 'fsstoredInlineStyle')
				.css(barCSS)
			;
						
			this.visualElem
				.addClass('displays-fullscreen')
				.storeInlineStyle(videoCSS, 'fsstoredInlineStyle')
				.css(videoCSS)
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
			control.addClass('unsupported');
			return;
		}
		var elems = $.fn.registerMMControl.getBtn(control);
		if(o.addThemeRoller){
			control.addClass('ui-state-default ui-corner-all');
		}
		control.bind('click', function(){
			if(video.supportsFullScreen()){
			
			}
		});
		
	});
	
	
})(jQuery);
