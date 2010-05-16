(function($){
	/*
	*  enterLeave
	*  similiar to hover, but more accessible
	*  hover = focusblur
	*/
	var inReg = /focusin|focus$|mouseenter|mouseover/;	
	$.fn.enterLeave = function(enter, out, opts){
		opts = $.extend({}, $.fn.enterLeave.defaults, opts);
		
		var eventTypes 	= 'mouseenter mouseleave focusin focusout',
			selector 	= this.selector,
			context 	= this.context
		;
		
		if(opts.useEventTypes === 'mouse'){
			eventTypes = 'mouseenter mouseleave';
		} else if(opts.useEventTypes === 'focus'){
			eventTypes = 'focusin focusout';
		}
		
		

		this
			.each(function(){
				var inOutData = {inEvents: 0};
				function handler(e){
					var fn,
						params,
						elem = this,
						evt
					;
					if(inReg.test(e.type)){
						fn = enter;
						params =  [1, 'in', true];
						//webkit autoblur prevention 
						if(opts.useWebkitAutoBlur){
							inOutData.autoBlur = true; 
							setTimeout(function(){
								inOutData.autoBlur = false;
							}, 0);
						}
					} else {
						fn = out;
						params = [-1, 'out', false];
						if(inOutData.autoBlur){
							return;
						}
					}
					
					clearTimeout(inOutData.inOutTimer);
					inOutData.inEvents = Math.max(inOutData.inEvents + params[0], 0);
					inOutData.inOutTimer = setTimeout(function(){
						if(params[2] != inOutData.inOutState && 
								(params[2] || !opts.bothOut || !inOutData.inEvents)){
							
							inOutData.inOutState = params[2];
							evt = $.Event(params[1]);
							evt.originalEvent = e;
							fn.call(elem, evt);
						}
					}, /focus/.test(e.type) ? opts.keyDelay : opts.mouseDelay);
				}
				$(this)[opts.bindStyle](eventTypes, handler);
			});
		return this;
	};
	
	$.fn.enterLeave.defaults = {
		mouseDelay: 0,
		bindStyle: 'bind', // bind | live | bubbleLive
		keyDelay: 1,
		bothOut: false,
		useEventTypes: 'both', // both || mouse || focus
		useWebkitAutoBlur: false
	};
	
	$.fn.inOut = $.fn.enterLeave;
})(jQuery);
