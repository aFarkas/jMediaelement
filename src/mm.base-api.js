/**!
 * Part of the jMediaelement-Project | http://github.com/aFarkas/jMediaelement
 * @author Alexander Farkas
 * Copyright 2010, Alexander Farkas
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
(function($){
	
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
		},
		isAPIReady: false,
		relCurrentTime: function(rel){
			var dur = this.getDuration();
			if(arguments.length){
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
		loadSrc: function(srces, poster, extras){
			srces = srces || $.attr(this.html5elem, 'srces');
			srces = $.isArray(srces) ? srces : [srces];
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
				this._load(canPlaySrc, poster, extras);
			} else {
				$(this.html5elem).data('mediaElemSupport').apis.nativ.loadSrc(srces, poster, extras);
			}
		}
	});
	
	
	
	//add API for native MM-Support
	var nativ = {
		_init: function(){
			var that 		= this,
				curMuted 	= this.apiElem.muted,
				progressData
			;
			//addEvents
			
			$(this.html5elem)
				//add volumelevelchange + mute event
				.bind('volumechange', function(){
					if(curMuted !== that.apiElem.muted){
						curMuted = that.apiElem.muted;
						that._trigger.call(that, {type: 'mute', isMuted: curMuted});
					} else {
						that._trigger.call(that, {type: 'volumelevelchange', volumelevel: that.apiElem.volume * 100});
					}
				})
				//add 
				.bind('progress', function(e){
					if(e.originalEvent){
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
				.bind('timeupdate', function(){
					var e = {
						type: 'timechange',
						time: this.currentTime
					};
					if(this.duration){
						e.duration = this.duration;
						e.timeProgress = e.time / e.duration * 100;
					}
					that._trigger(e);
				})
				.bind('loadedmetadata', function(e){
					that._trigger('mmAPIReady');
					that._trigger({
						type: 'loadedmeta',
						height: this.videoHeight,
						width: this.videoWidth,
						duration: this.duration
					});
					
				})
			;
		},
		play: function(src){
			if(arguments.length){
				this.loadSrc(src);
			}
			this.html5elem.play();
		},
		pause: function(){
			this.html5elem.pause();
		},
		muted: function(bool){
			if(arguments.length){
				this.html5elem.muted = bool;
			}
			return this.html5elem.muted;
		},
		volume: function(vol){
			if(arguments.length){
				this.html5elem.volume = vol / 100;
			}
			return this.html5elem.volume * 100;
		},
		currentTime: function(sec){
			if(arguments.length){
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
		
		loadSrc: function(srces, poster, extras){
			var jElm = $(this.html5elem);
			$.attr(this.html5elem, 'srces', srces);
			if(this.html5elem.load){
				this.html5elem.load();
			} else {
				jElm.trigger('error');
			}
			
		},
		isPlaying: function(){
			return (!this.html5elem.paused && this.html5elem.readyState > 2 && !this.error && !this.ended);
		},
		getDuration: function(){
			return this.html5elem.duration;
		}
	};
	
	nativ._load = nativ.loadSrc;
	
	$.multimediaSupport.add('nativ', 'video', nativ, true);
	$.multimediaSupport.add('nativ', 'audio', nativ, true);
	
	
	//public-methods
	$.fn.getMMAPI = function(full){
		if(!this[0]){return;}
		var api = ($.data(this[0], 'mediaElemSupport') || {});
		return ( full || !api.name || !api.apis ) ? api : api.apis[api.name];
	};
	
	var attrFns = ['muted', 'currentTime', 'isPlaying', 'getDuration', 'volume', 'relCurrentTime'];
	
	$.each($.multimediaSupport.apis.video.nativ, function(name, fn){
		if ( name.indexOf('_') !== 0 && fn && $.isFunction(fn) ) {
			$.multimediaSupport.attrFns[name] = true;
		}
	});
	
	$.each($.multimediaSupport.apis.video.nativ, function(name, fn){
		if( name.indexOf('_') !== 0 && $.inArray(name, attrFns) === -1 && fn && $.isFunction(fn) && !$.fn[name] ){
			$.fn[name] =  function(){
				var args = arguments;
				this.each(function(){
					var api = $(this).getMMAPI();
					if(api){
						api[name].apply(api, args);
					}
				});
			};
		}
	});
})(jQuery);
