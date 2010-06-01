(function($){
	/**
	 * helps you to detect user activity/userinactivity in an html-area
	 * 
	 *  usage:
	 *  
	 *  $('div.my-element')
	 *  	.bind('useractive', function(e){
	 *  		// user is active in this area
	 *  	})
	 *  	.bind('userinactive', function(e){
	 *  		// user is inactive in this area
	 *  	})
	 *  ;
	 *  
	 *  more advanced usage:
	 *  
	 *  $('div.my-element')
	 *  	.bind('useractive', function(e){
	 *  		// user is active in this area
	 *  	})
	 *  	.bind('userinactive', {idletime: 1500}, function(e){
	 *  		// user is inactive in this area
	 *  	})
	 *  ;
	 */
	if(!$.support.opacity && !$.opacityRemoveFix){
		var oldStyle = $.style;
		$.style = function(elem, name, value){
			var ret = oldStyle(elem, name, value);
			if(name === 'opacity' && value == 1){
				elem.style.filter = (elem.style.filter || '').replace('alpha(opacity=100)', '');
			}
			return ret;
		};
		$.opacityRemoveFix = true;
	}
	var activity = {
		add: function(elem, cfg, name){
			var data 		= $.data(elem, 'useractivity') || $.data(elem, 'useractivity', {idletime: 2500, idle: true, trigger: {}}),
				jElm 		= $(elem),
				setInactive = function(){
					
					if(!data.idle){
						data.idle = true;
						if ( data.trigger.userinactive ) {
							jElm.trigger('userinactive');
						}
					}
				},
				setActive 	= function(e){
					if(!e || (e.type === 'mousemove' && e.pageX === x && e.pageY === y)){return;}
					if(e.type === 'mousemove'){
						 x = e.pageX;
						 y = e.pageY;
					}
					if(data.idleTimer){
						clearTimeout(data.idleTimer);
					}
					data.idleTimer = setTimeout(setInactive, data.idletime);
					if(data.idle){
						data.idle = false;
						if( data.trigger.useractive ){
							jElm.trigger('useractive');
						}
					}
				},
				x, y
			;
			data.idletime = (cfg || {}).idletime || data.idletime;
			data.trigger[name] = true;
			
			if( !data.bound ){
				jElm
					.bind('mouseleave.useractivity', setInactive)
					.bind('mousemove.useractivity focusin.useractivity mouseenter.useractivity keydown.useractivity keyup.useractivity', setActive)
				;
				data.bound = true;
			}
		},
		remove: function(elem, name){
			var data = $.data(elem, 'useractivity') || $.data(elem, 'useractivity', {idletime: 2500, idle: true, trigger: {}});
			data.trigger[name] = false;
			if(!data.trigger.useractive && !data.trigger.userinactive){
				$(elem).unbind('.useractivity');
				data.bound = false;
			}
		}
	};
	$.each(['useractive', 'userinactive'], function(i, name){
		$.event.special[name] = {
			setup: function(cfg){
				activity.add(this, cfg, name);
			},
			teardown: function(){
				activity.remove(this, name);
			}
		};
	});
	
	
})(jQuery);