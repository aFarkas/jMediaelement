/**!
 * Part of the jMediaelement-Project | http://github.com/aFarkas/jMediaelement
 * @author Alexander Farkas
 * Copyright 2010, Alexander Farkas
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
(function($){
	$.extend($.fn.mediaElementEmbed.defaults, 
			{
				vlc: {}
			}
		)
	;
	
	var doc	 			= document,
		defaultAttrs 	= {
			pluginspage: 'http://www.videolan.org',
			version: 'VideoLAN.VLCPlugin.2',
			progid: 'VideoLAN.VLCPlugin.2',
			events: 'true',
			type: 'application/x-vlc-plugin'
		},
		activeXAttrs 	= {
			classid: 'clsid:9BE31822-FDAD-461B-AD51-BE1D1C159921'
		}
	;
	function embedVlc(elem, id, attrs, params){
		var vlc;
		attrs = $.extend({}, defaultAttrs, attrs);
		if(!window.ActiveXObject){
			vlc = doc.createElement('object');
			$.each(attrs, function(name, val){
				vlc.setAttribute(name, val);
			});
			
			$.each(params, function(name, val){
				var param = doc.createElement('param');
				param.setAttribute('name', name);
				param.setAttribute('value', val);
				vlc.appendChild(param);
			});
			vlc.setAttribute('id', id);
			vlc.setAttribute('name', id);
			elem.parentNode.replaceChild(vlc, elem);
		} else if(elem.outerHTML){
			vlc = '<object';
			$.each($.extend({}, attrs, activeXAttrs), function(name, val){
				vlc += ' '+ name +'="'+ val +'"';
			});
			vlc += ' name="'+ id +'"';
			vlc += ' id="'+ id +'"';
			vlc += '>';
			$.each(params, function(name, val){
				vlc += ' <param name="'+ name +'" value="'+ val +'" />';
			});
			vlc += '</object>';
			elem.outerHTML = vlc;
			vlc = doc.getElementById(id);
		}
		return vlc;
	}
	var vlcMM = {
			isTechAvailable: function(){
				if($.support.vlc !== undefined){
					return $.support.vlc;
				}
				$.support.vlc = false;
				if(navigator.plugins && navigator.plugins.length){
					$.each(navigator.plugins, function(i, plugin){
						if((plugin.name || '').toLowerCase() === 'vlc multimedia plug-in'){
							$.support.vlc = true;
							return false;
						}
					});
					
				} else if(window.ActiveXObject){
					try {
						new ActiveXObject('VideoLAN.VLCPlugin.2');
						$.support.vlc = true;
					} catch(e){}
				}
				return $.support.vlc;
			},
			_embed: function(src, id, api, dims, attrs, fn){
				
				var opts 	= api.embedOpts.vlc,
					vlcAttr = $.extend({}, dims, {src: src}),
					params 	= {
						src: src,
						ShowDisplay: 'true',
						AutoPlay: ''+ attrs.autoplay,//
						AutoLoop: ''+attrs.loop
					},
					vlc
				;
				$.extend(vlcAttr, params);
				vlc = $('<div />').css(dims).insertBefore(api.html5elem)
				vlc = $(embedVlc(vlc[0], id, vlcAttr, params)).css(dims);
				fn(vlc[0]);
			},
			canPlayCodecs: ['avc1.42E01E', 'mp4a.40.2', 'avc1.58A01E', 'avc1.4D401E', 'avc1.64001E', 'theora', 'vorbis'],
			canPlayContainer: ['video/x-msvideo', 'video/quicktime', 'video/x-m4v', 'video/mp4', 'video/m4p', 'video/x-flv', 'video/flv', 'audio/mpeg', 'audio/x-fla', 'audio/fla', 'video/ogg', 'video/x-ogg', 'audio/x-ogg', 'audio/ogg', 'application/ogg', 'application/x-ogg']
		}
	;
			
	$.multimediaSupport.add('vlc', 'video', vlcMM);
	$.multimediaSupport.add('vlc', 'audio', vlcMM);
})(jQuery);
