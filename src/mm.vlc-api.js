/**!
 * Part of the jMediaelement-Project | http://github.com/aFarkas/jMediaelement
 * @author Alexander Farkas
 * Copyright 2010, Alexander Farkas
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */

(function($){
	function isReady(api){
		var timer;
		function testReady(){
			try{
				if(api.apiElem.input){
					queueEvent('mmAPIReady', api);
				} else {
					return;
				}
				clearInterval(timer);
				if($.attr(api.element, 'autoplay')){
					interval.start(api);
				} else {
					api.apiElem.playlist.stop();
					setTimeout(function(){
						api.apiElem.playlist.stop();
					}, 0);
				}
			} catch(e){}
			
		}
		clearInterval(timer);
		timer = setInterval(testReady, 333);
		testReady();
	}
	
	function queueEvent(event, api){
		setTimeout(function(){
			api._trigger(event);
		}, 0);
	}
	
	var interval = {
		start: function(api){
			interval.end(api);
			api._intervalCheckTimer = setInterval(function(){
				api._intervalCheck.call(api);
			}, 1000);
		},
		end: function(api){
			if(api._intervalCheckTimer){
				clearInterval(api._intervalCheckTimer);
			}
		}
	};
	
	function queueCheck(api){
		setTimeout(function(){
			api._intervalCheck();
		}, 9);
	}
	
	var states = {
		2: 'waiting',
		3: 'playing',
		4: 'pause',
		6: 'ended'
	};
	
	var vlcAPI = {
		_init: function(){
			var api = this;
			isReady(api);
		},
		_intervalCheck: function(){
			var vlc 	= this.apiElem,
				state 	= vlc.input.state,
				api 	= this,
				meta 	= {
					type: 'loadedmeta',
					duration: vlc.input.length / 1000
				},
				evt
			;
			
			if((state && state > 1 && !this.data.metaLoaded) || (this.data.metaLoaded && this.data.metaLoaded.duration !== meta.duration)){
				queueEvent(meta, api);
				this.data.metaLoaded = meta;
			}
			
			evt = {
				type: 'timechange',
				time: vlc.input.time / 1000
			};
			
			if(state && state > 1 && this.data.time !== evt.time){
				if(meta.duration){
					evt.duration = meta.duration;
					evt.timeProgress = vlc.input.position * 100;
				}
				this.data.time = evt.time;
				queueEvent(evt, api);
			}
			
			evt = {
				type: 'mute',
				isMuted: vlc.audio.mute
			};
			
			if(evt.isMuted !== this.data.isMuted){
				this.data.isMuted = evt.isMuted;
				queueEvent(evt, api);
			}
			
			evt = {
				type: 'volumelevelchange',
				volumelevel: vlc.audio.volume / 2
			};
			
			if(evt.volumelevel !== this.data.volumelevel){
				this.data.volumelevel = evt.volumelevel;
				queueEvent(evt, api);
			}
			
			
			if(state !== this.data.state){
				this.data.state = state;
				if(states[state]){
					queueEvent(states[state], api);
				}
				if(states[state] === 'ended'){
					vlc.playlist.stop();
				}
				if(state === 3){
					interval.start(api);
				} else if(state === 4 || state === 5 || state === 6 || state === 7) {
					interval.end(api);
				}
			}
			
		},
		play: function(){
			this.apiElem.playlist.play();
			this._trigger('play');
			interval.start(this);
			queueCheck(this);
		},
		pause: function(){
			if(states[this.apiElem.input.state] === 'playing'){
				interval.end(this);
				this.apiElem.playlist.togglePause();
				queueCheck(this);
			}
		},
		_isPlaying: function(){
			var ret = false;
			try {
				ret = states[this.apiElem.input.state] === 'playing';
			} catch(e){}
			return ret;
		},
		_mmload: function(src){
			$(this.element).unbind('playing.enterFullscreen');
			this.apiElem.playlist.stop();
			this.data = {};
			var item = this.apiElem.playlist.add(src, " ", ":no-video-title-show");
			this._currentSrc = src;
			this.apiElem.playlist.playItem(item);
			this.apiElem.playlist.items.clear();
			if(!$.attr(this.element, 'autoplay')){
				interval.end(this);
				this.apiElem.playlist.stop();
			}
		},
		getCurrentSrc: function(){
			return this._currentSrc;
		},
		currentTime: function(t){
			try {
				if(!isFinite(t)){
					return this.apiElem.input.time / 1000;
				}
				this.apiElem.input.time = t * 1000;
				queueCheck(this);
			} catch(e){
				if(!isFinite(t)){
					return 0;
				}
			}
		},
		getDuration: function(){
			var dur;
			try {
				dur = this.apiElem.input.length / 1000 || 0;
			} catch(e){
				dur = 0;
			}
			return dur;
		},
		volume: function(v){
			if (!isFinite(v)) {
				return parseInt(this.apiElem.audio.volume / 2, 10);
			}
			this.apiElem.audio.volume = v * 2;
			queueCheck(this);
		},
		muted: function(state){
			if(typeof state !== 'boolean'){
				return this.apiElem.audio.mute;
			} 
			this.apiElem.audio.mute = state;
			queueCheck(this);
		}
	};
	
	$.multimediaSupport.add('vlc', 'video', $.extend({ 
			_videoFullscreen: true,
			enterFullScreen: function(){
				if(!this._isPlaying()){
					var that = this;
					$(that.element).one('playing.enterFullscreen', function(){
						that.apiElem.video.fullscreen = true;
					});
					this.play();
				} else {
					this.apiElem.video.fullscreen = true;
				}
				
			},
			exitFullScreen: function(){
				this.apiElem.video.fullscreen = false;
			}
		}, vlcAPI)
	);
	$.multimediaSupport.add('vlc', 'audio', vlcAPI);
})(jQuery);

