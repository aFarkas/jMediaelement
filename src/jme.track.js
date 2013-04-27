(function (factory) {
	var $ = window.jQuery;
	if($.jme){
		factory($);
	} else {
		$(window).on('jmepluginready', function(){
			factory($);
		});
	}
	
}(function($){
	var btnStructure = '<button class="{%class%}"><span class="jme-icon"></span><span class="jme-text">{%text%}</span></button>';
	var pseudoClasses = 'pseudoClasses';
	/**
	 * Added captions Plugin
	 * @author mderting
	 */
	
	$.jme.ButtonMenu = function(button, menu, clickHandler){
		
		this.button = $(button).attr({'aria-haspopup': 'true'});
		
		this.clickHandler = clickHandler;
		
		this.toggle = $.proxy(this, 'toggle');
		this.keyIndex = $.proxy(this, 'keyIndex');
		this._buttonClick = $.proxy(this, '_buttonClick');
		
		
		this.addMenu(menu);
		this._closeFocusOut();
		this.button.bind('click', this.toggle);
		
	};
	
	$.jme.ButtonMenu.prototype = {
		addMenu: function(menu){
			if(this.menu){
				this.menu.remove();
			}
			this.menu = $(menu);
			this.buttons = $('button', this.menu);
			this.menu.insertAfter(this.button);
			this.menu
				.bind('keydown', this.keyIndex)
				.delegate('button', 'click', this._buttonClick)
			;
		},
		_closeFocusOut: function(){
			var that  = this;
			var timer;
			var stopFocusOut = function(){
					clearTimeout(timer);
					setTimeout(function(){
						clearTimeout(timer);
					}, 9);
				};
			this.menu
				.parent()
				.bind('focusin', stopFocusOut)
				.bind('mousedown', stopFocusOut)
				.bind('focusout', function(e){
					timer = setTimeout(function(){
						that.hide();
					}, 40);
				})
			;
		},
		_buttonClick: function(e){
			this.clickHandler(this.buttons.index(e.currentTarget), e.currentTarget);
			this.hide();
		},
		keyIndex: function(e){
			var dir = (e.keyCode == 40) ? 1 : (e.keyCode == 38) ? -1 : 0;
			if(dir){
				var buttons = this.buttons.not(':disabled');
				var activeButton = buttons.filter(':focus');
				
				activeButton = buttons[buttons.index(activeButton) + dir] || buttons.filter(dir > 0 ? ':first' : ':last');
				activeButton.focus();
				e.preventDefault();
			}
		},
		show: function(){
			if(this.isVisible){return;}
			var buttons = this.buttons.not(':disabled');
			this.isVisible = true;
			this.menu.addClass('visible-menu');
			try {
				this.activeElement = document.activeElement || this.button[0];
			} catch(er){
				this.activeElement = this.button[0];
			}
			
			setTimeout(function(){
				$(buttons.filter('[aria-checked="true"]')[0] || buttons[0]).focus();
			}, 60);
		},
		toggle: function(){
			this[this.isVisible ? 'hide' : 'show']();
		},
		hide: function(){
			if(!this.isVisible){return;}
			this.isVisible = false;
			this.menu.removeClass('visible-menu');
			if(this.activeElement){
				try {
					this.activeElement.focus();
				} catch(er){}
			}
			this.activeElement = false;
		}
	};
	
	var showKinds = {subtitles: 1, caption: 1};
	var getTrackMenu = function(tracks){
		var items = $.map(tracks, function(track){
				var className = (track.kind == 'caption') ? 'caption-type' : 'subtitle-type';
				var lang = track.language;
				lang = (lang) ? ' <span class="track-lang">'+ lang +'</span>' : '';
				return '<li class="'+ className +'" role="presentation"><button role="menuitemcheckbox">'+ track.label + lang +'</button></li>';
			})
		;
		return '<div><ul>' + items.join('') +'</ul></div>';
	};
	
	
	$.jme.registerPlugin('captions', {
		pseudoClasses: {
			enabled: 'state-captionsenabled',
			disabled: 'state-captionsdisabled',
			noTrack: 'no-track',
			hasTrack: 'has-track',
			menu: 'subtitle-menu'
		},
		structure: btnStructure,
		text: 'subtitles menu',
		_create: function(control, media, base, options){
			var that = this;
			
			var trackElems = media.find('track');
			var btnTextElem = $('span.jme-text, +label span.jme-text', control);
			if(!btnTextElem[0]){
				btnTextElem = control;
			}
			btnTextElem.html(that.text);
			if(!trackElems.length){
				control.prop('disabled', true);
				base.addClass(that[pseudoClasses].noTrack);
			} else {
				base.addClass(that[pseudoClasses].hasTrack);
			}
			
			
			$.webshims.ready('track', function(){
				var menuObj;
				var tracks = [];
				var textTracks = media.prop('textTracks');
				var throttledUpdate = (function(){
					var timer;
					var triggerTimer;
					return function(e){
						clearTimeout(timer);
						clearTimeout(triggerTimer);
						if(e.type == 'updatesubtitlestate'){
							triggerTimer = setTimeout(function(){
								media.trigger('updatetracklist');
							}, 0);
						}
						timer = setTimeout(updateTrackMenu, 19);
					};
				})();
				
				function createSubtitleMenu(menu){
					if(!menuObj){
						menuObj = new $.jme.ButtonMenu(control, menu, function(index, button){
							if($.attr(button, 'aria-checked') == 'true'){
								tracks[index].mode = 'disabled';
							} else {
								$.each(tracks, function(i, track){
									track.mode = (i == index) ? 'showing' : 'disabled';
								});
							}
							media.prop('textTracks');
							updateMode();
						});
					} else {
						menuObj.addMenu(menu);
					}
					
					updateMode();
				}
				
				function updateMode(){
					$('button', menuObj.menu).each(function(i){
						$.attr(this, 'aria-checked', (tracks[i].mode == 'showing') ? 'true' : 'false');
					});
				}
				
				function updateTrackMenu(){
					tracks = [];
					$.each(textTracks, function(i, track){
						if(showKinds[track.kind] && track.readyState != 3){
							tracks.push(track);
						}
					});
					if(tracks.length){
						createSubtitleMenu('<div class="'+that[pseudoClasses].menu +'" >'+ (getTrackMenu(tracks)) +'</div>');
						if(!base.hasClass(that[pseudoClasses].hasTrack) || base.hasClass(that[pseudoClasses].noTrack)){
							control.prop('disabled', false);
							base
								.addClass(that[pseudoClasses].hasTrack)
								.removeClass(that[pseudoClasses].noTrack)
								.triggerHandler('controlschanged')
							;
						}
					} else if(!base.hasClass(that[pseudoClasses].noTrack) || base.hasClass(that[pseudoClasses].hasTrack)){
						control.prop('disabled', true);
						base
							.addClass(that[pseudoClasses].noTrack)
							.removeClass(that[pseudoClasses].hasTrack)
							.triggerHandler('controlschanged')
						;
					}
				}
				if(!textTracks){
					textTracks = [];
					updateTrackMenu();
				} else {
					updateTrackMenu();
					$([textTracks]).on('addtrack removetrack', throttledUpdate);
					base.bind('updatesubtitlestate', throttledUpdate);
					media.bind('updatetrackdisplay', (function(){
						var timer;
						return function(){
							clearTimeout(timer);
							timer = setTimeout(updateMode, 20);
						};
					})());
				}
				
			});
			
		}
		
	});
}));
