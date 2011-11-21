(function($){
	$.fn.jmeControl.addControl('toggle-audio-track', function(control, video, data, o){
		
		var elems = $.fn.jmeControl.getBtn(control);
		var isActive = data.controlWrapper.hasClass('audio-track-active');
		var audioTrack = data.controlWrapper.find('audio.audio-track');
		var changeState = function(){
			if (isActive) {
				elems.text.text(elems.names[1]);
				elems.title.attr('title', elems.titleText[1]);
				elems.icon.addClass('ui-icon-audio-active');
			} else {
				elems.text.text(elems.names[0]);
				elems.title.attr('title', elems.titleText[0]);
				elems.icon.removeClass('ui-icon-audio-active');
			}
		};
		
		var timeSync = function(e, extra){
			if( isActive ){
				
				var audioTime = audioTrack.currentTime();
				var dif = Math.abs(audioTime - extra.time);
				
				if(dif > 0.7){
					if(!audioTrack.isPlaying()){
						audioTrack.play();
					}
					audioTrack.currentTime(extra.time);
				}
			}
		};
		var playSync = function(e, extra){
			if( isActive ){
				if(e.type == 'play' || e.type == 'playing'){
					audioTrack.play();
				} else {
					audioTrack.pause();
				}
			}
		};
		var volumeSync = function(e, extra){
			if(e.type == 'volumelevelchange'){
				audioTrack.volume(extra.volumelevel);
			} else {
				audioTrack.muted(extra.isMuted);
			}
		};
		
		control.bind('ariaclick', function(){
			if ( isActive ) {
				isActive = false;
				audioTrack.pause();
			} else {
				isActive = true;
				//
				audioTrack.play();
				if(!video.isPlaying()){
					audioTrack.pause();
				}
				setTimeout(function(){
					if(video.isPlaying()){
						audioTrack.play();
					}
				}, 9);
				
				
			}
			changeState();
			return false;
		});
		video.bind('timechange', timeSync);
		video.bind('play pause playing waiting', playSync);
		video.bind('mute volumelevelchange ', volumeSync);
		video.bind('inactivateaudiotrack', function(){
			isActive = false;
			audioTrack.pause();
			changeState();
			control.css('visibility', 'hidden');
		});
		video.bind('showaudiotrackcontrol', function(){
			control.css('visibility', 'visible');
		});
		changeState();
	});
})(jQuery);
