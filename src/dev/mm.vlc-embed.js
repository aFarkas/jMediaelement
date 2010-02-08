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
	
	var defaultAttrs = {
			pluginspage: 'http://www.videolan.org',
			version: 'VideoLAN.VLCPlugin.2',
			progid: 'VideoLAN.VLCPlugin.2',
			//codebase: 'http://downloads.videolan.org/pub/videolan/vlc/latest/win32/axvlc.cab',//todo
			events: 'true',
			//classid: 'clsid:9BE31822-FDAD-461B-AD51-BE1D1C159921',//todo
			type: 'application/x-vlc-plugin'
		}
	;
	function embedVlc(id, attrs, params){
		var vlc = document.createElement('object');
		$.each($.extend({}, defaultAttrs, attrs), function(name, val){
			vlc.setAttribute(name, val);
		});
		$.each(params, function(name, val){
			var param = document.createElement('param');
			param.setAttribute(name, val);
			vlc.appendChild(param);
		});
		vlc.setAttribute('id', id);
		vlc.setAttribute('name', id);
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
				vlc = $(embedVlc(id, vlcAttr, params)).css(dims).insertBefore(api.html5elem);
				fn(vlc[0]);
			},
			canPlayCodecs: ['avc1.42E01E', 'mp4a.40.2', 'avc1.58A01E', 'avc1.4D401E', 'avc1.64001E', 'dirac', 'speex', 'theora', 'vorbis'],
			canPlayExts: ['avi',  'm4v', 'mp4', 'mov', 'flv', 'f4v', 'f4p', 'mp3', 'ogg', 'ogv', 'oga'],
			canPlayContainer: ['video/quicktime', 'video/x-m4v', 'video/mp4', 'video/m4p', 'audio/mpeg', 'audio/mp3', 'video/ogg', 'video/x-ogg', 'audio/x-ogg', 'audio/ogg', 'application/ogg', 'application/x-ogg']
		}
	;
			
	$.multimediaSupport.add('vlc', 'video', vlcMM);
	$.multimediaSupport.add('vlc', 'audio', vlcMM);
})(jQuery);
