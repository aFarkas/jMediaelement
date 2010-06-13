/**
 * @author alexander.farkas
 * 
 * Extends: jQuery UI's Slider with WAI-Aria for a11y
 */
(function($){
	var sup = $.ui.slider.prototype,
		uID = 0,
		min = function(i, style){
			return (style === '0px') ? '1px' : style;
		},
		inline = function(i, style){
			return (style === 'inline') ? 'inline-block' : style;
		}
	;
	
	$.support.valueText = (!$.browser.msie || parseInt($.browser.version, 10) > 8);
	$.widget('ui.a11ySlider', $.ui.slider, {
		options: {
			textValue: '{value} %',
			roundValue: true
		},
		widgetEventPrefix: "slide",
		_create: function(){
			var o 		= this.options,
				that 	= this
			;
			
			this.element
				.attr('role', 'application')
				.bind('slidechange', $.proxy(this, '_updateA11yValues') )
			;
			
			sup._create.apply(this, arguments);
								
			this.handles
				.removeAttr('href')
				.attr({
					tabindex: '0',
					role: 'slider',
					'aria-valuemin': this._valueMax(),
					'aria-valuemax': this._valueMin()
				})
				.css({
					display: inline,
					minHeight: min,
					minWidth: min
				})
				.each(function(i){
					that._updateA11yValues(i, {value: that.values(i), handle: this});
				})
			;
			$('.handle-label', this.element)
				.hide()
				.each(function(i){
					var id = this.id;
					if(!id){
						uID++;
						id = 'slider-label-'+uID;
						this.id = id;
					}
					that.handles
						.filter(':eq('+ i +')')
						.attr('aria-labelledby', id)
					;
				})
			;
			//this._updateA11yValues();
		},
		_setOption: function( key, value ) {
			sup._setOption.apply(this, arguments);
			if ( key === "disabled" ) {
				this.handles
					.attr({
						'aria-disabled': String( value ),
						tabindex: (value) ? '-1' : '0'
					})
				;
			}
			return this;
		},
		_updateA11yValues: function(i, ui){
			var that 	= this,
				o 		= this.options
			;
			
			if(!ui){
				ui = {
					handle: this.handles.get(i),
					value: this.values(i)
				};
			}

			var handle 		= $(ui.handle),
				now 		= ui.value,
				textValue
			;
			if(o.roundValue && isFinite(now)){
				now = Math.round(now * 100) / 100;
			}
			if($.isFunction(o.textValue)){
				textValue = o.textValue(now, i, handle);
			} else {
				textValue = $.isArray(o.textValue) ? o.textValue[i] : o.textValue;
				textValue = textValue.replace('{value}', now);
			}
			
			handle
				.attr({
					'aria-valuenow': ($.support.valueText) ? now : textValue,
					'aria-valuetext': textValue
				})
			;
			
			
			
		}
	});
})(jQuery);