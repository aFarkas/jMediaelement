(function($){
	var embedURL = $.jme.options.embeddedPlayer;
	if(!embedURL && $('html').hasClass($.jme.classNS+'jme-embedded-player')){
		(function(){
			
		})();
	} else if(window.console){
		console.log('you need to define a path to the embedded player $.jme.options.embeddedPlayer');
	}
})(jQuery);
