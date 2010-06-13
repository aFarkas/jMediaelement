/**
 * Simple Caption Plugin for jme 
 * @version 1.0
 *
 * http://protofunc.com/jme
 * http://github.com/aFarkas/jMediaelement
 *
 * -------------------
 *  Uses a modified Version of Silvia Pfeifers srt-parser
 *	http://www.annodex.net/~silvia/itext/
 * -------------------
 *
 * @description	
 * 
 * HTML:
 * <a class="track" href="srtfile.srt" lang="en" data-enabled="enabled" data-sanitize="sanitize" data-role="textaudiodesc">name</a>
 * 
 * API:
 * 
 * $('video, audio').getTrackContent(index|object, callback)
 * 
 * $('video, audio').enableTrack(index|object)
 * 
 * $('video, audio').disableTrack(index|object)
 * 
 * 
 * HTML-Display-Area:
 * <video></video>
 * <div class="track-display">
 * 		<div>Text</div>
 * </div>
 * and
 * <div class="track-display tad-track" aria-live="assertive" style="position: absolute; left: -9999em; width: 5px; height: 5px; overflow: hidden; z-index: -100;">
 * 		<div>Text</div>
 * </div>
 * 
 * <video></video>
 * <div class="track-display inactive-track-display"></div>
 * and
 * <div class="track-display tad-track inactive-track-display" aria-live="assertive" style="position: absolute; left: -9999em; width: 5px; height: 5px; overflow: hidden; z-index: -100;"></div>
 * 
 * 
 * HTML-UI:
 * only toggles first track on/off. for more functionality script your own UI. API is powerfull enough
 * <a class="toggle-track">bla</a>
 */

