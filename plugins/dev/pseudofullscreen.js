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
	
	var videoCSS = {
			position: 'fixed',
			zIndex: 9998
		},
		barCSS 	= {
			bottom: 0,
			left: 0,
			right: 0,
			position: 'fixed',
			zIndex: 9999,
			opacity: 0
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
		getControlBar 	= function(data){
			var bar;
			if(data.controls){
				$.each(data.controls, function(i, elem){
					if((elem.className || '').indexOf('media-controls') !== -1){
						bar = $(elem);
						return false;
					}
				});
			}
			return bar || $([]);
		}
	;
	
	var videoOverlay = (function(){
		
	})();
	
	$.multimediaSupport.fn._extend({
		enterFullWindow: function(animate, animOpts){
			if(this.visualElem.hasClass('displays-fullscreen')){return;}
			
			this.data.normalCSS = this.visualElem.offset();
			
			var data 	= $.data(this.html5elem, 'mediaElemSupport'),
				that 	= this,
				curDim 	= {
					width: this.visualElem.width(),
					height: this.visualElem.height()
				},
				rel 	= curDim.width / curDim.height,
				ctrlBar = getControlBar(data),
				sizePos	= getSize(rel)
			;
			$.extend(this.data.normalCSS, curDim);
			$('html, body')
				.addClass('contains-fullscreenvideo')
				.storeInlineStyle(bodyCSS, 'fsstoredInlineStyle')
				.css(bodyCSS)
			;
			
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
			
			if(animate){
				ctrlBar
					.css({opacity: 0})
					.animate({opacity: 1}, $.extend({}, animOpts))
				;
			}
			
			this.visualElem
				.addClass('displays-fullscreen')
				.storeInlineStyle($.extend({}, videoCSS, sizePos), 'fsstoredInlineStyle')
				.css(videoCSS)
				[(animate) ? 'animate': 'css'](sizePos, animOpts)
			;
			win.bind('resize.fullscreen', function(){
				that.visualElem.css(getSize(rel));
			});
			doc.bind('keydown', function(e){
				if(e.keyCode === 27){
					that.exitFullWindow();
				}
			});
			this._trigger('fullwindow');
			$(this.html5elem).triggerHandler('resize');
		},
		exitFullWindow: function(){
			$('html, body')
				.storeInlineStyle('fsstoredInlineStyle')
				.removeClass('contains-fullscreenvideo')
			;
			
			this.visualElem
				.storeInlineStyle('fsstoredInlineStyle')
				.removeClass('displays-fullscreen')
			;
			win.unbind('.fullscreen');
			this._trigger('fullwindow');
			$(this.html5elem).triggerHandler('resize');
		}
	});
})(jQuery);
