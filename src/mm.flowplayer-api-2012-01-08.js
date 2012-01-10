/**!
 * Part of the jMediaelement-Project | http://github.com/aFarkas/jMediaelement
 * @author Alexander Farkas
 * @author Matt Dertinger
 * Copyright 2011, Alexander Farkas
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */

(function($){
  var doc = document,
    $m   = $.multimediaSupport,
    rep = /^flowPlayer-/
  ;
  
  function getAPI(id){
    if(!id){return;}
    id = id.replace(rep, '');
    return $.data(doc.getElementById(id), 'mediaElemSupport').apis.flowPlayer;
  }
  
  function getBuffered(len, total) {
    var x = parseInt(len / total, 10);
    return isNaN(x) ? 0 : x;
  }
  
  
  window.flowPlayerEvents = {
    View: {
      PLAY: function(obj){
        var $thisObj = $('object', obj.getParent())[0];
        // orig -> var api = obj.state && getAPI(obj.id);
        var api = obj.getState() && getAPI($thisObj.id);
        if(!api){return;}
        api._trigger('play');
        api._$isPlaystate = true;
      },
      PAUSE: function(obj){
        var $thisObj = $('object', obj.getParent())[0];
        var api = getAPI($thisObj.id);
        if(!api){return;}
        api._trigger('pause');
        api._$isPlaystate = false;
      }
    },
    Model: {
      BUFFER: function(obj){
        var clip = obj.getClip(),
            status = obj.getStatus(),
            $thisObj = $('object', obj.getParent())[0];
      
        var api = getAPI($thisObj.id);
        if(!api){return;}
      
        // number of seconds buffered / duration in seconds
        obj.percentage = getBuffered(status.bufferEnd, clip.duration);

        if( api._$timeProgress && obj.percentage + api._$startBuffer + 1 < api._$timeProgress ){
          //console.log('Model.BUFFER. api._$timeProgress: ' + api._$timeProgress);
          api._$startBuffer = api._$timeProgress;
        }
        var evt = {
          type: 'progresschange',
          relLoaded: obj.percentage + api._$startBuffer,
          relStart: 0
        };
        api._$buffered = evt.relLoaded;
        api._trigger(evt);
      } /*,
      STATE: function(obj){
        console.log('flowPlayerEvents.Model.STATE.');
        var $thisObj = $('object', obj.getParent())[0];
        var state = privFlowPlayerEvents.STATE(obj);
        if(state === 'playing'){
          var api = getAPI($thisObj.id);
          if(!api){return;}
          api._trigger('playing');
          api._$isPlaystate = true;
        }
      }*/,
      META: function(obj, clip){
        var clip = (clip) ? clip : obj.getClip(),
            $thisObj = $('object', obj.getParent())[0];
        console.log('flowPlayerEvents.Model.META. obj.type: ' + obj.type);
        /* orig -> if(obj.type === 'metadata'){
          var api = getAPI(obj.id);
          if(!api){return;}
          api._trigger({
            type: 'loadedmeta',
            duration: obj.duration
          });
        } */
        if (clip.metaData) {
          var api = getAPI($thisObj.id);
          if(!api){return;}
          api._trigger({
            type: 'loadedmeta',
            duration: clip.duration
          });
        }
      },
      TIME: function(obj, clip){
        var clip = (clip) ? clip : obj.getClip(),
            status = obj.getStatus(),
            $thisObj = $('object', obj.getParent())[0];
        
        var position = Math.round(status.time*10)/10;
        //console.log('flowPlayerEvents.Model.TIME.');
        //console.log('flowPlayerEvents.Model.TIME. $thisObj.id: ' + $thisObj.id);
        //console.log('flowPlayerEvents.Model.TIME. status.time: ' + position);
        var api = getAPI($thisObj.id),
            e = {
              type: 'timechange',
              time: position
            }
        ;
        
        if(!api){return;}
        
        //workaround: meta isn´t triggered on audio | ToDo: Is this needed with flowplayer 3.2.x?
        if(!api.loadedmeta){
          api._trigger({
            type: 'loadedmeta',
            duration: clip.duration
          });
        }
        
        api._$currentPos = position;
        if(clip.duration){
          e.duration = clip.duration;
          e.timeProgress = position / clip.duration * 100;
          api._$timeProgress = e.timeProgress;
        }
        api._trigger(e);
      },
      STATE: function(obj){
        console.log('privFlowPlayerEvents.STATE');
        var $thisObj = $('object', obj.getParent())[0];
        obj.newstate = simplePlayerStates[obj.getState()];
        console.log('privFlowPlayerEvents.STATE. obj.newstate: ' + simplePlayerStates[obj.getState()]);
        if(obj.newstate === 'IDLE'){
          return false;
        }
        var api = getAPI($thisObj.id),
            type
        ;
        if(!api){return false;}
        switch(obj.newstate) {
          case 'PLAYING':
            type = 'playing';
            break;
          case 'PAUSED':
            api._$isPlaystate = false;
            type = 'pause';
            break;
          case 'COMPLETED':
            api._$isPlaystate = false;
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
      },
      COMPLETE: function(obj){
        var $thisObj = $('object', obj.getParent())[0];
        
        var api = getAPI($thisObj.id),
            type = "ended"
        ;
        if(!api){return false;}
        
        if(type){
          api._$isPlaystate = false;
          api._trigger(type);
        }
        return type;
      }
    },
    Controller: {
      VOLUME: function(obj, level){
        var $thisObj = $('object', obj.getParent())[0];
        var api = getAPI($thisObj.id);
        if(!api){return;}
        if(!api || api._$lastMuteState !== api.muted() ){return;}
        // orig -> api._trigger({type: 'volumelevelchange', volumelevel: obj.percentage});
        api._trigger({type: 'volumelevelchange', volumelevel: level});
      },
      MUTE: function(obj){
        var status = obj.getStatus(),
            $thisObj = $('object', obj.getParent())[0];
        var api = getAPI($thisObj.id);
        if(!api){return;}
        // orig -> api._$lastMuteState = obj.state;
        api._$lastMuteState = status.muted;
        // orig -> api._trigger({type: 'mute', isMuted: obj.state});
        api._trigger({type: 'mute', isMuted: status.muted});
      }
    }
  }
    
  window.flowPlayerReady = function (obj) {
    var $thisObj = $('object', obj.getParent())[0];
    var api = getAPI($thisObj.id);
    if(!api){return;}
    var cfg = $.attr(api.element, 'getConfig');
    
    console.log('flowPlayerReady');
    //https://bugzilla.mozilla.org/show_bug.cgi?id=90268 every html5video shim has this problem fix it!!!
    if(api.isAPIReady){
      console.info('api.isAPIReady');
      // orig -> if(!api.apiElem.sendEvent){
      if(!$f(api.visualElem[0]).onMute){
        console.log('flowPlayerReady. call api._$reInit()');
        api._$reInit();
        return;
      } else {
        setTimeout(function(){
          console.log('flowPlayerReady. setTimeout. api._lastLoad: ' + api._lastLoad);
          if( api._lastLoad ){
            api._mmload(api._lastLoad.file, api._lastLoad.image);
          }
          // orig -> if(api._$isPlaystate && !(api.apiElem.getConfig() || {}).autostart){
          if(api._$isPlaystate && !cfg.autoplay){
            console.log('flowPlayerReady. setTimeout. api._$isPlaystate: ' + api._$isPlaystate);
            api.play();
          }
        }, 8);
      }
      setTimeout(function(){
        console.log('flowPlayerReady. setTimeout. jmeflashRefresh ');
        api._trigger('jmeflashRefresh');
      }, 8);
    // orig -> } else if(!api.apiElem.sendEvent){
    } else if(!$f(api.visualElem[0])) {
      console.log('flowPlayerReady. else if !$f(api.visualElem[0]) ');
      api._$reInit();
      return;
    } else {
      console.log('flowPlayerReady. else  ');
    }
    
    //preload workaround
    setTimeout(function(){
      api._$lastMuteState = api.muted();
      var cfg = $.attr(api.element, 'getConfig');
      api._trigger('mmAPIReady');
      // orig -> if(!cfg.autoplay && !api._$isPlaystate && ($f(api.apiElem).getConfig() || {}).state === 'IDLE'){
      if(!cfg.autoplay && !api._$isPlaystate && simplePlayerStates[($f(api.visualElem[0]) || {}).getState()] === 'IDLE'){
        if( api.nodeName === 'audio' && cfg.preload === 'auto' ){
          // orig -> api.apiElem.sendEvent('PLAY', 'true');
          $f(api.visualElem[0]).play();
          // orig -> api.apiElem.sendEvent('PLAY', 'false');
          $f(api.visualElem[0]).stop();
        } else if( api.nodeName === 'video' && cfg.preload !== 'none' && !cfg.poster ){
          // orig -> api.apiElem.sendEvent('PLAY', 'true');
          $f(api.visualElem[0]).play();
          // orig -> api.apiElem.sendEvent('PLAY', 'false');
          $f(api.visualElem[0]).stop();
          api.currentTime(0);
        }
      }
    }, 9);
    

  };
  
  var flowPlayerAPI = {
    _init: function(){
      this._$resetStates();
    },
    _$resetStates: function(){
      this._$buffered = 0;
      this._$startBuffer = 0;
      this._$timeProgress = 0;
      this._$currentPos = 0;
    },
    _$reInitCount: 0,
    _$reInitTimer: false,
    _$reInit: function(){
      var that = this;
      if(this._$reInitCount < 5){
        this.visualElem[0].style.overflow = 'visible';
        setTimeout(function(){
          that.visualElem[0].style.overflow = 'hidden';
        }, 0);
      }
      this._$reInitCount++;
      this._$resetStates();
      if(!this._$reInitTimer){
        this._$reInitTimer = true;
        setTimeout(function(){
          that._$reInitCount = 0;
          that._$reInitTimer = false;
        }, 20000);
      }
    }, 
    play: function(){
      // orig -> this.apiElem.sendEvent('PLAY', 'true');
      if ($f(this.visualElem[0]).isLoaded()) {
        $f(this.visualElem[0]).toggle();
      } else {
        $f(this.visualElem[0]).play();
      }
      this._$isPlaystate = true;
      this._trigger('play');
    },
    pause: function(){
      // orig -> this.apiElem.sendEvent('PLAY', 'false');
      $f(this.visualElem[0]).pause();
    },
    _isPlaying: function(){
      // orig -> var cfg = this.apiElem.getConfig();
      var state = simplePlayerStates[$f(this.visualElem[0]).getState()];
      // orig -> return (cfg) ? (cfg.state === 'PLAYING' ) : undefined;
      return (state) ? ( state === 'PLAYING' ) : undefined;
    },
    _mmload: function(src, poster, flowPlayerExtras){
      var playing = this._isPlaying(),
          $fPlayer = $f(this.visualElem[0]);
      this._lastLoad = {file: src};
      if(poster){
        this._lastLoad.image = poster;
      }
      this._$resetStates();
      this._extendFlowPlayerLoad(src, this._lastLoad);
      if(typeof flowPlayerExtras == 'object'){
        $.extend(this._lastLoad, flowPlayerExtras);
      }
      // orig -> if(!this.apiElem.sendEvent){return;}
      if (!$fPlayer.isLoaded) { return; }
      // orig -> this.apiElem.sendEvent('LOAD', this._lastLoad);
      // TODO: May need to add flowplayer event here to replace orig method call above.
      if( this.isAPIActive && ($.attr(this.element, 'autoplay') || playing) ){
        // orig -> this.apiElem.sendEvent('PLAY', 'true');
        $fPlayer.play();
      } else {
        // orig -> this.apiElem.sendEvent('PLAY', 'false');
        console.log('_mmload. before $fPlayer.toggle()');
        $fPlayer.toggle();
      }
    },
    muted: function(state){
      var $fPlayer = $f(this.visualElem[0]),
          status = $fPlayer.getStatus();
      if(typeof state !== 'boolean'){
        // orig -> var cfg = this.apiElem.getConfig();
        var cfg = $.attr(this.element, 'getConfig');
        cfg.mute = status.muted;
        // orig -> return (cfg || {}).mute;
        return (cfg || {}).mute;
      }
      // orig -> this.apiElem.sendEvent('mute', (state) ? 'true' : false);
      if (state) {
        $fPlayer.mute();
      } else {
        $fPlayer.unmute();
      }
    },
    currentTime: function(t){
      if(!isFinite(t)){
        return this._$currentPos || 0;
      }
      this._$currentPos = t;
      var playing = this._isPlaying();
      //orig -> this.apiElem.sendEvent('SEEK', t);
      $f(this.visualElem[0]).seek(t);
      if(!playing){
        this.pause();
      }
      this._trigger({type: 'timechange', time: t});
    },
    getDuration: function(){
      // orig -> var t = this.apiElem.getPlaylist()[0].duration || 0;
      var t = $f(this.visualElem[0]).getPlaylist()[0].duration || 0;
      return t < 0 ? 0 : t;
    },
    volume: function(v){
      var $fPlayer = $f(this.visualElem[0]);
      if(!isFinite(v)){
        // orig -> return parseInt(this.apiElem.getConfig().volume, 10);
        return parseInt($fPlayer.getStatus().volume, 10);
      }
      var wasMuted = this.muted();
      // orig -> this.apiElem.sendEvent('VOLUME', ''+v);
      $fPlayer.setVolume(v);
      if(wasMuted){
        // orig -> this.apiElem.sendEvent('mute', 'true');
        $fPlayer.unmute();
      }
    },
    getCurrentSrc: function(){
      var $fPlayer = $f(this.visualElem[0]);
      // orig -> return (this.apiElem.getConfig() || {}).file || '';
      return ($fPlayer.getClip() || {}).url || '';
    }
  };
  
  // ff flash refreshbug https://bugzilla.mozilla.org/show_bug.cgi?id=90268 
  // opera also has some problems here
  $.extend(flowPlayerAPI, {
    isJMEReady: function(){
      var ret = false,
          $fPlayer = $f(this.visualElem[0]);
			console.log('flowPlayerAPI. isJMEReady');
      // orig -> if(this.isAPIReady && this.apiElem.sendEvent && this.apiElem.getConfig){
      if(this.isAPIReady && $fPlayer.isLoaded && $fPlayer.getConfig){
        // seems stupid, but helps :-)
        // orig -> ( $.browser.mozilla && this.apiElem.getConfig() );

        ( $.browser.mozilla && $fPlayer.getConfig() );
				console.log('flowPlayerAPI. $.browser.mozilla && $fPlayer.getConfig()');
        ret = true;          
      }
      return ret;
    }
  });
  
  
  $m.add('flowPlayer', 'video', $.extend({}, flowPlayerAPI, {
    enterFullScreen: function(){
      console.log('enterFullScreen');
			if(!this._isPlaying()){
				var that = this;
				
				/* $(that.element).one('playing.enterFullscreen', function(){
					that.apiElem.video.fullscreen = true;
				}); */
				$f(this.visualElem[0]).play();
			} else {
				//this.apiElem.video.fullscreen = true;
			}
			return true;
		},
    exitFullScreen: function(){
      console.log('exitFullScreen');
      if($f(this.visualElem[0]).jmeExitFullScreen){
        try {
          $f(this.visualElem[0]).jmeExitFullScreen();
          return true;
        } catch(e){}
      }
      return false;
    }
  }));
  
  $m.add('flowPlayer', 'audio', flowPlayerAPI);
  
})(jQuery);