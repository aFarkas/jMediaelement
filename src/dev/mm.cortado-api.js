/**!
 * Part of the jMediaelement-Project | http://github.com/aFarkas/jMediaelement
 * @author Alexander Farkas
 * Copyright 2010, Alexander Farkas
 * Dual licensed under the MIT or GPL Version 2 licenses.
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
					setTimeout(fn, 300);
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
								var e = {};
								lastTime = api.apiElem.currentTime;
								if(lastTime > 0){
									e.type = 'timechange';
									e.time = lastTime;
									if(!api._isPlayingState){
										api._isPlayingState = true;
										api._trigger('playing');
									}
									if( api._duration ){
										e.duration = api._duration;
										e.timeProgress = e.time / e.duration * 100;
									}
								} else {
									e.type = 'ended'; 
								}
								api._trigger(e);
							}
						}
			;
			setTimeout(function(){
				//autoPlay
				api._duration = parseInt(api.html5elem.getAttribute('data-duration'), 10) || 2000;
				var autoplay = (api.apiElem.getParameter('autoPlay') !== 'false');
				api._isMuted = (api.apiElem.getParameter('audio') === 'false');
				lastTime = api.apiElem.currentTime;
				if(autoplay){
					playTimer.add(updateCurrentTime);
				}
				$(api.html5elem)
					.bind('play', function(){
						playTimer.add(updateCurrentTime);
					})
					.bind('pause ended', function(){
						api._isPlayingState = false;
						playTimer.remove(updateCurrentTime);
					})
				;
				
				api._trigger({
					type: 'mmAPIReady',
					noVolume: true,
					noProgress: true
				});
				
				api._trigger({
					type: 'loadedmeta',
					duration: api._duration
				});
			}, 0);
		},
		getDuration: function(){
			return this._duration;
		},
		isPlaying: function(){
			return this._isPlayingState;
		},
		play: function(){
			this.apiElem.play();
			this._trigger('play');
		},
		pause: function(){
			this.apiElem.pause();
			this._trigger('pause');
		},
		// not available
		volume: function(v){
			if (!isFinite(v)) {
				return 100;
			}
		},
		currentTime: function(sec){
			if(isFinite(sec)){
				this.apiElem.doSeek(sec / this._duration);
			} else {
				return this.apiElem.currentTime;
			}
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
		},
		_mmload: function(src, poster){
			var autoplay = $.attr(this.html5elem, 'autoplay');
			this.apiElem.setParam('autoPlay', ''+autoplay);
			this.apiElem.setParam('image', $.attr(this.html5elem, 'poster') || '');
			this.apiElem.setParam("url", uri);
			this.apiElem.restart();
		}
	};
	
	$.multimediaSupport.add('cortado', 'video', cortado);
	$.multimediaSupport.add('cortado', 'audio', cortado);
})(jQuery);
