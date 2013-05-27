/*
 * 
 * $('.mediaplayer').jmeProp('embedUrl');
 * 
 * $('.mediaplayer').jmeFn('getIframe');
 * $('.mediaplayer').jmeFn('getIframe', 600, 300);
 * $('.mediaplayer').jmeFn('getIframe', '80%');
 */
(function($){
	var r20 = /%20/g;
	var embedURL;
	
	if($('html').hasClass('jme-embedded-player')){
		var cfg;
		var path = (location.search || '').replace(/^\?/, '').split('&');
		$.each(path, function(i, part){
			part = part.split('=');
			if(part[0] == 'jmeembed'){
				cfg = part[1];
				return false;
			}
		});
		if(cfg){
			cfg = decodeURIComponent(cfg.replace(/\+/g, ' '));
			try {
				cfg = JSON.parse(cfg);
			} catch(er){}
			if(typeof cfg == 'object' && cfg.e){
				if(cfg.a.title){
					document.title = cfg.a.title;
				}
				$(function(){
					var player = $('<div class="mediaplayer" />').prependTo('body').data('jme', {controlbar: true});
					if(cfg.e == 'video'){
						cfg.a.preload = 'none';
					}
					if(!$.jme){
						cfg.a.controls = 'controls';
					}
					var media = $(document.createElement(cfg.e)).attr(cfg.a).appendTo(player);
					
					if(cfg.e == 'video'){
						media.css({width: '100%', height: '100%'});
					}
					$.each(cfg.c, function(i, child){
						$(document.createElement(child.e)).attr(child.a).appendTo(media);
					});
					$('body').updatePolyfill();
					media.mediaLoad();
				});
			}
		}
	}
(function (factory) {
	if($.jme){
		factory($);
	} else {
		$(window).on('jmepluginready', function(){
			factory($);
		});
	}
	
}(function($){
	var createEmbedUrl = function(){
		if(!createEmbedUrl.run){
			if($.jme.options.embeddedPlayer){
				embedURL = $.jme.options.embeddedPlayer;
			}
			if(embedURL){
				embedURL += (embedURL.indexOf('?') != -1) ? '&' : '?';
				
			} else if(window.console) {
				console.log('you need to define a path to the embedded player $.jme.options.embeddedPlayer');
			}
		}
		createEmbedUrl.run = true;
	};
	
	$.jme.defineMethod('getIframe', function(width, height){
		if(!width){
			width = 640;
		}
		if(!height){
			height = 360;
		}
		if(/\d$/.test(''+width)){
			width += 'px';
		}
		if(/\d$/.test(''+height)){
			height += 'px';
		}
		var style = 'width: '+width +'; height: '+ height +'; overflow: hidden; border: none;';
		return '<iframe style="'+ style +'" src="'+ $(this).jmeProp('embedUrl') +'" allowfullscreen webkitallowfullscreen frameborder="0"></iframe>';
	});
	
	$.jme.defineProp('embedUrl', {
		get: function(elem){
			createEmbedUrl();
			var data = $.jme.data(elem);
			var src = data.media.prop('src');
			var obj = {a: {}, c:[]};

			data.media.each(function(){
				obj.e = data.media.prop('nodeName').toLowerCase();
				
				$.each(['poster', 'src', 'autoplay', 'loop', 'muted', 'title'], function(i, attr){
					var val = data.media.attr(attr);
					if(val != null){
						obj.a[attr] = data.media.prop(attr);
					}
				});
				$('track', data.media).each(function(){
					var track = $(this);
					var child = {e: 'track', a: {}};
					obj.c.push(child);
					$.each(['src', 'srclang', 'kind', 'label'], function(i, attr){
						var val = track.attr(attr);
						if(val != null){
							child.a[attr] = track.prop(attr);
						}
					});
				});
				$('source', data.media).each(function(){
					var source = $(this);
					var child = {e: 'source', a: {}};
					obj.c.push(child);
					$.each(['src', 'media', 'type'], function(i, attr){
						var val = source.attr(attr);
						if(val != null){
							child.a[attr] = source.prop(attr);
						}
					});
				});
			});

			return embedURL + 'jmeembed=' + encodeURIComponent(JSON.stringify(obj)).replace( r20, "+" );
		},
		readonly: true
	});
	
}));
})(jQuery);

