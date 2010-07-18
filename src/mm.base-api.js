/**!
 * Part of the jMediaelement-Project | http://github.com/aFarkas/jMediaelement
 * @author Alexander Farkas
 * Copyright 2010, Alexander Farkas
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
(function($){
	var video 			= document.createElement('video'), 
		$m 				= $.multimediaSupport,
		noAPIEvents 	= {
			apiActivated: 1,
			apiDeActivated: 1,
			mediareset: 1,
			native_mediareset: 1,
			//these are api-events, but shouldn´t throw mmAPIReady
			totalerror: 1,
			jmeflashRefresh: 1
		},
		nuBubbleEvents 	= {
			native_mediareset: 1,
			apiDeActivated: 1,
			native_mediareset: 1,
			apiActivated: 1,
			timechange: 1,
			progresschange: 1,
			mmAPIReady: 1,
			jmeflashRefresh: 1,
			ended: 1
		},
		fsMethods		= {}
	;
	
	if('enterFullScreen' in video && video.supportsFullscreen){
		$.support.videoFullscreen = true;
		fsMethods.enter = 'enterFullScreen';
		fsMethods.exit = 'exitFullScreen';
	} else {
		$.each(['webkit', 'moz', 'o', 'ms'], function(i, name){
			if(name+'EnterFullScreen' in video && name+'SupportsFullscreen' in video){
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
	
	//ToDo add jmeReady/mmAPIReady
	$.event.special.loadedmeta = {
	    add: function( details ) {
			var api = $(this).getJMEAPI();
			if(api && api.loadedmeta){
				var evt = $.extend({}, api.loadedmeta);
				details.handler.call(this, evt, evt);
			}
	    }
	};
	
	//extend fn
	$.extend($m.fn, {
		_trigger: function(e){
			var evt  = (e.type) ? e : {type: e},
				type = evt.type
			;
			
			switch(type){
				case 'mmAPIReady':
					if(this.isAPIReady){
						return;	
					}
					this.isAPIReady = true;
					break;
				case 'loadedmeta':
					this.loadedmeta = evt;
					break;
				case 'totalerror':
					this.totalerror = true;
					break;
				case 'mute':
					this._muteState = e.isMuted;
					break;
				case 'volumelevelchange':
					this._volumelevelState = e.volumelevel;
					break;
				case 'mediareset':
					this.loadedmeta = false;
					this.totalerror = false;
					this._bufferLoaded = false;
					break;
			}
			
			if(!this.isAPIActive || (this.totalerror && !noAPIEvents[type])){return;}
			if(!this.isAPIReady && !noAPIEvents[type]){
				this._trigger('mmAPIReady');
			}
			
			if(e.type === 'progresschange'){
				//firefox buffer bug
				if(isFinite( this._bufferLoaded ) && isFinite( e.relLoaded ) && this._bufferLoaded >= e.relLoaded){return;}
				this._bufferLoaded = e.relLoaded;
				//should we support multiple buffer? if not remove relStart
//				e.relStart = e.relStart || 0;
//				if(this._concerningBufferStart !== e.relStart){
//					this._concerningBufferStart = e.relStart;
//					this._trigger({type: 'bufferrange', relStart: e.relStart, relLoaded: e.relLoaded});
//				}
			}
			
			e.target = this.element;
			e = $.Event(e);
			e.preventDefault();
			
			evt.mediaAPI = this.name;
			if(nuBubbleEvents[type]){
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
		isJMEReady: function(){
			return this.isAPIReady;
		},
		relCurrentTime: function(rel){
			var dur = this.getDuration() || Number.MIN_VALUE;
			if(rel && isFinite(rel)){
				this.currentTime(dur * rel / 100);
			}
			return this.currentTime() / dur * 100; 
		},
		getMediaAPI: function(){
			return this.name;
		},
		togglePlay: function(){
			this[(this.isPlaying()) ? 'pause' : 'play']();
		},
		toggleMuted: function(){
			this.muted(!(this.muted()));
		},
		getJMEVisual: function(){
			return this.visualElem;
		},
		jmeReady: function(fn, n){
			var e = {type: 'mmAPIReady'};
			if( this.isJMEReady() && (this.name !== 'nativ' || $.support.mediaElements) ){
				fn.call(this.element, e, e);
			} else {
				n = n || 'jmediaelement';
				var that = this,
					fn2	 = function(){
					$(that.element)
						.unbind('mmAPIReady.'+n, fn2)
						.unbind('jmeflashRefresh.'+n, fn2)
					;
					fn.call(that.element, e, e);
				};
				$(this.element)
					.bind('mmAPIReady.'+n, fn2)
					.bind('jmeflashRefresh.'+n, fn2)
				;
			}
		},
		unAPIReady: function(name){
			$(this.element).unbind('mmAPIReady.'+name);
		},
		_adjustPluginLoop: function(pluginLoop){
			var htmlLoop 	= $.attr(this.element, 'loop'),
				api 		= this
			;
			if(htmlLoop !== pluginLoop){
				setTimeout(function(){
					api[ (htmlLoop) ? 'play' : 'pause' ]();
				}, 0);
			}
		},
		_format: $m.formatTime,
		getFormattedDuration: function(){
			return this._format(this.getDuration());
		},
		getFormattedTime: function(){
			return this._format(this.currentTime());
		},
		loadSrc: function(srces, poster, mediaName){
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
			
			if( mediaName !== undefined ){
				var data = $.data(this.element, 'mediaElemSupport');
				if( data.controlWrapper && data.controlWrapper.mediaLabel ){
					data.controlWrapper.mediaLabel.text(mediaName);
				}
			}
			
			this._isResetting = true;
			
			var canPlaySrc = this.canPlaySrces(srces);
			this._trigger('mediareset');
			if(canPlaySrc){
				canPlaySrc = canPlaySrc.src || canPlaySrc;
				this._mmload(canPlaySrc, poster);
			} else {
				$m._setAPIActive(this.element, 'nativ');
				this._trigger('native_mediareset');
				$(this.element).data('mediaElemSupport').apis.nativ._mmload();
			}
			this._isResetting = false;
		},
		isPlaying: function(){
			return (this._isResetting) ? false : this._isPlaying();
		},
		_makenum: function(num){
			var ret = false;
			if(num == num * 1){
				ret = parseFloat(num, 10);
			}
			return ret;
		}
	});
	
	// firefox and old webkits (safari 4/chrome 4) are using an extended event, but safari uses load instead of progress
	// newer webkits are compilant to the current w3c specification (progress is a simple event + buffered is a timerange-object)
	// opera 10.5 hasn´t implemented the timerange-object yet <- no support
	var fixProgressEvent = function(api){
		var getConcerningRange 			= function(){
				var time 		= api.element.currentTime || 0,
					buffered 	= api.element.buffered,
					bufLen 		= buffered.length,
					ret 		= {}
				;
				
				for(var i = 0; i < bufLen; i++){
					ret.start = buffered.start(i);
					ret.end = buffered.end(i);
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
				
				//current implementation -> chrome 5/safari 5
				if(this.buffered && this.buffered.length){
					
					dur = this.duration;
					if(dur){
						bufRange = getConcerningRange();
						evt.relStart = bufRange.start / dur * 100;
						evt.relLoaded = bufRange.end / dur * 100;
					}
					api._trigger(evt);
				//ff + safari4 implementation
				} else if(e.originalEvent && 'lengthComputable' in e.originalEvent && e.originalEvent.loaded){
					if(e.originalEvent.lengthComputable && e.originalEvent.total){
						evt.relStart = 0;
						evt.relLoaded = e.originalEvent.loaded / e.originalEvent.total * 100;
					}
					api._trigger(evt);
				} 
				//opera fallback
				if( !evt.relLoaded && this.readyState === 4 ){
					evt.relStart = 0;
					evt.relLoaded = 100;
					api._trigger(evt);
				}
				return evt.relLoaded;
			},
			progressInterval = function(){
				if( calculateProgress.call(api.element, { type: 'ipadprogress' }) >= 100 || api.element.readyState === 1  ){
					clearInterval(timer);
				}
			},
			timer
		;
		$(api.element).bind('progress load', calculateProgress);
		
		//iPad has no progress event
		if ('buffered' in api.element) {
			$(api.element).bind('play waiting loadstart', function(){
				clearInterval(timer);
				if (api.isAPIActive) {
					timer = setInterval(progressInterval, 333);
					progressInterval();
				}
			});
		}
	};
	
	//add API for native MM-Support
	var nativ = {
		isTechAvailable: $.support.mediaElements,
		_init: function(){
			var that 				= this,
				curMuted 			= this.apiElem.muted,
				//mediaevents do not bubble normally, except in ff, we make them bubble, because we love this feature
				bubbleEvents 		= function(e, data){
					if(!that.isAPIActive || that.totalerror || e.bubbles){return;}
					var parent = this.parentNode || this.ownerDocument;
					if ( !e.isPropagationStopped() && parent ) {
						e.bubbles = true;
						data = $.makeArray( data );
						data.unshift( e );
						$.event.trigger( e, data, parent, true );
					}
				},
				//bug: firefox loadingerror
				loadingTimer 		= false,
				triggerLoadingErr 	= function(e){
					clearInterval(loadingTimer);
					if ( !that.element.error && that.element.mozLoadFrom && that.isAPIActive && !that.element.readyState && that.element.networkState === 2 && ( $.support.flash9 || $.support.vlc ) ) {
						if(e === true){
							//this will abort and start the error handling
							that.element.load();
						} else {
							loadingTimer = setTimeout(function(){
								triggerLoadingErr(true);
							}, ( e === 'initial' ) ? 20000 : 9000);
						}
					}
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
				.bind('play pause playing waiting', bubbleEvents)
				// firefox also loads video without calling load-method, if autoplay is true and media pack has changed
				.bind('play playing', function(){
					if( !that.isAPIActive && !that.element.paused && !that.element.ended ){
						try{
							that.element.pause();
						} catch(e){}
					}
				})
				.bind('mediareset', triggerLoadingErr)
			;
			triggerLoadingErr( 'initial' );
			
			if( !$.support.mediaLoop  ){
				$(this.element).bind('ended', function(){
					if( that.isAPIActive && $.attr(this, 'loop') ){
						var elem = this;
						setTimeout(function(){
							( $.attr(elem, 'loop') && elem.play() );
						}, 0);
					}
				});
			}
			//workaround for loadedmeta and particularly mmAPIReady event
			if( this.element.error ){return;}
			//jmeEmbed is called very late (after onload)
			if ( this.element.readyState > 0 ) {
				this._trigger({
					type: 'loadedmeta',
					duration: this.element.duration
				});
			// if element isn't busy || opera can freeze and mozilla doesn't react on method load
			// bug: iPad & iPhone initially report networkState === 2 although they are idling
			} else if ( this.element.networkState !== 2 || 'webkitPreservesPitch' in this.element ) {
				this._trigger('mmAPIReady');
			}
		},
		play: function(src){
			this.element.play();
		},
		pause: function(){
			this.element.pause();
		},
		muted: function(bool){
			if(typeof bool !== 'boolean'){
				return this.element.muted;
			}
			this.element.muted = bool;
		},
		volume: function(vol){
			if(!isFinite(vol)){
				return this.element.volume * 100;
			}
			this.element.volume = vol / 100;
		},
		currentTime: function(sec){
			if(!isFinite(sec)){
				return this.element.currentTime;
			}
			try {
				this.element.currentTime = sec;
			} catch(e){}
		},
		_mmload: function(){
			if(this.element.load){
				this.element.load();
			} else {
				$(this.element).triggerHandler('error');
			}
		},
		_isPlaying: function(){
			return (!this.element.paused && this.element.readyState > 2 && !this.element.error && !this.element.ended);
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
			} catch(e){
				return false;
			}
			return true;
		},
		exitFullScreen: function(){
			if(!this._videoFullscreen){return false;}
			try {
				this.element[fsMethods.exit]();
			} catch(e){
				return false;
			}
			return true;
		}
	}, nativ));
	
	
	$m.add('nativ', 'audio', nativ);
	
	
	//public-methods
	$.fn.getJMEAPI = function(full){
		if(!this[0]){return;}
		var api = $.data(this[0], 'mediaElemSupport');
		return ( full || !api || !api.name || !api.apis ) ? api : api.apis[api.name];
	};
	
	var noAPIMethods = {
			jmeReady: 1,
			getJMEVisual: 1,
			jmeReady: 1,
			isJMEReady: 1,
			getMediaAPI: 1
		}
	;
	$m.registerAPI = function(names){
		if(typeof names === 'string'){
			names = [names];
		}
		$.each(names, function(i, name){
			var fn = $m.apis.video.nativ[name];
			if(fn && !$.fn[name] && $.isFunction(fn) && name.indexOf('_') !== 0){
				$.fn[name] =  function(){
					var args = arguments,
						ret
					;
					this.each(function(){
						var api = $(this).getJMEAPI();
						if(!api){return;}
						if(  noAPIMethods[name] || (api.isJMEReady() && !api.totalerror && (api.name !== 'nativ' || $.support.mediaElements) ) ){
							ret = api[name].apply(api, args);
							return !(ret !== undefined);
						} else {
							api.unAPIReady(name+'queue');
							api.jmeReady.call(api, function(){
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
	
	// deprecated
	$.fn.onAPIReady = $.fn.jmeReady;
	$.fn.getMMAPI = $.fn.getJMEAPI;
	
	//plugin mechanism
	$m.fn._extend = function(exts, noAPI){
		var names = [];
		$.each(exts, function(name, fn){
			$m.fn[name] = fn;
			names.push(name);
			if(noAPI){
				noAPIMethods[name] = true;
			}
		});
		$m.registerAPI(names);
	};
	
})(jQuery);