(function($){
	
	//enable tracks
	$(document).bind('jmeEmbed', function(e, data){
		data = data.data;
		var mm 				= $(e.target),
			dir 			= ( mm.css('direction') === 'rtl' ) ? 'right' : 'left',
			activeTracks 	= $('a.track[data-enabled]', mm)
		;
		data.trackDisplay = $('<div class="track-display inactive-track-display" style="display: none;"></div>').insertAfter(e.target);
		data.tadDisplay = $('<div class="track-display tad-track inactive-track-display" aria-live="assertive" style="display: none; position: absolute; '+ dir +': -9999em; width: 5px; height: 5px; overflow: hidden; z-index: -100;"></div>').insertAfter(e.target);
		data.trackDisplays = data.trackDisplay.add(data.tadDisplay);
		if( activeTracks[0] ){
			mm.enableTrack(activeTracks[0], data);
		}
		//add fullwindow support
		data.trackDisplay
			.videoOverlay({
				fullscreenClass: 'track-in-fullscreen',
				video: mm,
				startCSS: {
					width: 'auto'
				},
				position: {
					bottom: 0,
					left: 0,
					right: 0
				}
			})
		;
	});
	
	/*
	 * extend the api
	 */
	$.multimediaSupport.fn._extend({
		disableTrack: function(object, _data){
			object = (isFinite(object)) ? tracks.filter(':eq('+ object +')') : $(object);
			if( !_data ){
				_data = $.data(this.element, 'mediaElemSupport');
			}
			object.removeAttr('data-enabled');
			$(this.element).addTimeRange(object[0].href, false);
			_data.trackDisplays.addClass('inactive-track-display').hide().empty();
			this._trigger('trackChange', {track: object, enabled: false});
		},
		getTrackContent: function(object, fn, _trackData){
			object = (isFinite(object)) ? $('a.track', this.element).filter(':eq('+ object +')') : $(object);
			_trackData = _trackData || $.data(object[0], 'jmeTrack') || $.data(object[0], 'jmeTrack', {load: false});
			if( !_trackData.load ){
				_trackData.load = 'loading';
				$.ajax({
					url: object[0].href,
					dataType: 'text',
					success: function(srt){
						_trackData.load = 'loaded';
						_trackData.captions = $.parseSrt(srt, (object[0].attributes[name] || {}).specified );
						fn( _trackData.captions );
					}
				});
			} else {
				fn(trackData.captions);
			}
		},
		enableTrack: function(object, _data){
			var tracks 		= $('a.track', this.element),
				that 		= this,
				mm 			= $(this.element),
				trackData,
				found
			;
			if( !_data ){
				_data = mm.data('mediaElemSupport');
			}
			object = (isFinite(object)) ? tracks.filter(':eq('+ object +')') : $(object);
			
			tracks
				.filter('[data-enabled]')
				.each(function(){
					if(this !== object[0]){
						that.disableTrack(this, _data);
					}
				})
			;
			if( !object[0] ){return;}
			
			trackData = $.data(object[0], 'jmeTrack') || $.data(object[0], 'jmeTrack', {load: false});
			trackData.trackDisplay = ( object.is('[data-role=textaudiodesc]') ) ? _data.tadDisplay : _data.trackDisplay;
			trackData.trackDisplay.removeClass('inactive-track-display').show();
			if( !trackData.load ){
				this.getTrackContent(object, 
					function(){
						var captionChange = function (e){
								e.target = mm[0];
								e = $.extend({}, e, {
									target: mm[0],
									captions: trackData.captions,
									caption: trackData.captions[e.rangeIndex],
									type: (e.type === 'rangeenter') ? 'showCaption' : 'hideCaption'
								});
								if( e.type === 'showCaption' ){
									trackData.trackDisplay.html( '<div>'+ e.caption.content +'</div>' );
								} else {
									trackData.trackDisplay[0].innerHTML = '';
								}
								mm.triggerHandler(e.type, e);
							};
							$.each(trackData.captions, function(i, caption){
								mm.addTimeRange(object[0].href, {
									enter: caption.start,
									leave: caption.end,
									callback: captionChange,
									activate: true
								});
							});
					},
					trackData
				);
			} else {
				mm.addTimeRange(object[0].href, true);
			}
			object.attr('data-enabled', 'enabled');
			this._trigger('trackChange', {track: object, enabled: true, trackData: trackData});
		}
	});
	
	/*
	 * extend jme controls
	 */
	
	$.fn.jmeControl.addControl('toggle-track', function(control, mm, data, o){
		var elems = $.fn.jmeControl.getBtn(control),
			tracks 		= $('a.track', this.element),
			changeState = function(){
				var enabled = tracks.filter('[data-enabled]');
				if( enabled[0] ){
					elems.text.text(elems.names[1]);
					elems.title.attr('title', elems.titleText[1]);
					elems.icon
						.addClass('ui-icon-document')
						.removeClass('ui-icon-document-b')
					;
				} else {
					elems.text.text(elems.names[0]);
					elems.title.attr('title', elems.titleText[0]);
					elems.icon
						.addClass('ui-icon-document-b')
						.removeClass('ui-icon-document')
					;
				}
			}
		;
		
		if(o.addThemeRoller){
			control.addClass('ui-state-default ui-corner-all');
		}
		if( !tracks[0] ){
			control.addClass(o.classPrefix +'no-track');
		}
		control
			.bind('ariaclick', function(){
				var enabled = tracks.filter('[data-enabled]');
				if(enabled[0]){
					mm.disableTrack(enabled);
				} else if( tracks[0] ) {
					mm.enableTrack(tracks[0]);
				}
				return false;
			})
		;
		changeState();
		mm.bind('trackChange', changeState);
	});
	
	
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is HTML5 video itext demonstration code.
 *
 * The Initial Developer of the Original Code is Mozilla Corporation.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *  Silvia Pfeiffer <silvia@siliva-pfeiffer.de>
 *
 * ***** END LICENSE BLOCK ***** */

// SRT specification from http://forum.doom9.org/archive/index.php/t-73953.html
// but without the formatting, which is just interpreted as text

// Function to parse srt file
var regs = {
	sanitize: /<[a-zA-Z\/][^>]*>/g,
	dosLines: /\r+/g,
	index: /^\d+$/,
	time: /(\d+):(\d+):(\d+)(?:,(\d+))?\s*--?>\s*(\d+):(\d+):(\d+)(?:,(\d+))?/
	
};
$.parseSrt = function(srt, sanitize) {
    srt = srt.replace(regs.dosLines, ''); // remove dos newlines
    srt = $.trim(srt); // trim white space start and end
    if(sanitize){
	    srt = srt.replace(regs.sanitize, ''); // remove all html tags for security reasons
	}

    // get captions
    var captions = [];
    var caplist = srt.split('\n\n');
    for (var i = 0; i < caplist.length; i=i+1) {
        var caption = "";
        var content, start, end, s;
        caption = caplist[i];
        s = caption.split(/\n/);
        if (s[0].match(regs.index) && s[1]) {
            // ignore caption number in s[0]
            // parse time string
            var m = s[1].match(regs.time);
            if (m) {
                start =
                  (parseInt(m[1], 10) * 60 * 60) +
                  (parseInt(m[2], 10) * 60) +
                  (parseInt(m[3], 10)) +
                  (parseInt(m[4], 10) / 1000);
                end =
                  (parseInt(m[5], 10) * 60 * 60) +
                  (parseInt(m[6], 10) * 60) +
                  (parseInt(m[7], 10)) +
                  (parseInt(m[8], 10) / 1000);
            } else {
                // Unrecognized timestring
                continue;
            }
            // concatenate text lines to html text
            content = s.slice(2).join("<br>");
        } else {
            // file format error or comment lines
            continue;
        }
        captions.push({start: start, end: end, content: content});
    }

    return captions;
};
})(jQuery);
