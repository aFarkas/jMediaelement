/**
 * @author Alexander Farkas
 */
(function($){
	
	var doc = document;
		
	$.extend($.fn.mediaElementEmbed.defaults, 
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
		applet.style.width = width+'px';
		applet.style.height = height+'px';
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
			
			canPlayExts: ['ogg', 'ogv', 'oga'],
			canPlayContainer: ['video/ogg', 'video/x-ogg', 'audio/x-ogg', 'audio/ogg'],
			canPlayCodecs: ['dirac', 'speex', 'theora', 'vorbis'],
			_embed: function(src, id, mm, dims, attrs, fn, opts){
				var appletAttrs = {
								code: 'com.fluendo.player.Cortado.class',
								archive: opts.cortado.path,
								mayscript: 'mayscript',
								id: id,
								name: id
							},
					params 		= {url: src, local: 'false'},
					elem
				;
				
				params.autoPlay = attrs.autoplay;
				params.showStatus = (attrs.controls) ? 'auto' : 'hide';
				if(attrs.poster){
					params.image = attrs.poster;
				}
				
				elem = createApplet(dims.width, dims.height, appletAttrs, params);
				$(mm).before(elem);
				elem.mayscript = true;
				elem.mayScript = true;
				fn(elem);
			}
		}
	;
		
	$.multimediaSupport.add('cortado', 'video', cortado);
	$.multimediaSupport.add('cortado', 'audio', cortado);
})(jQuery);
