/**
 * @author trixta
 */
(function($){
	
	var playTimer = (function(){
		var timer, 
			fns = []
		;
		
		function invoke(){
			for(var i = 0, len = fns.length; i < len; i++){
				fns[i]();
			}
		}
		
		return {
			add: function(fn){
				if($.inArray(fn, fns) === -1){
					fns.push(fn);
				}
				if(fns.length === 1){
					timer = setInterval(invoke, 1000);
				}
			},
			remove: function(fn){
				fns = $.grep(fns, function(curFn){
					return (fn !== curFn);
				});
				if(!fns.length){
					clearInterval(timer);
				}
			}
		};
	})();
	
	var cortado = {
		_init: function(){
			var api 				= this,
				lastTime,
				updateCurrentTime 	= function(){
							if(api.apiElem.currentTime !== lastTime){
								var e = {
									type: 'timechange',
									time: api.apiElem.currentTime
								};
								if( api._duration ){
									e.duration = api._duration;
									e.timeProgress = e.time / e.duration * 100;
								}
								lastTime = e.time;
								api._trigger(e);
							}
						}
			;
			
			setTimeout(function(){
				//autoPlay
				api._duration = parseInt(api.html5elem.getAttribute('data-duration'), 10);
				api._isPausedState = (api.apiElem.getParameter('autoPlay') === 'false');
				api._isMuted = (api.apiElem.getParameter('audio') === 'false');
				lastTime = api.apiElem.currentTime;
				
				
				
				$(api.html5elem)
					.bind('play', function(){
						playTimer.add(updateCurrentTime);
					})
					.bind('pause ended', function(){
						playTimer.remove(updateCurrentTime);
					})
				;
				
				api._trigger({
					type: 'mmAPIReady',
					noVolume: true,
					noProgress: true,
					noDuration: !(api._duration)
				});
				
				api._trigger({
					type: 'loadedmeta',
					duration: api._duration
				});
				if(!api._isPausedState){
					api._trigger('play');
				}
			}, 0);
		},
		getDuration: function(){
			return api._duration;
		},
		isPaused: function(){
			return this._isPausedState;
		},
		play: function(){
			this.apiElem.play();
			this._isPausedState = false;
			this._trigger('play');
		},
		pause: function(){
			this.apiElem.pause();
			this._isPausedState = true;
			this._trigger('pause');
		},
		currentTime: function(sec){
			if(arguments.length){
				if(this._duration){
					this.apiElem.doSeek(sec / this._duration);
				}
			}
			return this.apiElem.currentTime;
		},
		muted: function(state){
			if(!arguments.length){
				return this._isMuted;
			} 
			this.apiElem.setParam('audio', (state) ? 'true' : 'false');
			this.apiElem.restart();
			this._isMuted = state;
			var e = {type: 'mute', isMuted: state};
			this._trigger(e);
		}
	};
	
	$.multimediaSupport.add('cortado', 'video', cortado);
})(jQuery);
