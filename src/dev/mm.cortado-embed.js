/**!
 * Part of the jMediaelement-Project | http://github.com/aFarkas/jMediaelement
 * @author Alexander Farkas
 * Copyright 2010, Alexander Farkas
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
(function($){
	var doc = document;
		
	$.extend($.fn.jmeEmbed.defaults, 
			{
				cortado: {
					path: 'http://theora.org/cortado.jar'
				}
			}
		)
	;
	
	function createApplet(width, height, attrs, params){
		var applet = doc.createElement('applet'),
			param, p
		;
		applet.setAttribute('width', width);
		applet.setAttribute('height', height);
		applet.style.width = width;
		applet.style.height = height;
		for(p in attrs){
			applet.setAttribute(p, attrs[p]);
		}
		for(p in params){
			param = doc.createElement('param');
			param.setAttribute('name', p);
			param.setAttribute('value', params[p]);
			applet.appendChild(param);
		}
		return applet;
	}
	
	var cortado = {
		isTechAvailable: !!(navigator.javaEnabled && navigator.javaEnabled()),
		canPlayContainer: ['video/ogg', 'video/x-ogg', 'audio/x-ogg', 'audio/ogg', 'application/ogg', 'application/x-ogg'],
		canPlayCodecs: ['theora', 'vorbis'],
		_embed: function(src, id, cfg, fn){
			//src, id, attrs, fn
			var appletAttrs = {
							code: 'com.fluendo.player.Cortado.class',
							archive: this.embedOpts.cortado.path,
							mayscript: 'mayscript',
							id: id,
							name: id
						},
				params 		= {url: src, local: 'false'},
				elem
			;
			
			params.autoPlay = ''+cfg.autoplay;
			params.showStatus = (cfg.controls) ? 'auto' : 'hide';
			if(cfg.poster){
				params.image = ''+cfg.poster;
			}
			
			elem = createApplet('100%', '100%', appletAttrs, params);
			$(elem).appendTo(this.visualElem[0]);
			fn(elem);
		}
	};
	
	$.multimediaSupport.add('cortado', 'video', cortado);
	$.multimediaSupport.add('cortado', 'audio', cortado);
})(jQuery);
