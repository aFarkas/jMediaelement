/**!
 * Part of the jMediaelement-Project | http://github.com/aFarkas/jMediaelement
 * @author Alexander Farkas
 * Copyright 2010, Alexander Farkas
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
(function($){
	var video 		= document.createElement('video'), 
		fsMethods	= {}
	;
	
	if('enterFullScreen' in video && video.supportsFullscreen){
		$.support.videoFullscreen = true;
		fsMethods.enter = 'enterFullScreen';
		fsMethods.exit = 'exitFullScreen';
	} else {
		$.each(['webkit', 'moz', 'o', 'ms'], function(i, name){
			if(name+'EnterFullScreen' in video && video[name+'SupportsFullscreen']){
				$.support.videoFullscreen = true;
				fsMethods.enter = name+'EnterFullScreen';
				fsMethods.exit = name+'ExitFullScreen';
				return false;
			}
		});
	}
	
	video = null;
	
	//extend apiPrototype
	$.extend($.multimediaSupport.apiProto, {
		_trigger: function(e){
			var type = e.type || ({type: e}).type,
				evt  = e
			;
			
			switch(type){
				case 'mmAPIReady':
					this.isAPIReady = true;
					e.api = this.name;
					break;
				case 'loadedmeta':
					this.loadedmeta = e;
					break;
				case 'emptied':
					this.loadedmeta = false;
					break;
				case 'error':
					this.loadedmeta = false;
					break;
			}
			
			e.target = this.html5elem;
			e = $.Event(e);
			e.preventDefault();
			
			if(e.type === 'timechange'){
				e.stopPropagation();
			}
			$.event.trigger( e, evt, this.html5elem );
		},
		supportsFullScreen: function(){
			return this._videoFullscreen || false;
		},
		enterFullscreen: $.noop,
		exitFullscreen: $.noop,
		isAPIReady: false,
		relCurrentTime: function(rel){
			var dur = this.getDuration();
			if(rel && isFinite(rel)){
				this.currentTime(dur * rel / 100);
			}
			return this.currentTime() / dur * 100; 
		},
		togglePlay: function(){
			this[(this.isPlaying()) ? 'pause' : 'play']();
		},
		toggleMuted: function(){
			this.muted(!(this.muted()));
		},
		getMMVisual: function(){
			return this.visualElem;
		},
		onMediaReady: function(fn){
			var e = {type: 'mmAPIReady'};
			if(this.isAPIReady){
				fn.call(this.html5elem, e, e);
			} else {
				$(this.html5elem).one('mmAPIReady', fn);
			}
		},
		_format: function(sec){
			return $.map(
				[
					parseInt(sec/60, 10),
					parseInt(sec%60, 10)
				], 
				function(num){
					return (isNaN(num)) ? '--' : (num < 10) ? ('0'+num) : num;
				})
				.join(':')
			;
		},
		getFormattedDuration: function(){
			return this._format(this.getDuration());
		},
		getFormattedTime: function(){
			return this._format(this.currentTime());
		},
		loadSrc: function(srces, poster){
			if(srces){
				$.attr(this.html5elem, 'srces', srces);
				srces = $.isArray(srces) ? srces : [srces];
			} else {
				srces = $.attr(this.html5elem, 'srces');
			}
			if(poster !== undefined){
				if(poster){
					$.attr(this.html5elem, 'poster', poster);
				} else {
					$(this.html5elem).removeAttr('poster');
				}
			} else {
				poster = $.attr(this.html5elem, 'poster');
			}
			this._isResetting = true;
			this._trigger('mediareset');
			var canPlaySrc = this.canPlaySrces(srces);
			
			if(canPlaySrc){
				canPlaySrc = canPlaySrc.src || canPlaySrc;
				this._mmload(canPlaySrc, poster);
			} else {
				$.multimediaSupport.helper._setAPIActive(this.html5elem, 'nativ');
				$(this.html5elem).data('mediaElemSupport').apis.nativ._mmload();
			}
			this._isResetting = false;
		},
		isPlaying: function(){
			return (this._isResetting) ? false : this._isPlaying();
		}
	});
	
	var fixProgressEvent = (function(){
		var unboundNeedless;
		
		return function(api){
			// firefox and old webkits (safari 4/chrome 3) are using an extended event, but safari uses load instead of progress
			// newer webkits are compilant to the current w3c specification
			// opera 10.5 hasn´t implemented the timerange-object yet <- no support
			var calculateProgress = function(e){
				
				
				var evt = {type: 'progresschange'}, 
					dur
				;
				//old implementation
				if(e.originalEvent && 'lengthComputable' in e.originalEvent && e.originalEvent.loaded){
					if(e.originalEvent.lengthComputable && e.originalEvent.total){
						$.extend(evt, {
							relLoaded: e.originalEvent.loaded / e.originalEvent.total * 100
						});
					}
					//remove event
					if(!unboundNeedless){
						$(this).unbind((e.type === 'load') ? 'progress' : 'load', calculateProgress);
						unboundNeedless = true;
					}
					api._trigger(evt);
				
				//current implementation
				//currently handles the simple buffer state, other aren´t supported by current browsers anyway
				//ToDo add real timerange buffer information
				} else if(e.type === 'progress' && this.buffered && this.buffered.length){
					dur = this.duration;
					if(dur){
						evt.relLoaded = this.buffered.end(0) / dur * 100;
					}
					api._trigger(evt);
				}
				
			};
			$(api.html5elem).bind('progress load', calculateProgress);
		};
	})();
	
	//add API for native MM-Support
	var nativ = {
		isTechAvailable: $.support.mediaElements,
		_init: function(){
			var that 		= this,
				curMuted 	= this.apiElem.muted
			;
			
			//addEvents
			fixProgressEvent(this);
			$(this.html5elem)
				.bind({
					volumechange: function(){
						if(curMuted !== that.apiElem.muted){
							curMuted = that.apiElem.muted;
							that._trigger.call(that, {type: 'mute', isMuted: curMuted});
						} else {
							that._trigger.call(that, {type: 'volumelevelchange', volumelevel: that.apiElem.volume * 100});
						}
					},
					
					timeupdate: function(){
						var e = {
							type: 'timechange',
							time: this.currentTime
						};
						if(this.duration){
							e.duration = this.duration;
							e.timeProgress = e.time / e.duration * 100;
						}
						that._trigger(e);
					},
					loadedmetadata: function(e){
						that._trigger({
							type: 'loadedmeta',
							duration: this.duration
						});
					}
				})
			;
			that._trigger('mmAPIReady');
		},
		play: function(src){
			this.html5elem.play();
		},
		pause: function(){
			this.html5elem.pause();
		},
		muted: function(bool){
			if(typeof bool === 'boolean'){
				this.html5elem.muted = bool;
			}
			return this.html5elem.muted;
		},
		volume: function(vol){
			if(isFinite(vol)){
				this.html5elem.volume = vol / 100;
			}
			return this.html5elem.volume * 100;
		},
		currentTime: function(sec){
			if(isFinite(sec)){
				try {
					this.html5elem.currentTime = sec;
				} catch(e){}
			}
			return this.html5elem.currentTime;
		},
		_mmload: function(extras){
			if(this.html5elem.load){
				this.html5elem.load();
			} else {
				$(this.html5elem).triggerHandler('error');
			}
		},
		_isPlaying: function(){
			return (!this.html5elem.paused && this.html5elem.readyState > 2 && !this.error && !this.ended);
		},
		getDuration: function(){
			return this.html5elem.duration;
		},
		getCurrentSrc: function(){
			return this.html5elem.currentSrc;
		}
	};
	
	
	
	$.multimediaSupport.add('nativ', 'video', $.extend({
		_videoFullscreen: $.support.videoFullscreen,
		enterFullScreen: function(){
			if(!this._videoFullscreen){return false;}
			try {
				this.html5elem[fsMethods.enter]();
			} catch(e){}
		},
		exitFullScreen: function(){
			if(!this._videoFullscreen){return false;}
			try {
				this.html5elem[fsMethods.exit]();
			} catch(e){}
		}
	}, nativ));
	
	
	$.multimediaSupport.add('nativ', 'audio', nativ);
	
	
	//public-methods
	$.fn.getMMAPI = function(full){
		if(!this[0]){return;}
		var api = $.data(this[0], 'mediaElemSupport');
		return ( full || !api || !api.name || !api.apis ) ? api : api.apis[api.name];
	};
	
	var attrFns = ['muted', 'getCurrentSrc', 'supportsFullScreen', 'enterFullscreen', 'exitFullscreen', 'getFormattedDuration', 'getFormattedTime', 'currentTime', 'isPlaying', 'getDuration', 'volume', 'relCurrentTime'];
	
	$.each($.multimediaSupport.apis.video.nativ, function(name, fn){
		if ( name.indexOf('_') !== 0 && fn && $.isFunction(fn) ) {
			$.multimediaSupport.attrFns[name] = true;
		}
	});
	
	$.each($.multimediaSupport.apis.video.nativ, function(name, fn){
		if( name.indexOf('_') !== 0 && fn && $.isFunction(fn) && !$.fn[name] ){
			$.fn[name] =  function(){
				var args = arguments, ret;
				this.each(function(){
					var api = $(this).getMMAPI();
					if(api){
						ret = api[name].apply(api, args);
					}
				});
				return (ret === undefined) ? this : ret; 
			};
		}
	});
	
})(jQuery);