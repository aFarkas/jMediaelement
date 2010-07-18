/**!
 * Part of the jMediaelement-Project | http://github.com/aFarkas/jMediaelement
 * @author Alexander Farkas
 * Copyright 2010, Alexander Farkas
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */

(function($){
	
	var swfAttr = {type: 'application/x-shockwave-flash'},
		aXAttrs = {classid: 'clsid:D27CDB6E-AE6D-11cf-96B8-444553540000'},
		m 		= $.multimediaSupport
	;
	
	$.extend($.fn.jmeEmbed.defaults, 
			{
				jwPlayer: {
					path: m.jsPath + 'player.swf',
					hideIcons: 'auto',
					vars: {},
					attrs: {},
					plugins: [],
					params: {
						allowscriptaccess: 'always',
						allowfullscreen: 'true'
					}
				}
			}
		)
	;
	
		
	var regs = {
			A: /&amp;/g,
			a: /&/g,
			e: /\=/g,
			q: /\?/g
		},
		replaceVar = function(val){
			return (val.replace) ? val.replace(regs.A, '%26').replace(regs.a, '%26').replace(regs.e, '%3D').replace(regs.q, '%3F') : val;
		}
	;
	
	
	
	(function(){
		$.support.flash9 = false;
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
							$.support.flash9 = !!(obj[0] > 9 || (obj[0] === 9 && obj[1] >= 115));
						}
					} catch (e) {}
				
			}
		;
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
	
	var jwMM 	= {
			isTechAvailable: function(){
				return $.support.flash9;
			},
			_embed: function(src, id, cfg, fn){
				var opts 		= this.embedOpts.jwPlayer,
					vars 		= $.extend({}, opts.vars, {file: src, id: id}),
					attrs	 	= $.extend({name: id, data: opts.path}, opts.attrs, swfAttr),
					params 		= $.extend({movie: opts.path}, opts.params),
					provider 	= $.attr(this.element, 'data-provider')
				;
				
				if(cfg.poster){
					vars.image = cfg.poster;
				}
				
				if(provider){
					vars.provider = provider;
				}
				
				// if we can't autodetect provider by file-extension,
				// we add a provider
				if(!vars.provider && !this.canPlaySrc(src)){
					vars.provider = this.nodeName;
				}
								
				vars.autostart = ''+ cfg.autoplay;
				vars.repeat = (cfg.loop) ? 'single' : 'false';
				vars.controlbar = (cfg.controls) ? 'bottom' : 'none';
				
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
				
				params.flashvars = [];
				$.each(vars, function(name, val){
					params.flashvars.push(replaceVar(name)+'='+replaceVar(val));
				});
				
				if(opts.plugins.length){
					params.flashvars.push( 'plugins='+ ( opts.plugins.join(',') ) );
				}
				params.flashvars = params.flashvars.join('&');
				fn(m.embedObject( this.visualElem[0], id, attrs, params, aXAttrs, 'Shockwave Flash' ));
			},
			canPlaySrc: function(media){
				var ret 	= m.fn.canPlaySrc.apply(this, arguments), 
					index 	= -1,
					src 	= media.src || media
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
			canPlayContainer: ['video/3gpp', 'video/x-msvideo', 'video/quicktime', 'video/x-m4v', 'video/mp4', 'video/m4p', 'video/x-flv', 'video/flv', 'audio/mpeg', 'audio/mp3', 'audio/x-fla', 'audio/fla', 'youtube/flv']
		}
	;
	
	m.add('jwPlayer', 'video', jwMM);
	m.add('jwPlayer', 'audio', jwMM);
	
})(jQuery);
