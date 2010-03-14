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
	
	var swfAttr = {type: 'application/x-shockwave-flash'},
		aXAttrs = {classid: 'clsid:D27CDB6E-AE6D-11cf-96B8-444553540000'},
		m 		= $.multimediaSupport,
		jwMM 	= {
			//isTechAvailable: swfobject.hasFlashPlayerVersion('9.0.124'),
			isTechAvailable: function(){
				if($.support.flash9 !== undefined){
					return $.support.flash9;
				}
				$.support.flash9 = false;
				var swf = m.getPluginVersion('Shockwave Flash');
				if(swf >= 9){
					$.support.flash9 = true;
				} else if(window.ActiveXObject){
					try {
						swf = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
						if(!swf){return;}
						swf = swf.GetVariable("$version").match(/(\d+\,\d+)/);
						if(swf && swf[0]){
							if( parseFloat( swf[0].replace(',', '.' ), 10) >= 9){
								$.support.flash9 = true;
							}
						}
					} catch(e){}
				}
				return $.support.flash9;
			},
			_embed: function(src, id, cfg, fn){
				var opts 		= this.embedOpts.jwPlayer,
					vars 		= $.extend({}, opts.vars, {file: src, id: id}),
					attrs	 	= $.extend({name: id, data: opts.path}, opts.attrs, swfAttr),
					params 		= $.extend({movie: opts.path}, opts.params)
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
				params.flashvars = [];
				$.each(vars, function(name, val){
					params.flashvars.push(name+'='+val);
				});
				params.flashvars = params.flashvars.join('&');
				fn(m.embedObject( this.visualElem[0], id, attrs, params, aXAttrs ));
			},
			canPlayCodecs: ['avc1.42E01E', 'mp4a.40.2', 'avc1.58A01E', 'avc1.4D401E', 'avc1.64001E'],
			canPlayContainer: ['video/x-msvideo', 'video/quicktime', 'video/x-m4v', 'video/mp4', 'video/m4p', 'video/x-flv', 'video/flv', 'audio/mpeg', 'audio/mp3', 'audio/x-fla', 'audio/fla']
		}
	;
	
	m.add('jwPlayer', 'video', jwMM);
	m.add('jwPlayer', 'audio', jwMM);
	
})(jQuery);
