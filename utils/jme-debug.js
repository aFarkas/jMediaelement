/*
 * include this script into your html-document, if you have problems to get startet with your jme-project.
 * it will print some infos to your JavaScript console (Firebug or other build in Development-Tools)
 */

(function($){
	if(!window.console && !console.log){return;}
	
	function init(){
		$('video, audio')
			.bind('jmeBeforeEmbed', addBindings)
			.filter(function(){
				return ( $.data( this, 'mediaElemSupport' ) ) ? this : false ;
			})
			.each(addBindings)
		;
	}
	
	var con = {
		log: console.log,
		error: (console.error) ? console.error : function(a, b, c){
			console.log('!!!'+ a, b, c);
		},
		warn: (console.warn) ? console.warn : function(a, b, c){
			console.log('!'+ a, b, c);
		}
	};
	
	function addBindings(){
		var errorTimer,
			elem = $(this)
		;
		
		var errorTimeout = function(){
			if( !elem.isJMEReady() ){
				con.warn($(elem).getMediaAPI()+ "-api isn't ready for long time", elem[0], elem.getJMEVisual()[0]);
				if(!elem.getJMEVisual().height() && !elem.getJMEVisual().width()){
					con.log(":-) API-Element seems to be in a hidden area. Until it is hidden, the API can't get ready, but will be initialized right it gets visible");
				}
				if($(elem).getMediaAPI() === "jwPlayer"){
					if( location.protocol === 'file:' ){
						con.warn('If you work local you have to add your development directory to the local-trusted security sandbox: http://www.macromedia.com/support/documentation/en/flashplayer/help/settings_manager04.html');
					}
					var api = elem.getJMEAPI();
					con.warn("Check the path to your swf files. Is this the correct path to your jwplayer?: "+ ( (api) ? api.embedOpts.jwPlayer.path : '???' ) );
				}
			}
		};
		
		$(this)
			.bind('mmAPIReady', function(e, data){
				clearTimeout(errorTimer);
				con.log(':-) everything seems fine: '+ data.mediaAPI +'-API is ready', e.target);
				var url = elem.getCurrentSrc();
				if(data.mediaAPI === 'jwPlayer' && location.protocol === 'file:' && url.indexOf('youtube.com') !== -1 ){
					con.warn('youtube videos can only be played in a http-enviroment, not local.');
				}
			})
			.bind('jmeflashRefresh', function(e, data){
				con.log(':-) flash was refreshed due to a reframe bug, but everything seems fine now', e.target);
			})
			.bind('apiActivated', function(e, data){
				if( $(this).isJMEReady() ){
					con.log(':-) everything seems fine: '+ data.mediaAPI +'-API was changed and is ready', e.target);
				} else {
					con.log(data.mediaAPI +'-API is activated and is waiting to get ready', e.target);
					if(data.mediaAPI === 'jwPlayer' && location.protocol === 'file:'){
						con.warn('Add your development-directory to the local-trusted security sandbox: http://www.macromedia.com/support/documentation/en/flashplayer/help/settings_manager04.html');
					}
					clearTimeout(errorTimer);
					errorTimer = setTimeout(errorTimeout, 4000);
				}
			})
			.bind('totalerror', function(e, data){
				con.error('an error occured: no source is playable by any player', data, e.target);
			})
		;
		clearTimeout(errorTimer);
		errorTimer = setTimeout(errorTimeout, 4000);
	}
	
	$(init);
})(jQuery);
