(function($){
	
	var $m 			= $.multimediaSupport,
		bgWrapper 	= $('<div class="jme-bg-wrapper" style="position: absolute; overflow: hidden;display: block; width: 10px; height: 10px;" />'),
		appended 	= false
	;
	
	bgWrapper.css( ($('html').css('dir') === 'rtl') ? 'right' : 'left', '-99999px'  );
		
	$m.createBGSound = function(mediasrces, embedOpts){
		if( !appended ){
			bgWrapper
				.appendTo(document.documentElement)
				.bind('play playing loadedmeta pause waiting ended mediareset mute volumelevelchange', function(e){
					e.stopPropagation();
				})
			;
			appended = true;	
		}
		
		 var audio = $( $.fixHTML5('<audio style="display: block; width: 10px; height: 10px;" role="presentation" tabindex="-1" preload="auto" />') )
			.appendTo(bgWrapper)
			.attr('srces', mediasrces)
			.jmeEmbed(embedOpts)
		;
		
		return audio;
	};
	var _createWidget = $.Widget.prototype._createWidget;
	
	
	$.extend(true, $.Widget.prototype, {
		options: {sound: {}, soundEmbed: {}},
		_createWidget: function(){
			var ret = _createWidget.apply(this, arguments);
			this._createSound();
			return ret;
		},
		_soundAPI: {},
		_createSound: function(){
		var o 			= this.options,
			element 	= this.element,
			that 		= this
		;
		$.each(o.sound || {}, function(type, mediasrces){
				type = ( type === that.widgetEventPrefix ?
					type :
					that.widgetEventPrefix + type ).toLowerCase();
				that._soundAPI[type] = $m.createBGSound(mediasrces, o.soundEmbed || {});
				element.bind(type, function(){
					that._soundAPI[type].stopAndPlay();
				});
			});
		}//,
		/* todo:
		 option: function(){},
		 destroy: function(){}
		 */
		
	});
	
	$.multimediaSupport.fn._extend({
		stopAndPlay: function(){
			this.currentTime(0);
			this.play();
		}
	});
	
})(jQuery);
