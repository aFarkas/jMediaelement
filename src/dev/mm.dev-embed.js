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
	//options
	$.extend($.fn.jmeEmbed.defaults, 
			{yourPlugin: {}}
		)
	;
	
	// this object will be used as a prototype for your plugin
	var yourPlugin = {
		isTechAvailable: true,
		canPlayCodecs: ['theora', 'vorbis'],
		canPlayContainer: ['application/ogg', 'audio/ogg', 'video/ogg', 'audio/x-ogg', 'video/x-ogg'],
		_embed: function(src, id, cfg, fn){
			// generate a plugin element with the id, src and cfg and give it a width/height of 100%
			//cfg.loop, cfg.autoplay, cfg.autobuffer, cfg.controls
			
			//append the generated element to this.visualElem (This is an jQuery-Object)
			//this.visualElem.append(elem);
			//call the fn-function with your successful generated element as an argument
			//fn(elem);
		}
	};
	
	// add a mimetype extension mapping, if it isn´t done yet (call $.multimediaSupport._showMimeTypes() in your firebug console to see all registered/mapped mimetypes)
	// (if you support multiple mimetypes and all of them use the same extensions. you only have to register one of these mime-types)
	$.multimediaSupport.registerMimetype('audio', {
		'application/ogg': ['ogg', 'ogm', 'oga']
	});
	// now add your object as a prototype for the video/audio element
	$.multimediaSupport.add('yourPlugin', 'video', yourPlugin);
	$.multimediaSupport.add('yourPlugin', 'audio', yourPlugin);
})(jQuery);
