(function($){
	function isBetweenRange(elem, timerange, time){
		if(!timerange.active){return;}
		
		var e 	= {time: time};
		
		if(!timerange.entered){
			var	i = timerange.lastIndex,
				len 	= timerange.enterRanges.length,
				createEvent = function(index){
					e.rangeEnter = timerange.enterRanges[index];
					e.rangeLeave = timerange.leaveRanges[index];
					e.rangeIndex = index;
					timerange.lastIndex = e.rangeIndex;
					timerange.lastTime = timerange.enterRanges[index];
					e.type = 'rangeenter';
					timerange.entered = [ e.rangeEnter, e.rangeLeave, e.rangeIndex ];
				}
			;
			if(timerange.lastTime > time){
				while(i--){
					if(timerange.enterRanges[i] <= time && timerange.leaveRanges[i] >= time){
						createEvent(i);
						break;
					} else if(timerange.leaveRanges[i] < time){
						timerange.lastIndex = i;
						timerange.lastTime = timerange.enterRanges[i];
						break;
					}
				}
			} else {
				for(; i < len; i++){
					if(timerange.enterRanges[i] <= time && timerange.leaveRanges[i] >= time){
						createEvent(i);
						break;
					} else if(timerange.leaveRanges[i] > time){
						timerange.lastIndex = i;
						timerange.lastTime = timerange.leaveRanges[i];
						break;
					}
				} 
			}
		} else if(time < timerange.entered[0] || timerange.entered[1] < time){
			e.rangeEnter = timerange.entered[0];
			e.rangeLeave = timerange.entered[1];
			e.rangeIndex = timerange.entered[2];
			e.type = 'rangeleave';
			timerange.entered = false;
		}
		if(e.type){
			if(timerange.callback){
				timerange.callback.call(elem, e );
			}
			$(elem).triggerHandler(e);
		}	
		
	}
	
	function Numsort (a, b) {
		return a - b;
	}
	
	$.fn.addTimeRange = function(name, o){
		if(typeof o !== 'string'){
			o = $.extend({}, $.fn.addTimeRange.defaults, o);
			if(!isFinite(o.enter) || !isFinite(o.leave)){
				return this;
			}
		}
		return this.each(function(){
			var api = $.data(this, 'mediaElemSupport');
			if(!api){
				return;
			}
			if(!api.timeRanges){
				api.timeRanges = {};
			}
			
			if(!api.timeRanges[name]){
				api.timeRanges[name] = {
					enterRanges: [],
					leaveRanges: [],
					lastIndex: 0,
					lastTime: 0,
					lastFound: false,
					entered: false,
					active: false,
					callback: o.callback
				};
			}
			
			if(o.callback){
				api.timeRanges[name].callback = o.callback;
			}
			
			if(o === 'activate'){
				api.timeRanges[name].active = true;
				$(this).bind('timechange.'+name, function(e, evt){
					isBetweenRange(this, api.timeRanges[name], evt.time);
				});
			} else if(o === 'deactivate'){
				api.timeRanges[name].active = false;
				api.timeRanges[name].entered = false;
				$(this).unbind('timechange.'+ name);
			} else {
				api.timeRanges[name].enterRanges.push(o.enter);
				api.timeRanges[name].leaveRanges.push(o.leave);
			}
			
			if(o.resort){
				api.timeRanges[name].enterRanges.sort(Numsort);
				api.timeRanges[name].leaveRanges.sort(Numsort);
			}
			
		});
	};
		
	$.fn.addTimeRange.defaults = {
		enter: false,
		leave: false,
		callback: $.noop,
		resort: false
	};
	
	
	function activateItext(){
		var jElm = $(this),
			data = jElm.data('itextData')
		;
		if(!data.id){
			data.id = jElm.attr('data-category') + jElm.attr('hreflang');
			$.ajax({
				url: this.href,
				dataType: 'text',
				success: function(srt){
					data.captions = $.parseSrt(srt);
					function captionChange(e){
						e.target = jElm[0];
						e = $.extend({}, e, {
							target: jElm[0],
							caption: data.captions[e.rangeIndex],
							type: (e.type === 'rangeenter') ? 'showCaption' : 'hideCaption'
						});
						
						jElm.triggerHandler(e.type, e);
					}
					$.each(data.captions, function(i, caption){
						
						data.parent.addTimeRange(data.id, {
							enter: caption.start,
							leave: caption.end,
							callback: captionChange
						});
					});
					
				}
			});
		}	
		data.parent.addTimeRange(data.id, 'activate');
	}
	
	function deactivateItext(){
		var jElm = $(this),
			data = jElm.data('itextData')
		;
		data.parent.addTimeRange(data.id, 'deactivate');
	}
	
	$.fn.itext = function(){
		return this.each(function(){
			var jElm 	= $(this),
				mm 		= jElm.closest('video, audio')
			;
			if(!mm[0]){return;}
			jElm
				.data('itextData', {parent: mm})
				.bind('activateItext', activateItext)
				.bind('deactivateItext', deactivateItext)
			;
		});
	};
	
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
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

// Stop JSLint whinging about globals //
/*global parseInt: true, parseSrt: true */

// SRT specification from http://forum.doom9.org/archive/index.php/t-73953.html
// but without the formatting, which is just interpreted as text

// Function to parse srt file
$.parseSrt = function(data) {
    var srt = data.replace(/\r+/g, ''); // remove dos newlines
    srt = srt.replace(/^\s+|\s+$/g, ''); // trim white space start and end
    srt = srt.replace(/<[a-zA-Z\/][^>]*>/g, ''); // remove all html tags for security reasons

    // get captions
    var captions = [];
    var caplist = srt.split('\n\n');
    for (var i = 0; i < caplist.length; i=i+1) {
        var caption = "";
        var content, start, end, s;
        caption = caplist[i];
        s = caption.split(/\n/);
        if (s[0].match(/^\d+$/) && s[1].match(/\d+:\d+:\d+/)) {
            // ignore caption number in s[0]
            // parse time string
            var m = s[1].match(/(\d+):(\d+):(\d+)(?:,(\d+))?\s*--?>\s*(\d+):(\d+):(\d+)(?:,(\d+))?/);
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
}

	
})(jQuery);
