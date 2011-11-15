/**
 * flowplayer.controls 3.0.2. Flowplayer JavaScript plugin.
 * 
 * This file is part of Flowplayer, http://flowplayer.org
 *
 * Author: Tero Piirainen, <info@flowplayer.org>
 * Copyright (c) 2008 Flowplayer Ltd
 *
 * Dual licensed under MIT and GPL 2+ licenses
 * SEE: http://www.opensource.org/licenses
 * 
 * Date: 2008-11-25 11:29:03 -0500 (Tue, 25 Nov 2008)
 * Revision: 1424 
 */ 
$f.addPlugin("controls", function(wrap, options) {
  
    
//{{{ private functions
  /* TODO: Can probably be removed */
  function fixE(e) {
    if (typeof e == 'undefined') { e = window.event; }
    if (typeof e.layerX == 'undefined') { e.layerX = e.offsetX; }
    if (typeof e.layerY == 'undefined') { e.layerY = e.offsetY; }
    return e;
  }
  /* TODO: Can probably be removed */
  function w(e) {
    return e.clientWidth;  
  }
  /* TODO: Can probably be removed */
  function offset(e) {
    return e.offsetLeft;  
  }

  function extend(to, from) {
    if (from) {
      for (key in from) {
        if (key) {
          to[key] = from[key];    
        } 
      }
    }
  }
  
  function byClass(name) {
    var els = wrap.getElementsByTagName("*");    
    var re = new RegExp("(^|\\s)" + name + "(\\s|$)");
    for (var i = 0; i < els.length; i++) {
      if (re.test(els[i].className)) {
        return els[i];
      }
    }
  }
  
  // prefix integer with zero when nessessary 
  /* TODO: Can probably be removed */
  function pad(val) {
    val = parseInt(val, 10);
    return val >= 10 ? val : "0" + val;
  }
  
  // display seconds in hh:mm:ss format
  /* TODO: Can probably be removed */
  function toTime(sec) {
    
    var h = Math.floor(sec / 3600);
    var min = Math.floor(sec / 60);
    sec = sec - (min * 60);
    
    if (h >= 1) {
      min -= h * 60;
      return pad(h) + ":" + pad(min) + ":" + pad(sec);
    }
    
    return pad(min) + ":" + pad(sec);
  }
  
  /* TODO: Can probably be removed */
  function getTime(time, duration) {
    return "<span>" + toTime(time) + "</span> <strong>" + toTime(duration) + "</strong>";  
  }
  
//}}}
  
  
  var self = this;
  
  var opts = {
    playHeadClass: 'playhead',
    trackClass: 'track',
    playClass: 'play',
    pauseClass: 'pause',
    bufferClass: 'buffer',
    progressClass: 'progress',
    
    timeClass: 'time',
    muteClass: 'mute',
    unmuteClass: 'unmute',
    duration: 0,    
    
    template: '<a class="play">play</a>' + 
           '<div class="track">' +
             '<div class="buffer"></div>' +
             '<div class="progress"></div>' +
             '<div class="playhead"></div>' +
           '</div>' + 
           '<div class="time"></div>' +
           '<a class="mute">mute</a>'         
  };
  
  extend(opts, options);
  
  if (typeof wrap == 'string') {
    wrap = document.getElementById(wrap);
  }
  
  if (!wrap) { return;  }
  
  // inner HTML
  if (!wrap.innerHTML.replace(/\s/g, '')) {
    wrap.innerHTML = opts.template;    
  }   
  
  // get elements
  /* TODO: Remove no longer used vars */
  var ball = byClass(opts.playHeadClass);
  var bufferBar = byClass(opts.bufferClass);
  var progressBar = byClass(opts.progressClass);
  var track = byClass(opts.trackClass);
  var time = byClass(opts.timeClass);
  var mute = byClass(opts.muteClass);
  
  var isSeeking = false;

  // setup timer
  var timer = null;
  
  function getMax(len, total) {
    var x = parseInt(Math.min(len / total * trackWidth, trackWidth - ballWidth / 2), 10);
    return isNaN(x) ? 0 : x;   
  }
  
  self.onStart(function(clip) {
    
    var duration = clip.duration || 0;
    
    // clear previous timer
    clearInterval(timer);
     
    // begin timer    
    timer = setInterval(function()  {
      
      var status = self.getStatus();
      
      if (status.time === undefined) {
        clearInterval(timer);
        return;
      }
      
      // buffer width
      // TODO: Buffer Bar is currently not used by JME, but should we?
      //var x = getMax(status.bufferEnd, duration);
      //bufferBar.style.width = x + "px";
      //head.setMax(x);
      
      // progress width
      if (!self.isPaused() && !isSeeking) {
        flowPlayerEvents.Model.TIME(self, clip);
      }
      
    }, 200);
  });
  
  // TODO: Probably don't need this.
  self.onBegin(function() {
    //$(play).removeClass(opts.playClass).addClass(opts.pauseClass);
  });

  self.onLoad(function() {
    console.log('player loaded');
    flowPlayerReady(self);
  });

  self.onUnload(function() {
    console.log('player unloaded');
  });
  
  self.onFullscreenExit(function() {
    console.log('player onFullscreenExit');
  });
  
  // TODO: Probably don't need this.
  self.onBufferEmpty(function(e) {
    //flowPlayerEvents.Model.BUFFER(self);
  });
  
  // pause / resume states
  self.onPause(function() {
    //$(play).removeClass(opts.pauseClass).addClass(opts.playClass);
    flowPlayerEvents.View.PAUSE(self);
  });

  self.onResume(function() {
    //$(play).removeClass(opts.playClass).addClass(opts.pauseClass);
    flowPlayerEvents.View.PLAY(self);
  });
  
  self.onBeforeSeek(function(clip) {
    isSeeking = true;
  });
  
  self.onSeek(function(clip) {
    isSeeking = false;
  });
  
  // mute / unmute states  
  self.onMute(function() {
    //$(mute).removeClass(opts.muteClass).addClass(opts.unmuteClass);
    flowPlayerEvents.Controller.MUTE(self);
  });

  self.onUnmute(function() {
    //$(mute).removeClass(opts.unmuteClass).addClass(opts.muteClass);
    flowPlayerEvents.Controller.MUTE(self);
  });
  
  self.onVolume(function(level) {
    flowPlayerEvents.Controller.VOLUME(self, level);
  });
  
  self.onFinish(function(clip) {
    clearInterval(timer);
    flowPlayerEvents.Model.COMPLETE(self, clip);
  });
  
  // return player instance to enable plugin chaining
  return self;
  
});




