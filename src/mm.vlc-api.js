/**!
 * Part of the jMediaelement-Project | http://github.com/aFarkas/jMediaelement
 * @author Alexander Farkas
 * Copyright 2010, Alexander Farkas
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */

(function($){
	function isReady(api){
		var timer;
		clearInterval(timer);
		function testReady(){
			try{
				if(api.apiElem.input){
					queueEvent('mmAPIReady', api);
				} else {
					return;
				}
				clearInterval(timer);
				if($.attr(api.html5elem, 'autoplay')){
					interval.start(api);
				}
			} catch(e){}
			
		}
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
		isPlaying: function(){
			var ret = false;
			try {
				ret = states[this.apiElem.input.state] === 'playing';
			} catch(e){}
			return ret;
		},
		_mmload: function(src, poster, extras){
			this.apiElem.playlist.items.clear();
			this.data = {};
			this.apiElem.playlist.add(src);
			queueCheck(this);
		},
		currentTime: function(t){
			if(this.nodeName === 'audio'){
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
			} else {
				if(!isFinite(t)){
					return this.apiElem.input.time / 1000;
				}
				this.apiElem.input.time = t * 1000;
				queueCheck(this);
			}
		},
		getDuration: function(){
			var dur = 0;
			if(this.nodeName === 'audio'){
				try {
					dur = this.apiElem.input.length / 1000 || 0;
				} catch(e){
					dur = 0;
				}
			} else {
				dur = this.apiElem.input.length / 1000 || 0;
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
	
	$.multimediaSupport.add('vlc', 'video', vlcAPI);
	$.multimediaSupport.add('vlc', 'audio', $.extend({}, vlcAPI, {
		currentTime: function(t){
			var ret;
			try {
				ret = vlcAPI.call(this, t);
			} catch(e){
				if(!isFinite(t)){
					return 0;
				}
			}
			return ret;
		},
		getDuration: function(){
			var dur = 0;
			try {
				dur = vlcAPI.call(this);
			} catch(e){
				dur = 0;
			}
			
			
			return dur;
		}
	}));
})(jQuery);
