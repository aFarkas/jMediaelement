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
	
	if('enterFullScreen' in video){
		$.support.videoFullscreen = true;
		fsMethods.enter = 'enterFullScreen';
		fsMethods.exit = 'exitFullScreen';
	} else {
		$.each(['webkit', 'moz', 'o', 'ms'], function(i, name){
			if(name+'EnterFullScreen' in video){
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
			var type = e.type || e;
			switch(type){
				case 'mmAPIReady':
					this.isAPIReady = true;
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
			$(this.html5elem).triggerHandler(e, e);
			
			if(e.type !== 'load' && e.type !== 'error'){
				$(this.html5elem.ownerDocument || document).triggerHandler(e, e);
			}
			
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
		_format: function(sec, base){
			var ret = [
				parseInt(sec/3600, 10),
				parseInt(sec/60%60, 10) < 10 ? "0"+parseInt(sec/60%60, 10) : ""+parseInt(sec/60%60, 10),
				parseInt(sec%60, 10) < 10 ? "0"+parseInt(sec%60, 10) : ""+parseInt(sec%60, 10)
			];
			if(!ret[0]){
				ret.shift();
			}
			return ret.join(':');
		},
		getFormattedDuration: function(){
			return this._format(this.getDuration());
		},
		getFormattedTime: function(){
			return this._format(this.currentTime());
		},
		loadSrc: function(srces, poster, extras){
			if(srces){
				$.attr(this.html5elem, 'srces', srces);
				srces = $.isArray(srces) ? srces : [srces];
			} else {
				srces = $.attr(this.html5elem, 'srces');
			}
			if(poster !== undefined){
				$.attr(this.html5elem, 'poster', poster);
			} else {
				poster = $.attr(this.html5elem, 'poster');
			}
			
			var canPlaySrc,
				that = this
			;
			
			$.each(srces, function(i, src){
				if( that._canPlaySrc(src) ){
					canPlaySrc = src;
					return false;
				}
			});
			if(canPlaySrc){
				canPlaySrc = canPlaySrc.src || canPlaySrc;
				this._mmload(canPlaySrc, poster, extras);
			} else {
				$.multimediaSupport.helper._setAPIActive(this.html5elem, 'nativ');
				$(this.html5elem).data('mediaElemSupport').apis.nativ._mmload(extras);
			}
		}
	});
	
	
	
	//add API for native MM-Support
	var nativ = {
		isTechAvailable: $.support.mediaElements,
		_init: function(){
			var that 		= this,
				curMuted 	= this.apiElem.muted
			;
			//addEvents
			
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
						that._trigger('mmAPIReady');
						that._trigger({
							type: 'loadedmeta',
							duration: this.duration
						});
					}
				})
				//current webkit builds are using load instead of progress
				.bind('progress load', function(e){
					if(e.originalEvent && 'lengthComputable' in e.originalEvent && e.originalEvent.loaded){
						var evt = {
							type: 'progresschange',
							lengthComputable: e.originalEvent.lengthComputable,
							loaded: e.originalEvent.loaded
						};
						
						if(e.originalEvent.lengthComputable && e.originalEvent.total){
							$.extend(evt, {
								total: e.originalEvent.total,
								relLoaded: e.originalEvent.total / e.originalEvent.loaded * 100
							});
						}
						that._trigger(evt);
					}
				})
			;
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
		},/*
		currentSrc: function(src){
			if(arguments.length){
				this.html5elem.load(src);
			}
			return this.html5elem.currentSrc;
		},*/
		_mmload: function(extras){
			if(this.html5elem.load){
				this.html5elem.load();
			} else {
				jElm.triggerHanlder('error');
			}
		},
		isPlaying: function(){
			return (!this.html5elem.paused && this.html5elem.readyState > 2 && !this.error && !this.ended);
		},
		getDuration: function(){
			return this.html5elem.duration;
		}
	};
	
	
	
	$.multimediaSupport.add('nativ', 'video', $.extend({
		_videoFullscreen: $.support.videoFullscreen,
		enterFullScreen: function(){
			try {
				this.html5elem[fsMethods.enter]();
			} catch(e){}
		},
		exitFullScreen: function(){
			try {
				this.html5elem[fsMethods.exit]();
			} catch(e){}
		}
	}, nativ), true);
	
	
	$.multimediaSupport.add('nativ', 'audio', nativ, true);
	
	
	//public-methods
	$.fn.getMMAPI = function(full){
		if(!this[0]){return;}
		var api = $.data(this[0], 'mediaElemSupport');
		return ( full || !api || !api.name || !api.apis ) ? api : api.apis[api.name];
	};
	
	var attrFns = ['muted', 'supportsFullScreen', 'getFormattedDuration', 'getFormattedTime', 'currentTime', 'isPlaying', 'getDuration', 'volume', 'relCurrentTime'];
	
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