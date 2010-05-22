/**!
 * Part of the jMediaelement-Project | http://github.com/aFarkas/jMediaelement
 * @author Alexander Farkas
 * Copyright 2010, Alexander Farkas
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
(function($){
	$.extend($.fn.jmeEmbed.defaults, 
			{
				vlc: {
					params: {},
					attrs: {}
				}
			}
		)
	;
	
	var $m 				= $.multimediaSupport,
		defaultAttrs 	= {
			pluginspage: 'http://www.videolan.org',
			version: 'VideoLAN.VLCPlugin.2',
			progid: 'VideoLAN.VLCPlugin.2',
			events: 'True',
			type: 'application/x-vlc-plugin'
		},
		activeXAttrs 	= {
			classid: 'clsid:9BE31822-FDAD-461B-AD51-BE1D1C159921'
		}
	;
	
	var vlcMM = {
			isTechAvailable: function(){
				if($.support.vlc !== undefined){
					return $.support.vlc;
				}
				$.support.vlc = false;
				$.support.vlcWEBM = false;
				var vlc = $m.getPluginVersion('VLC Multimedia Plug-in');
				if(vlc[0] >= 0.9){
					if(vlc[0] >= 1.1){
						$.support.vlcWEBM = true;
					}
					$.support.vlc = true;
				} else if(window.ActiveXObject){
					try {
						vlc = new ActiveXObject('VideoLAN.VLCPlugin.2');
						if( vlc ){
							if( vlc.VersionInfo && parseFloat( vlc.VersionInfo, 10 ) >= 1.1 ){
								$.support.vlcWEBM = true;
							}
							$.support.vlc = true;
						}
					} catch(e){}
				}
				if( $.support.vlcWEBM ){
					vlcMM.canPlayCodecs.push('VP8');
					vlcMM.canPlayCodecs.push('VP8.0');
					vlcMM.canPlayContainer.push('video/webm');
				}
				return $.support.vlc;
			},
			_embed: function(src, id, attrs, fn){
				var opts 	= this.embedOpts.vlc,
					vlcAttr = $.extend({}, opts.attrs, {data: src}, defaultAttrs),
					params 	= $.extend({}, opts.params, {
						Src: src,
						ShowDisplay: 'True',
						autoplay: ''+ attrs.autoplay,//
						autoloop: ''+attrs.loop
					}),
					elem = $m.embedObject( this.visualElem[0], id, vlcAttr, params, activeXAttrs, 'VLC Multimedia Plug-in' )
				;
				this._currentSrc = src;
				this._loop = attrs.loop;
				fn( elem );
				elem = null;
			},
			canPlayCodecs: ['avc1.42E01E', 'mp4a.40.2', 'avc1.58A01E', 'avc1.4D401E', 'avc1.64001E', 'theora', 'vorbis', 'VP6', 'mp3', 'AAC'],
			canPlayContainer: ['video/3gpp', 'video/x-msvideo', 'video/quicktime', 'video/x-m4v', 'video/mp4', 'video/m4p', 'video/x-flv', 'video/flv', 'audio/mpeg', 'audio/x-fla', 'audio/fla', 'video/ogg', 'video/x-ogg', 'audio/x-ogg', 'audio/ogg', 'application/ogg', 'application/x-ogg']
		}
	;
	
	$m.add('vlc', 'video', vlcMM);
	$m.add('vlc', 'audio', vlcMM);
})(jQuery);
