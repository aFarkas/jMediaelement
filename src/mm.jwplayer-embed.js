/**!
 * Part of the jMediaelement-Project | http://github.com/aFarkas/jMediaelement
 * @author Alexander Farkas
 * Copyright 2010, Alexander Farkas
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */

(function($){
	
	$.extend($.fn.mediaElementEmbed.defaults, 
			{
				jwPlayer: {
					path: 'player.swf',
					vars: {},
					attrs: {},
					params: {
						allowscriptaccess: 'always',
						allowfullscreen: 'true'
					}
				}
			}
		)
	;
	
	var m 		= $.multimediaSupport,
		jwMM 	= {
			isTechAvailable: swfobject.hasFlashPlayerVersion('9.0.124'),
			_embed: function(src, id, cfg, fn){
				var opts 		= this.embedOpts.jwPlayer,
					vars 		= $.extend({}, opts.vars, {file: src, id: id}),
					swfAttrs 	= $.extend({}, opts.attrs, {name: id}),
					div
				;
				
				if(cfg.poster){
					vars.image = cfg.poster;
				}
				
				
				vars.autostart = ''+ cfg.autoplay;
				vars.repeat = (cfg.loop) ? 'single' : 'false';
				vars.controlbar = (cfg.controls) ? 'bottom' : 'none';
				
				if( (opts.playFirstFrame || cfg.autobuffer) && !cfg.poster && !cfg.autoplay ){
					this.data.playFirstFrame = true;
					vars.autostart = 'true';
				}
				
				this.visualElem.html('<div id="'+id+'" />');
				
				swfobject.embedSWF(opts.path, id, '100%', '100%', '9.0.124', null, vars, opts.params, swfAttrs, function(swf){
					if(swf.ref){
						swf.ref.style.visibility = 'inherit';
						fn(swf.ref);
					}
				});
			},
			canPlayCodecs: ['avc1.42E01E', 'mp4a.40.2', 'avc1.58A01E', 'avc1.4D401E', 'avc1.64001E'],
			canPlayContainer: ['video/x-msvideo', 'video/quicktime', 'video/x-m4v', 'video/mp4', 'video/m4p', 'video/x-flv', 'video/flv', 'audio/mpeg', 'audio/mp3', 'audio/x-fla', 'audio/fla']
		}
	;
	
	m.add('jwPlayer', 'video', jwMM);
	m.add('jwPlayer', 'audio', jwMM);
	
})(jQuery);
