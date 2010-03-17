/**!
 * Part of the jMediaelement-Project | http://github.com/aFarkas/jMediaelement
 * @author Alexander Farkas
 * Copyright 2010, Alexander Farkas
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */

/*
 * How to implement new plugins for the jMediaelement-Project
 * watchout for the keyword 'yourPlugin'
 */

(function($){
		
	/*
	 * this object will be used as a prototype for your plugin
	 * this.apiElem refers to your embedded element
	 * this.html5elem reffers to the mediaelement
	 */ 
	var yourPlugin = {
		/*
		 * _init will be called right after the apiElem was embedded
		 */
		_init: function(){
			
			//this._trigger('mmAPIReady');
		},
		/*
		 * return a float in secondes
		 */
		getDuration: function(){
			
		},
		/*
		 * return current source
		 */
		getCurrentSrc: function(){
			
		},
		/* 
		 * return boolean
		 */
		isPlaying: function(){
			
		},
		play: function(){
			
		},
		pause: function(){
			
		},
		/*
		 * works as getter/setter
		 * allowed is a float between 0 - 100
		 */
		volume: function(v){
			
		},
		/*
		 * works as a getter/setter
		 * time in secondes
		 */
		currentTime: function(sec){
			
		},
		/*
		 * works as a getter/setter
		 * use boolean
		 */
		muted: function(state){
			
		},
		/*
		 * changes the media: retrieves the source of the main media-file and the optional poster-src
		 * if $.attr(this.html5elem, 'autoplay') is true, the playback has to be start immediatley otherwise it shouldn´t start
		 */
		_mmload: function(src, poster){
			
		},
		
		/*
		 * the following methods / properties are optional
		 */
		_videoFullscreen: false, //true
		enterFullScreen: function(){},
		exitFullScreen: function(){},
		_setActive: function(){},
		_setInactive: function(){}
	};
	
	/*
	 * additionaly you have to trigger the following events by using this._trigger(event);
	 * event is on object or the event name
	 */
	/*
	 * simple events:
	 * 	required:
	 * 		mmAPIReady, play, pause, ended, playing
	 * 	optional:
	 * 		waiting
	 * 
	 * compley events:
	 * 	required:
	 * 		loadedmeta (with duration in secondes)
	 * 		timechange (widh time in secondes)
	 * 		mute (with isMuted as boolean)
	 * 		
	 * 	optional:
	 * 		volumelevelchange: (volumelevel on 0 - 100 basis)
	 * 		progresschange: (with loaded (number), lengthComputable (boolean) and if lengthComputable total and relLoaded)
	 * 		
	 */
	
	// now add your object as a prototype for the video/audio element
	$.multimediaSupport.add('yourPlugin', 'video', yourPlugin);
	$.multimediaSupport.add('yourPlugin', 'audio', yourPlugin);
})(jQuery);
