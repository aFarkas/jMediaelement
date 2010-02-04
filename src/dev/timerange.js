/**
 * @author alexander.farkas
 */
(function(){
	function isBetweenRange(elem, api, time){
		var i 	= 0,
			len = api.timeRanges.length,
			e 	= {
				time: time
			}
		;
		if(!api.timeRangeEntered){
			for(; i < len; i++){
				//console.log(api.timeRanges[i] <= time, api.timeRanges[i], time)
				if(api.timeRanges[i] <= time && api.timeRanges[i+1] >= time){
					e.rangeEnter = api.timeRanges[i];
					e.rangeLeave = api.timeRanges[i+1];
					e.type = 'rangeenter';
					api.timeRangeCallbacks['_'+ api.timeRanges[i] +'_'+ api.timeRanges[i+1]].call(elem, e );
					api.timeRangeEntered = [ api.timeRanges[i], api.timeRanges[i+1] ];
					break;
				}
				i++;
			}
		} else if(time < api.timeRangeEntered[0] || api.timeRangeEntered[1] < time){
			e.rangeEnter = api.timeRangeEntered[0];
			e.rangeLeave = api.timeRangeEntered[1];
			e.type = 'rangeleave';
			api.timeRangeCallbacks['_'+ api.timeRangeEntered[0] +'_'+ api.timeRangeEntered[1]].call(elem, e );
			api.timeRangeEntered = false;
		}
		if(e.type){
			$(elem).triggerHandler(e);
		}	
		
	}
	$.fn.addTimeRange = function(o){
		o = $.extend({}, $.fn.addTimeRange.defaults, o);
		if(!isFinite(o.enter) || !isFinite(o.leave)){
			return this;
		}
		return this.each(function(){
			var api = $.data(this, 'mediaElemSupport');
			if(!api){
				return;
			}
			if(!api.timeRanges){
				api.timeRanges = [];
				api.timeRangeEntered = false;
				api.timeRangeCallbacks = {};
				$(this).bind('timechange', function(e, evt){
					isBetweenRange(this, api, evt.time);
				});
			}
			api.timeRanges.push(o.enter);
			api.timeRanges.push(o.leave);
			api.timeRangeCallbacks['_'+ o.enter +'_'+ o.leave] = o.callback;
			if(o.resort){
				
			}
			
		});
	};
	
	$.fn.addTimeRange.defaults = {
		enter: false,
		leave: false,
		callback: $.noop,
		resort: false
	};
	
})();
