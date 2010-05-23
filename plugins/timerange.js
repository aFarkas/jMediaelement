/**
 * timerange plugin for the jMediaelement project | http://github.com/aFarkas/jMediaelement
 * @author Alexander Farkas
 * Copyright 2010, Alexander Farkas
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * 
 *
 * $('video').addTimeRange('timeRangeID-1', {
 * 			enter: 1, 
 * 			leave: 12, 
 * 			callback:function(e){
 * 				console.log(e);
 *  		}
 *  	}
 *  );
 *  
 *  $('video').addTimeRange('timeRangeID-1', {
 * 			enter: 23, 
 * 			leave: 26
 *  	}
 *  );
 * 
 *  $('video').addTimeRange('timeRangeID-2', {
 * 			enter: 3, 
 * 			leave: 21
 *  	}
 *  );
 *  
  *  $('video').addTimeRange('timeRangeID-2', {
 * 			enter: 25, 
 * 			leave: 31, 
 * 			callback:function(e){
 * 				console.log(e);
 *  		}
 *  	}
 *  );
 */
(function($){
	function isBetweenRange(elem, timerange, time){
		if(!timerange.active){return;}
		
		var e 	= {time: time};
		
		if(!timerange.entered){
			var	i 					= timerange.lastIndex,
				len 				= timerange.enterRanges.length,
				createEvent 		= function(index){
						e.rangeEnter = timerange.enterRanges[index];
						e.rangeLeave = timerange.leaveRanges[index];
						e.rangeIndex = index;
						timerange.lastIndex = e.rangeIndex;
						timerange.lastTime = timerange.enterRanges[index];
						e.type = 'rangeenter';
						timerange.entered = [ e.rangeEnter, e.rangeLeave, e.rangeIndex ];
					}
			;
			if(timerange.lastTime > time){
				while(i--){
					if(timerange.enterRanges[i] <= time && timerange.leaveRanges[i] >= time){
						createEvent(i);
						break;
					} else if(timerange.leaveRanges[i] < time){
						timerange.lastIndex = i;
						timerange.lastTime = timerange.enterRanges[i];
						break;
					}
				}
			} else {
				for(; i < len; i++){
					if(timerange.enterRanges[i] <= time && timerange.leaveRanges[i] >= time){
						createEvent(i);
						break;
					} else if(timerange.leaveRanges[i] > time){
						if(timerange.enterRanges[i] < time){
							timerange.lastIndex = i;
							timerange.lastTime = timerange.leaveRanges[i];
						}
						break;
					}
				} 
			}
		} else if(time < timerange.entered[0] || timerange.entered[1] < time){
			e.rangeEnter = timerange.entered[0];
			e.rangeLeave = timerange.entered[1];
			e.rangeIndex = timerange.entered[2];
			e.type = 'rangeleave';
			timerange.entered = false;
		}
		if(e.type){
			if(timerange.callback){
				timerange.callback.call(elem, e );
			}
			$(elem).triggerHandler(e);
		}	
		
	}
	
	var numsort = function(a, b) {
		return a - b;
	};
	
	$.fn.addTimeRange = function(name, o){
		if(typeof o === 'boolean'){
			o = {activate: o};
		}
		
		o = $.extend({}, $.fn.addTimeRange.defaults, o);
			
		return this.each(function(){
			var api = $.data(this, 'mediaElemSupport');
			if(!api){
				return;
			}
			if(!api.timeRanges){
				api.timeRanges = {};
			}
			
			if(!api.timeRanges[name]){
				api.timeRanges[name] = {
					enterRanges: [],
					leaveRanges: [],
					lastIndex: 0,
					lastTime: 0,
					entered: false,
					active: false,
					callback: o.callback
				};
			}
			
			if(o.callback){
				api.timeRanges[name].callback = o.callback;
			}
			if( typeof o.enter !== 'boolean' && isFinite(o.enter) && typeof o.leave !== 'boolean' &&  isFinite(o.leave) ) {
				api.timeRanges[name].enterRanges.push(o.enter);
				api.timeRanges[name].leaveRanges.push(o.leave);
			}
			
			if(o.activate && !api.timeRanges[name].active){
				api.timeRanges[name].active = true;
				$(this).bind('timechange.'+name, function(e, evt){
					isBetweenRange(this, api.timeRanges[name], evt.time);
				});
			} else if(!o.activate && api.timeRanges[name].active){
				api.timeRanges[name].active = false;
				api.timeRanges[name].entered = false;
				$(this).unbind('timechange.'+ name);
			} 
			
			
			if(o.resort){
				api.timeRanges[name].enterRanges.sort(numsort);
				api.timeRanges[name].leaveRanges.sort(numsort);
			}
			
		});
	};
		
	$.fn.addTimeRange.defaults = {
		enter: false,
		leave: false,
		callback: false,
		resort: false,
		activate: true
	};
})(jQuery);
