/*
 * This script is a very simple utility to add predefined control-markup for rapid/quick start development with jme.
 * Feel free to extend and change this markup for your needs.
 */
(function($){
	
	var playerControls = '<div class="media-controls-wrapper"> \
							<div class="media-controls" lang="en"> \
								<a class="play-pause button"><span class="ui-icon ui-icon-play"> </span><span class="button-text">play / pause</span></a> \
								<span class="current-time player-display"></span> \
								<div class="timeline-slider"> \
									<span class="handle-label">play position</span> \
									<div class="progressbar"></div> \
								</div> \
								<span class="duration player-display"></span> \
								<a class="mute-unmute button"><span class="ui-icon ui-icon-volume-on"> </span><span class="button-text">mute / unmute</span></a> \
								<div class="volume-slider"><span class="handle-label">volume control</span></div> \
							</div> \
						</div>'
	;
	var fullscreenBtn = '<a class="fullscreen button"><span class="ui-icon ui-icon-circle-zoomin"> </span><span class="button-text">zoomin / zoomout</span></a>';
						
	$.fn.jmeEmbedControls = function(o){
		return this
			//append standard controls
			.append(playerControls)
			//add extra video controls
			.each(function(){
				//media-state makes only sense with video not audio
				var hasVideo = $('video', this).after('<div class="media-state" />');
				//include fullscreenn button only if plugin is included and we have a video-element
				if( $.fn.enterFullWindow && hasVideo[0] ) {
					$('div.media-controls', this).append(fullscreenBtn);
				}
			})
			//register controls with jmeConttrol
			.jmeControl(o)
		;
	};
	
})(jQuery);