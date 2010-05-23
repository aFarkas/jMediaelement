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
				if( api.apiElem.input && api.apiElem.input.state !== undefined ){
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
			isReady(this);
			this._setPoster($.attr(this.element, 'poster'));
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
					api._adjustPluginLoop(api._loop);
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
			if(this._currentTimeAdjust !== false){
				try {
					this.apiElem.input.time = this._currentTimeAdjust;
				} catch(e){}
				this._resetCurrentTime();
			}
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
		_mmload: function(src, poster){
			$(this.element).unbind('playing.enterFullscreen');
			this.apiElem.playlist.stop();
			this.data = {};
			var item = this.apiElem.playlist.add(src, " ", ":no-video-title-show");
			this._currentSrc = src;
			this.apiElem.playlist.playItem(item);
			this.apiElem.playlist.items.clear();
			this._setPoster(poster);
			this._showPoster(false, {time: 0});
			if(!$.attr(this.element, 'autoplay')){
				interval.end(this);
				this.apiElem.playlist.stop();
			}
			
		},
		getCurrentSrc: function(){
			return this._currentSrc;
		},
		_currentTimeAdjust: false,
		_currentTimeTimer: false,
		_resetCurrentTime: function(){
			clearTimeout(this._currentTimeTimer);
			this._currentTimeAdjust = false;
		},
		currentTime: function(t){
			try {
				if(!isFinite(t)){
					return (this.apiElem.input) ? this.apiElem.input.time / 1000 : 0;
				}
				var state;
				if(!this.loadedmeta){
					state = states[this.apiElem.input.state];
					this.play();
				}
				this._currentTimeAdjust = t * 1000;
				clearTimeout(this._currentTimeTimer);
				this._currentTimeTimer = setTimeout($.proxy(this, '_resetCurrentTime'));
				this.apiElem.input.time = this._currentTimeAdjust;
				queueCheck(this);
				if(state && (state !== 'playing' && state !== 'waiting')){
					this.pause();
				}
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
				return (this.apiElem.audio) ? parseInt(this.apiElem.audio.volume / 2, 10) : 100;
			}
			if(this.apiElem.audio){
				this.apiElem.audio.volume = v * 2;
				queueCheck(this);
			}
		},
		muted: function(state){
			if(typeof state !== 'boolean'){
				try {
					return (this.apiElem.audio) ? this.apiElem.audio.mute : true;
				} catch(e){
					return false;
				}
			} 
			if(this.apiElem.audio){
				this.apiElem.audio.mute = state;
				queueCheck(this);
			}
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
				return true;
			},
			exitFullScreen: function(){
				this.apiElem.video.fullscreen = false;
				return true;
			}
		}, vlcAPI)
	);
	$.multimediaSupport.add('vlc', 'audio', vlcAPI);
})(jQuery);

