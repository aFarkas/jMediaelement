(function($){
	
	var playerControls = '<div class="media-controls-wrapper"> \
							<div class="media-controls" lang="en"> \
								<a class="play-pause button"><span class="ui-icon ui-icon-play"> </span><span class="button-text">play / pause</span></a> \
								<span class="current-time player-display"></span> \
								<div class="timeline-slider"> \
									<span class="ui-handle-label">play position</span> \
									<div class="progressbar"></div> \
								</div> \
								<span class="duration player-display"></span> \
								<a class="mute-unmute button"><span class="ui-icon ui-icon-volume-on"> </span><span class="button-text">mute / unmute</span></a> \
								<div class="volume-slider"><span class="ui-handle-label">volume control</span></div> \
								<a class="fullscreen button"><span class="ui-icon ui-icon-circle-zoomin"> </span><span class="button-text">zoomin / zoomout</span></a> \
							</div> \
						</div>'
	;
	
	
	
	$.fn.jmeEmbedControls = function(o){
		return this.each(function(){
			$('video', this).after('<div class="media-state" />');
			$(this).append(playerControls).jmeControl(o);
		});
	};
	
})(jQuery);