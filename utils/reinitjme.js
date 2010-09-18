/**
 * reinitMedia reinitiaizes the video/audio in the JWPlayer. This is sometimes needed, because of a Flash-Bug
 * 
 */

(function($){
	$.fn.reinitMedia = (function(){
		var cacheID = 0,
			reg 	= /jme-nocache-\d+/,
			addID 	= function(src){
				if(!src){return '';}
				cacheID++;
				if(reg.test(src)){
					return src.replace(reg, function(){
					    return 'jme-nocache-'+cacheID;
					});
				}
				src += (src.indexOf('?') !== -1) ? '&' : '?';
				return src + 'jme-nocache-'+cacheID; 
			}
		;
		
		return function(o){
			o = $.extend({}, $.fn.reinitMedia.defaults, o);
			
			var reinit = {
				msie: function(elem){
					elem = $(elem);
					var source = [];
					$.each(elem.attr('srces'), function(i, src){
						source.push($.extend(src, {src: addID(src.src)}));
					});
					elem.loadSrc(source, addID(elem.attr('poster') || undefined));
				}
			};
			
			return this.each(function(){
				var jme = $.data(this, 'mediaElemSupport');
				if(!jme){return;}
				var elem = this;
				if(jme.name == 'jwPlayer' && o.msie && $.browser.msie && jme.apis.jwPlayer.apiElem && $.support.flashVersion >= 10.1){
					if(o.queue){
						var oldReady = jme.apis.jwPlayer.isAPIReady;
						jme.apis.jwPlayer.isAPIReady = false;
						setTimeout(function(){
							jme.apis.jwPlayer.isAPIReady = oldReady;
							reinit.msie(elem);
							if(oldReady){
								$(elem).triggerHandler('jmeflashRefresh');
							}
						}, 0);
					} else {
						reinit.msie(elem);
					}
				}
			});
		};
	})();
	$.fn.reinitMedia.defaults = {
		msie: true,
		queue: false
	};
})(jQuery);