/**!
 * Part of the jMediaelement-Project | http://github.com/aFarkas/jMediaelement
 * Adds support for Flowplayer to JME.
 * @author Alexander Farkas
 * @author Matt Dertinger
 * Copyright 2011, Alexander Farkas
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */

(function($){
  
  var swfAttr = {type: 'application/x-shockwave-flash'},
    aXAttrs = {classid: 'clsid:D27CDB6E-AE6D-11cf-96B8-444553540000'},
    m     = $.multimediaSupport,
    // @see http://flowplayer.org/documentation/api/player.html#methods
    playerStates = ['loaded','unstarted','buffering','playing','paused','ended']; // -1 = unloaded,
    simplePlayerStates = ['IDLE','IDLE','BUFFERING','PLAYING','PAUSED','COMPLETED']; // -1 = unloaded
  ;
  
  $.extend($.fn.jmeEmbed.defaults, 
      {
	  	flashPlayer: 'flowPlayer',
        flowPlayer: {
          path: m.jsPath + 'flowplayer-3.2.7.swf',
          hideIcons: 'auto',
          vars: {},
          attrs: {},
          plugins: {},
          params: {
            allowscriptaccess: 'always',
            allowfullscreen: 'true'
          }
        }
      }
    )
  ;
  
  $(function(){
    var path = ($('script.flowPlayer')[0] || {}).src;
    if(path){
      $.fn.jmeEmbed.defaults.flowPlayer.path = path;
    }
  });
    
  var regs = {
      A: /&amp;/g,
      a: /&/g,
      e: /\=/g,
      q: /\?/g
    },
    providerMatch = {
      audio: 'sound',
      video: 'video'
    },
    replaceVar = function(val){
      return (val.replace) ? val.replace(regs.A, '%26').replace(regs.a, '%26').replace(regs.e, '%3D').replace(regs.q, '%3F') : val;
    },
    printObj = function(obj) {
      var arr = [];
      $.each(obj, function(key, val) {
        var next = '"' + key + '": ';
        next += $.isPlainObject(val) ? printObj(val) : (jQuery.type(val) === "null" || jQuery.type(val) === "boolean") ? val : '"' + val + '"';
        arr.push( next );
      });
      return "{ " +  arr.join(", ") + " }";
    }
  ;
  
  
	(function(){
		$.support.flash9 = false;
		$.support.flashVersion = 0;
		var swf 				= m.getPluginVersion('Shockwave Flash'),
			supportsMovieStar 	= function(obj, _retest){
				$.support.flash9 = false;
					try {
						//opera needs typeof check do not use 'GetVariable' in obj
						if (obj && typeof obj.GetVariable !== 'undefined') {
							var version = obj.GetVariable("$version");
							obj = m.getPluginVersion('', {
								description: version
							});
							$.support.flashVersion = obj[0];
							$.support.flash9 = !!(obj[0] > 9 || (obj[0] === 9 && obj[1] >= 115));
						}
					} catch (e) {}
				
			}
		;
		if(swf && swf[0]){
			$.support.flashVersion = swf[0];
		}
		if(swf[0] > 9 || (swf[0] === 9 && swf[1] >= 115)){
			//temp result
			
			$.support.flash9 = true;
			$(function(){
				swf = $('<object />', swfAttr).appendTo('body');
				supportsMovieStar(swf[0]);
				swf.remove();
			});
		} else if(window.ActiveXObject){
			try {
				swf = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
				supportsMovieStar(swf);
				swf = null;
			} catch(e){}
		}
	})();
  
  var flowPlayerMM = {
      isTechAvailable: function(){
        return $.support.flash9;
      },
      _extendFlowPlayerLoad: function(src, obj, elem){
        if(!src){return;}
        elem = elem || this.element;
        m.extendWithData(elem, obj, ['type', 'provider', 'stretching', 'bufferlength']);
        
        // if we can't autodetect provider by file-extension,
        // we add a provider
        var ext = m.getExt(src),
          name = (ext == 'm4r') ? 'video' : this.nodeName
        ;
        if(ext == 'm4r' || !this.canPlaySrc(src)){
          if(!obj.provider){
            obj.provider = providerMatch[name];
          }
          if(!obj.type){
            obj.type = providerMatch[name];
          }
        }
        return obj;
      },
      _embed: function(src, id, cfg, fn){
        var opts     = this.embedOpts.flowPlayer,
          vars     = $.extend({}, opts.vars, {file: src, id: id}),
          attrs     = $.extend({name: id}, opts.attrs, swfAttr, !(window.ActiveXObject) ? {data: opts.path} : {}),
          params     = $.extend({movie: opts.path}, opts.params),
          plugins   = [],
          that     = this
        ;
        
        this._extendFlowPlayerLoad(src, vars);
        
        // FIXME: Determine if we need the following vars properties if we're using flashembed / flowplayer 
        // instead of JME's embedObject / JW Player.
        /* vars.repeat = (cfg.loop) ? 'single' : 'false';
        vars.autostart = ''+ cfg.autoplay;
        if(cfg.poster){
          vars.image = cfg.poster;
        }
        vars.controlbar = (cfg.controls) ? 'bottom' : 'none'; */
        
        params.loop = (cfg.loop) ? true : false;
        
        if( !cfg.controls && this.nodeName !== 'audio' && params.wmode === undefined ){
          params.wmode = 'transparent';
        }
        
        if( (!cfg.controls && opts.hideIcons && params.wmode === 'transparent') || opts.hideIcons === true ){
          vars.icons = 'false';
          vars.showicons = 'false';
        }
        
        if( params.wmode === 'transparent' && !vars.screencolor && !attrs.bgcolor ){
          vars.screencolor = 'ffffffff';
          attrs.bgcolor = '#000000';
        }
        
        var flashParams = { 
          src: params.movie,
          version: [9, 115],
          id: id,
          bgcolor: attrs.bgcolor,
          wmode: params.wmode,
          loop: params.loop, // FIXME: This may not be a valid param.
          allowfullscreen: params.allowfullscreen
        };
        
        var clip = {
          url: src, 
          autoPlay: cfg.autoplay, 
          autoBuffering: (cfg.preload && cfg.preload === 'auto') ? true : false
        };
        var plugins = {
          controls: null
        };
        // TODO: add events object and add it to <var>config</var>.
        // var events = {};
        var config = $.extend({}, { clip: clip }, { plugins : plugins }, { play: null });
        
        var mediaControls = $('div.media-controls:first')[0];
        
        $(this.visualElem).flowplayer(
          flashParams, 
          config
        );
        
        $(this.visualElem).flowplayer(0).load(function() {
          var $thisObj = $('object', this.getParent())[0];
          fn($thisObj);
          flowPlayerReady(this);
        });
        
        $(this.visualElem).flowplayer(0).controls(mediaControls, {
          // CSS class name for the buffer bar
          bufferClass: 'buffer',
          // a default duration for the time display in seconds
          duration: 0
        });
        
        setTimeout(function(){
          var swf = $('object', that.visualElem)[0];
          
          if( !swf || (swf.style.display === 'none' && $('> *', that.visualElem).length > 1 ) ){
            $('div[bgactive]', that.visualElem).css({width: '100%', height: '100%'});
            that._trigger('flashblocker');
          }
        }, 9);
      },
      canPlaySrc: function(media){
        var ret   = m.fn.canPlaySrc.apply(this, arguments), 
          index   = -1,
          src   = media.src || media
        ;
        
        if( !ret && typeof src === 'string' ){
          index = src.indexOf('youtube.com/');
          if(index < 15 && index > 6){
            ret = 'maybe';
          }
        }
        
        return ret;
      },
      canPlayCodecs: ['avc1.42E01E', 'mp4a.40.2', 'avc1.58A01E', 'avc1.4D401E', 'avc1.64001E', 'VP6', 'mp3', 'AAC'],
      canPlayContainer: ['video/3gpp', 'video/x-msvideo', 'video/quicktime', 'video/x-m4v', 'video/mp4', 'video/m4p', 'video/x-flv', 'video/flv', 'audio/mpeg', 'audio/aac', 'audio/mp4', 'audio/x-m4a', 'audio/m4a', 'audio/mp3', 'audio/x-fla', 'audio/fla', 'youtube/flv', 'flowplayer/flowplayer']
    }
  ;
  
  m.add('flowPlayer', 'video', flowPlayerMM);
  m.add('flowPlayer', 'audio', flowPlayerMM);
  
})(jQuery);