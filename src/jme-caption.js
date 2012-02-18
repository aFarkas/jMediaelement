(function($){
	/**
	 * Added Captions Plugin.
	 * 
	 * Requires Captionator JS 0.5.1+
	 * @see http://captionatorjs.com/
	 * @author mderting
	 */
	var btnStructure = '<button class="{%class%}"><span class="jme-icon"></span><span class="jme-text">{%text%}</span></button>';
	var pseudoClasses = 'pseudoClasses';
	
	$.jme.registerPlugin('captions', {
		pseudoClasses: {
			captionsenabled: 'state-captionsenabled',
			captionsdisabled: 'state-captionsdisabled'
		},
		structure: btnStructure,
		text: 'captions on / captions off',
		_create: function(control, media, base, options){
			
			var track = media.find('track[kind="captions"]');
			 
			var textFn = $.jme.getButtonText(control, [this[pseudoClasses].captionsenabled, this[pseudoClasses].captionsdisabled]);
			
			var captionsDisplay = $('<div class="'+ $.jme.classNS +'captions-display" />').insertAfter(media);
			media.prop('captionsDisplay', captionsDisplay);
			
			// Call captionator's captionify method to add track support to this media element.
			if (!Modernizr.video){ 
				// FIXME: Currently, captionator only supports HTML5 video elements. Need to add solution for mediaelement fallback here. -mderting
			} else {
				captionator.captionify(media[0], null, {
					appendCueCanvasTo: $('video+div.captions-display')[0]
				});
			}
			
			media
				.bind('updateJMEState', function(e){
					textFn(media.prop('captionsenabled') ? 1 : 0);
				})
				.triggerHandler('updateJMEState')
			;
			/* Added bind for change event so we could use jQuery Mobile's Checkbox Control or Flip Toggle Switch -mderting */
			if (control.is('input[type="checkbox"]') || control.is('select')){
				/* control.bind('change', function(){
					media.prop('captionsenabled', !media.prop('captionsenabled'));
					// TODO: Maybe move this to captionsenabled prop so we don't repeat ourselves, since we'll need this to happen for click events too. -mderting
					var videoEl = media[0];
					var state = (videoEl.tracks[0].mode !== captionator.TextTrack.SHOWING) ? captionator.TextTrack.SHOWING : captionator.TextTrack.HIDDEN;
					videoEl.tracks[0].mode = state;
					return false;
				}); */
				control.bind('click', function(){
					media.prop('captionsenabled', !media.prop('captionsenabled'));
					/* TODO: Maybe move this to captionsenabled prop so we don't repeat ourselves, since we'll need this to happen for click events too. -mderting */
					var videoEl = media[0];
					var state = (videoEl.tracks[0].mode !== captionator.TextTrack.SHOWING) ? captionator.TextTrack.SHOWING : captionator.TextTrack.HIDDEN;
					videoEl.tracks[0].mode = state;
					// Don't return false here so JQM has a chance to handle the event. -mderting
				});
			} else {
				control.bind('click', function(){
					media.prop('captionsenabled', !media.prop('captionsenabled'));
					return false;
				});
			}
			
		}
		
	});

	/**
	 * TODO: Need to hook this up. Currently unused. -mderting
	 */
	$.jme.defineProp('captionsenabled', {
		get: function(elem){
			return (!$.prop(elem, 'captionsenabled'));
		},
		readonly: true
	});

	/**
	 * TODO: Need to hook this up. Currently unused. -mderting
	 */
	$.jme.defineProp('lang', {
		set: function(elem, value){
			var data = $.jme.data(elem);
			data.lang = !!value;
			$(elem).triggerHandler('captionsupdate');
			data.player.triggerHandler('captionsupdate');
			return 'noDataSet';
		}
	});

})(jQuery);