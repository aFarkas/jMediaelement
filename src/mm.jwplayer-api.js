/**!
 * Part of the jMediaelement-Project | http://github.com/aFarkas/jMediaelement
 * @author Alexander Farkas
 * Copyright 2010, Alexander Farkas
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */

(function($){
	var doc = document,
		rep = /^jwPlayer-/
	;
	
	function getAPI(id){
		id = id.replace(rep, '');
		return $.data(doc.getElementById(id), 'mediaElemSupport').apis.jwPlayer;
	}
	var privJwEvents = {
		Model: {
			META: function(obj){
				if(obj.type === 'metadata'){
					var api = getAPI(obj.id);
					if(!api){return;}
					
					api._trigger({
						type: 'loadedmeta',
						duration: obj.duration
					});
				}
				
			},
			TIME: function(obj){
				var api = getAPI(obj.id),
					e 	= {
							type: 'timechange',
							time: obj.position
						}
				;
				if(!api){return;}
				
				//workaround: meta isn´t triggered on audio
				if(!api.loadedmeta){
					api._trigger({
						type: 'loadedmeta',
						duration: obj.duration
					});
				}
				
				
				api.currentPos = obj.position;
				if(obj.duration){
					e.duration = obj.duration;
					e.timeProgress = obj.position / obj.duration * 100;
				}
				if(obj.position && api.data.playFirstFrame && !api.data.playThrough){
					api.pause();
					api.data.playThrough = true;
				}
				api._trigger(e);
			},
			STATE: function(obj){
				if(obj.newstate === 'IDLE'){
					return false;
				}
				var api = getAPI(obj.id),
					type
				;
				if(!api){return false;}
				
				switch(obj.newstate) {
					case 'PLAYING':
						type = 'playing';
						break;
					case 'PAUSED':
						type = 'pause';
						break;
					case 'COMPLETED':
						type = 'ended';
						break;
					case 'BUFFERING':
						type = 'waiting';
					break;
				}
				
				if(type){
					api._trigger(type);
				}
				return type;
			}
		},
		Controller: {
			VOLUME: function(obj){
				var api = getAPI(obj.id);
				if(!api){return;}
				api._trigger({type: 'volumelevelchange', volumelevel: obj.percentage});
			},
			MUTE: function(obj){
				var api = getAPI(obj.id);
				if(!api){return;}
				api._trigger({type: 'mute', isMuted: obj.state});
			}
		}
	};
	window.jwEvents = {
		four: $.extend(true, {}, privJwEvents, {
			View: {
				//doesnï¿½t work in 5.x
				PLAY: function(obj){
					var api = obj.state && getAPI(obj.id);
					if(!api){return;}
					api._trigger('play');
				}
			},
			Model: {
				LOADED: function(obj){
					var api = getAPI(obj.id);
					if(!api){return;}
					var evt = {
						type: 'progresschange',
						lengthComputable: !!(obj.total),
						loaded: obj.loaded
					};
					if(obj.total){
						$.extend(evt, {
							total: obj.total,
							relLoaded: obj.total / obj.loaded * 100
						});
					}
					api._trigger(evt);
				}
			}
			
		}),
		// version five is a little bit buggy, the following methods are al workarounds
		five: $.extend(true, {}, privJwEvents, {
			Model: {
				BUFFER: function(obj){
					var api = getAPI(obj.id);
					if(!api){return;}
					var evt = {
						type: 'progresschange',
						lengthComputable: !!(isFinite(obj.percentage)),
						relLoaded: obj.percentage
					};
					api._trigger(evt);
				},
				LOADED: function(obj){
					var api = getAPI(obj.id);
					if (!api) {return;}
					var evt = {
						type: 'progresschange',
						lengthComputable: true,
						relLoaded: 100
					};
					api._trigger(evt);
				},
				STATE: function(obj){
					var state = privJwEvents.Model.STATE(obj);
					if(state === 'playing'){
						api._trigger('play');
					}
				}
			}
		})
	};
	
	window.playerReady = function (obj) {
		
		var api = getAPI(obj.id);
		if(api){
			var apiVersion = (parseInt(obj.version, 10) > 4)? 'five' : 'four';
			//add events
			$.each(jwEvents[apiVersion], function(mvcName, evts){
				$.each(evts, function(evtName){
					api.apiElem['add'+ mvcName +'Listener'](evtName, 'jwEvents.'+ apiVersion +'.'+ mvcName +'.'+ evtName);
				});
				
			});
			
			api._trigger('mmAPIReady');
		}		
	};
	
	var jwAPI = {
		play: function(){
			this.data.playThrough = true;
			this.apiElem.sendEvent('PLAY', 'true');
		},
		pause: function(){
			this.apiElem.sendEvent('PLAY', 'false');
		},
		_setInactive: function(){
			this.apiElem.parentNode.style.display = 'none';
		},
		_setActive: function(){
			this.apiElem.parentNode.style.display = 'block';
		},
		isPlaying: function(){
			var cfg = this.apiElem.getConfig();
			return (cfg) ? (cfg.state === 'PLAYING' ) : undefined;
		},
		_mmload: function(src, poster, extras){
			this.apiElem.sendEvent('LOAD', src);
			if (!$.attr(this.html5elem, 'autoplay')) {
				this.apiElem.sendEvent('PLAY', 'false');
			}
		},
		muted: function(state){
			if(typeof state !== 'boolean'){
				var cfg = this.apiElem.getConfig();
				return (cfg || {}).mute;
			} 
			this.apiElem.sendEvent('mute', (state) ? 'true' : false);
		},
		currentTime: function(t){
			if(!isFinite(t)){
				return this.currentPos || 0;
			}
			var isPlaying = (this.apiElem.getConfig().state === 'PLAYING');
			if(!isPlaying){
				this.apiElem.sendEvent('PLAY', 'true');
			}
			
			this.apiElem.sendEvent('SEEK', ''+t);
			if(!isPlaying){
				this.apiElem.sendEvent('PLAY', 'false');
			}
		},
		getDuration: function(){
			var t = this.apiElem.getPlaylist()[0].duration || 0;
			return t < 0 ? 0 : t;
		},
		volume: function(v){
			if(!isFinite(v)){
				return parseInt(this.apiElem.getConfig().volume, 10);
			}
			this.apiElem.sendEvent('VOLUME', ''+v);
		}
	};
	
	$.multimediaSupport.add('jwPlayer', 'video', jwAPI);
	$.multimediaSupport.add('jwPlayer', 'audio', jwAPI);
})(jQuery);
