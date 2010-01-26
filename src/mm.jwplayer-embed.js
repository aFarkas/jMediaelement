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
	var jwMM = {
			isTechAvailable: swfobject.hasFlashPlayerVersion('9.0.124'),
			_embed: function(src, id, mm, dims, attrs, fn, opts, api){
				var vars 		= $.extend({}, opts.jwPlayer.vars, {file: src, id: id}),
					swfAttrs 	= $.extend({}, opts.jwPlayer.attrs, {name: id}),
					div
				;
				
				if(attrs.poster){
					vars.image = attrs.poster;
				}
				
				
				vars.autostart = ''+ attrs.autoplay;
				vars.repeat = (attrs.loop) ? 'single' : 'false';
				vars.controlbar = (attrs.controls) ? 'bottom' : 'none';
				
				if( opts.jwPlayer.playFirstFrame && !attrs.poster && !vars.autoplay ){
					api.data.playFirstFrame = true;
					vars.autostart = 'true';
				}
				
				div = $('<div id="'+id+'"></div>').css(dims).insertBefore(mm);
				
				swfobject.embedSWF(opts.jwPlayer.path, id, dims.width, dims.height, '9.0.124', null, vars, opts.jwPlayer.params, swfAttrs, function(swf){
					if(swf.ref){
						fn(swf.ref);
						//swfobject bug in chorme
						div.remove();
						div = null;
					}
				});
			},
			canPlayCodecs: ['avc1.42E01E', 'mp4a.40.2', 'avc1.58A01E', 'avc1.4D401E', 'avc1.64001E'],
			canPlayExts: ['m4v', 'mp4', 'mov', 'flv', 'f4v', 'f4p', 'mp3', 'fla', 'flv', 'f4a'],
			canPlayContainer: ['video/quicktime', 'video/x-m4v', 'video/mp4', 'video/x-flv', 'audio/mp3', 'audio/x-fla']
		}
	;
			
	$.multimediaSupport.add('jwPlayer', 'video', jwMM);
	$.multimediaSupport.add('jwPlayer', 'audio', jwMM);
	
})(jQuery);
