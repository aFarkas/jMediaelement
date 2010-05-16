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
			sup._create.apply(this, arguments);
			var o 		= this.options,
				that 	= this
			;
			
			this.element.attr('role', 'application');
						
			this.handles
				.removeAttr('href')
				.attr({
					tabindex: '0',
					role: 'slider'
				})
				.css({
					display: inline,
					minHeight: min,
					minWidth: min
				})
			;
			$('.ui-handle-label', this.element)
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
			this._updateA11yValues();
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
		_slide: function(e, index){
			var ret = sup._slide.apply(this, arguments);
			this._updateA11yValues(index);
			
			return ret;
		},
		_updateA11yValues: function(index){
			var that 	= this,
				o 		= this.options,
				limits 	= {
					max: this._valueMax(),
					min: this._valueMin()
				}
			;
			function updateHandle(i){
				var handle 		= $(this),
					now 		= (o.values && o.values.length) ? that._values(i) : that.value(),
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
						'aria-valuetext': textValue,
						'aria-valuemin': limits.max,
						'aria-valuemax': limits.min
					})
				;
			}
			if(isFinite(index)){
				this.handles.filter(':eq('+ index +')').each(updateHandle);
			} else {
				this.handles.each(updateHandle);	
			}
			
		}
	});
})(jQuery);