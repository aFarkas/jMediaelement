/**!
 * Part of the jMediaelement-Project | http://github.com/aFarkas/jMediaelement
 * @author Alexander Farkas
 * Copyright 2010, Alexander Farkas
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
(function($){
	var video 		= document.createElement('video'), 
		$m 			= $.multimediaSupport,
		noAPIEvents = {
			apiActivated: true,
			apiDeActivated: true,
			mediareset: true,
			totalerror: true
		},
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
	
	$.extend($m, {
		formatTime: function(sec){
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
		}
	});
	
	//ToDo add onAPIReady/mmAPIReady
	$.event.special.loadedmeta = {
	    add: function( details ) {
			var api = $(this).getMMAPI();
			if(api && api.loadedmeta){
				var evt = $.extend({}, api.loadedmeta);
				details.handler.call(this, evt, evt);
			}
	    }
	};
	
	

	//extend fn
	$.extend($m.fn, {
		_trigger: function(e){
			var type = e.type || e,
				evt  = e
			;

			switch(type){
				case 'mmAPIReady':
					if(this.isAPIReady){
						return;
					} else {
						this.isAPIReady = true;
					}
					break;
				case 'loadedmeta':
					this.loadedmeta = evt;
					break;
				case 'totalerror':
					this.totalerror = true;
					break;
				case 'mediareset':
					this.loadedmeta = false;
					this.totalerror = false;
					break;
			}
			
			if(!this.isAPIActive || (this.totalerror && !noAPIEvents[type])){return;}
			if(!this.isAPIReady && !noAPIEvents[type]){
				this._trigger('mmAPIReady');
			}
			if(e.type === 'progresschange'){
				e.relStart = e.relStart || 0;
				if(this._concerningBufferStart !== e.relStart){
					this._concerningBufferStart = e.relStart;
					this._trigger({type: 'bufferrange', relStart: e.relStart, relLoaded: e.relLoaded});
				}
			}
			
			e.target = this.element;
			e = $.Event(e);
			e.preventDefault();
			
			e.mediaapi = this.name;
			
			if(e.type === 'timechange' || e.type === 'progresschange'){
				e.stopPropagation();
			}
			
			$.event.trigger( e, evt, this.element );
		},
		supportsFullScreen: function(){
			return this._videoFullscreen || false;
		},
		enterFullscreen: $.noop,
		exitFullscreen: $.noop,
		isAPIReady: false,
		relCurrentTime: function(rel){
			var dur = this.getDuration() || Number.MIN_VALUE;
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
		onAPIReady: function(fn, n){
			var e = {type: 'mmAPIReady'};
			if(this.isAPIReady){
				fn.call(this.element, e, e);
			} else {
				n = n || 'jmediaelement';
				$(this.element).one('mmAPIReady.'+n, fn);
			}
		},
		unAPIReady: function(name){
			$(this.element).unbind('mmAPIReady.'+name);
		},
		_format: $m.formatTime,
		getFormattedDuration: function(){
			return this._format(this.getDuration());
		},
		getFormattedTime: function(){
			return this._format(this.currentTime());
		},
		loadSrc: function(srces, poster){
			if(srces){
				$.attr(this.element, 'srces', srces);
				srces = $.isArray(srces) ? srces : [srces];
			} else {
				srces = $.attr(this.element, 'srces');
			}
			if(poster !== undefined){
				if(poster){
					$.attr(this.element, 'poster', poster);
				} else {
					$(this.element).removeAttr('poster');
				}
			} else {
				poster = $.attr(this.element, 'poster');
			}
			this._isResetting = true;
			
			var canPlaySrc = this.canPlaySrces(srces);
			
			if(canPlaySrc){
				canPlaySrc = canPlaySrc.src || canPlaySrc;
				this._trigger('mediareset');
				this._mmload(canPlaySrc, poster);
			} else {
				$m._setAPIActive(this.element, 'nativ');
				this._trigger('mediareset');
				$(this.element).data('mediaElemSupport').apis.nativ._mmload();
			}
			this._isResetting = false;
		},
		isPlaying: function(){
			return (this._isResetting) ? false : this._isPlaying();
		}
	});
	
	// firefox and old webkits (safari 4/chrome 4) are using an extended event, but safari uses load instead of progress
	// newer webkits are compilant to the current w3c specification (progress is a simple event + buffered is a timerange-object)
	// opera 10.5 hasn´t implemented the timerange-object yet <- no support
	var fixProgressEvent = function(api){
		var unboundNeedless,
		 	getConcerningRange 			= function(){
				var time 	= api.element.currentTime,
					buffer 	= api.element.buffered,
					bufLen 	= buffer.length,
					ret 	= {}
				;
				
				for(var i = 0; i < bufLen; i++){
					ret.start = buffer.start(i);
					ret.end = buffer.end(i);
					if(ret.start <= time && ret.end >= time){
						break;
					}
				}
				return ret;
			},
			
			calculateProgress 	= function(e){
				var evt = {type: 'progresschange'}, 
					dur, bufRange
				;
				//current implementation -> chrome 5
				if(this.buffered && this.buffered.length){
					dur = this.duration;
					if(dur){
						bufRange = getConcerningRange();
						evt.relStart = bufRange.start / dur * 100;
						evt.relLoaded = bufRange.end / dur * 100;
					}
					api._trigger(evt);
				//ff implementation implementation
				} else if(e.originalEvent && 'lengthComputable' in e.originalEvent && e.originalEvent.loaded){
					if(e.originalEvent.lengthComputable && e.originalEvent.total){
						evt.relStart = 0;
						evt.relLoaded = e.originalEvent.loaded / e.originalEvent.total * 100;
					}
					//remove event
					if(!unboundNeedless){
						$(this).unbind((e.type === 'load') ? 'progress' : 'load', calculateProgress);
						unboundNeedless = true;
					}
					api._trigger(evt);
				}
				
			}
		;
		$(api.element).bind('progress load', calculateProgress);
	};
	
	//add API for native MM-Support
	var nativ = {
		isTechAvailable: $.support.mediaElements,
		_init: function(){
			var that 				= this,
				curMuted 			= this.apiElem.muted,
				hasInitialError 	= false,
				catchInitialError 	= function(){
					hasInitialError = true;
				}
			;
			
			//addEvents
			fixProgressEvent(this);
			$(this.element)
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
					loadedmetadata: function(){
						that._trigger({
							type: 'loadedmeta',
							duration: this.duration
						});
					}
				})
				.one('mediaerror', catchInitialError)
			;
			//workaround
			if(this.element.readyState > 0 && !this.element.error){
				$(that.element).unbind('mediaerror', catchInitialError);
				this._trigger({
					type: 'loadedmeta',
					duration: this.element.duration
				});
			} else {
				setTimeout(function(){
					$(that.element).unbind('mediaerror', catchInitialError);
					if(hasInitialError || that.element.error){
						that.isAPIReady = true;
					} else {
						that._trigger('mmAPIReady');
					}
				}, 150);
			}
		},
		play: function(src){
			this.element.play();
		},
		pause: function(){
			this.element.pause();
		},
		muted: function(bool){
			if(typeof bool === 'boolean'){
				this.element.muted = bool;
			}
			return this.element.muted;
		},
		volume: function(vol){
			if(isFinite(vol)){
				this.element.volume = vol / 100;
			}
			return this.element.volume * 100;
		},
		currentTime: function(sec){
			if(isFinite(sec)){
				try {
					this.element.currentTime = sec;
				} catch(e){}
			}
			return this.element.currentTime;
		},
		_mmload: function(){
			if(this.element.load){
				this.element.load();
			} else {
				$(this.element).triggerHandler('error');
			}
		},
		_isPlaying: function(){
			return (!this.element.paused && this.element.readyState > 2 && !this.error && !this.ended);
		},
		getDuration: function(){
			return this.element.duration;
		},
		getCurrentSrc: function(){
			return this.element.currentSrc;
		}
	};
	
	
	
	$m.add('nativ', 'video', $.extend({
		_videoFullscreen: $.support.videoFullscreen,
		enterFullScreen: function(){
			if(!this._videoFullscreen){return false;}
			try {
				this.element[fsMethods.enter]();
			} catch(e){}
		},
		exitFullScreen: function(){
			if(!this._videoFullscreen){return false;}
			try {
				this.element[fsMethods.exit]();
			} catch(e){}
		}
	}, nativ));
	
	
	$m.add('nativ', 'audio', nativ);
	
	
	//public-methods
	$.fn.getMMAPI = function(full){
		if(!this[0]){return;}
		var api = $.data(this[0], 'mediaElemSupport');
		return ( full || !api || !api.name || !api.apis ) ? api : api.apis[api.name];
	};
	
	var noAPIMethods = {
			onAPIReady: 1,
			loadSrc: 1
		}
	;
	$m.registerAPI = function(names){
		if(typeof names === 'string'){
			names = [names];
		}
		$.each(names, function(i, name){
			var fn = $m.apis.video.nativ[name];
			if(fn && $.isFunction(fn) && name.indexOf('_') !== 0){
				$m.attrFns[name] = true;
				if($.fn[name]){return;}
				$.fn[name] =  function(){
					var args = arguments,
						ret
					;
					this.each(function(){
						var api = $(this).getMMAPI();
						if(api && ( (api.isAPIReady && !api.totalerror) || noAPIMethods[name] )){
							ret = api[name].apply(api, args);
						} else {
							api.unAPIReady(name+'queue');
							api.onAPIReady.call(api, function(){
								api[name].apply(api, args);
							}, name+'queue');
						}
					});
					return (ret === undefined) ? this : ret; 
				};
			}
		});
	};
	
	var fnNames = [];
	$.each($m.apis.video.nativ, function(name, fn){
		fnNames.push(name);
	});
	
	$m.registerAPI(fnNames);
	//plugin mechanism
	$m.fn._extend = function(exts){
		var names = [];
		$.each(exts, function(name, fn){
			$m.fn[name] = fn;
			names.push(name);
		});
		$m.registerAPI(names);
	};
})(jQuery);