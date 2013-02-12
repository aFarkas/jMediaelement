(function($){
	var btnStructure = '<button class="{%class%}"><span class="jme-icon"></span><span class="jme-text">{%text%}</span></button>';
	var pseudoClasses = 'pseudoClasses';
	
	//taken from http://johndyer.name/native-fullscreen-javascript-api-plus-jquery-plugin/
	$.jme.fullscreen = (function() {
		var parentData;
		var frameData;
		var doc = document.documentElement;
		
		var fullScreenApi = {
			supportsFullScreen: Modernizr.prefixed('fullscreenEnabled', document, false) || Modernizr.prefixed('fullScreenEnabled', document, false),
			isFullScreen: function() { return false; },
			requestFullScreen: function(elem){
				var tmpData;
				parentData = [];
				$(elem).parentsUntil('body').each(function(){
					var pos =  $.css(this, 'position');
					var left = this.scrollLeft;
					var top = this.scrollTop;
					var changed;
					tmpData = {elemStyle: this.style, elem: this};
					if(pos !== 'static'){
						changed = true;
						tmpData.pos = tmpData.elemStyle.position;
						this.style.position = 'static';
					}
					if(left){
						changed = true;
						tmpData.left = left;
					}
					if(top){
						changed = true;
						tmpData.top = top;
					}
					if(changed){
						parentData.push(tmpData);
					}
				});
				frameData = false;
				try {
					frameData = {elemStyle: frameElement.style, elem: frameElement, css: {}};
					frameData.css.position = frameData.elemStyle.position;
					frameData.elemStyle.position = 'fixed';
					$.each(['top', 'left', 'right', 'bottom'], function(i, name){
						frameData.css[name] = frameData.elemStyle[name];
						frameData.elemStyle[name] = '0px';
					});
					$.each(['height', 'width'], function(i, name){
						frameData.css[name] = frameData.elemStyle[name];
						frameData.elemStyle[name] = '100%';
					});
				} catch(er){
					frameData = false;
				}
				
				tmpData = null;
			},
			cancelFullScreen: function(){
				if(parentData){
					$.each(parentData, function(i, data){
						if('pos' in data){
							data.elemStyle.position = data.pos;
						}
						if(data.left){
							data.elem.scrollLeft = data.left;
						}
						if(data.top){
							data.elem.scrollTop = data.top;
						}
						data = null;
					});
					parentData = [];
				}
				if(frameData){
					$.each(frameData.css, function(name, value){
						frameData.elemStyle[name] = value;
					});
					frameData = false;
				}
			},
			eventName: 'fullscreenchange',
			exitName: 'exitFullscreen',
			requestName: 'requestFullscreen',
			elementName: 'fullscreenElement',
			enabledName: ''
		};
		
		fullScreenApi.cancelFullWindow = fullScreenApi.cancelFullScreen;
		fullScreenApi.requestFullWindow = fullScreenApi.requestFullScreen;

		// update methods to do something useful
		if (fullScreenApi.supportsFullScreen) {
			fullScreenApi.enabledName = fullScreenApi.supportsFullScreen;
			fullScreenApi.exitName = Modernizr.prefixed("exitFullscreen", document, false) || Modernizr.prefixed("cancelFullScreen", document, false);
			fullScreenApi.elementName = Modernizr.prefixed("fullscreenElement", document, false) || Modernizr.prefixed("fullScreenElement", document, false);
			fullScreenApi.supportsFullScreen = !!fullScreenApi.supportsFullScreen;
			if(fullScreenApi.elementName != 'fullscreenElement' || fullScreenApi.exitName != 'exitFullscreen' || fullScreenApi.enabledName != 'fullscreenEnabled'){
				$.each(Modernizr._domPrefixes, function(i, prefix){
					var requestName = prefix+'RequestFullscreen';
					if((requestName in doc) || ((requestName = prefix+'RequestFullScreen') && (requestName in doc))){
						fullScreenApi.eventName = prefix + 'fullscreenchange';
						fullScreenApi.requestName = requestName;
						return false;
					}
				});
			}
			
			fullScreenApi.isFullScreen = function() {
				return document[fullScreenApi.elementName];
			};
			fullScreenApi.requestFullScreen = function(el) {
				return el[fullScreenApi.requestName]();
			};
			fullScreenApi.cancelFullScreen = function() {
				return document[fullScreenApi.exitName]();
			};
		}
		
		if(!window.Modernizr || !('fullscreen' in Modernizr)){
			$('html').addClass(fullScreenApi.supportsFullScreen ? 'fullscreen' : 'no-fullscreen');
		}
		
		if(!fullScreenApi.supportsFullScreen && window.parent != window){
			(function(){
				try{
					var a = window.frameElement.style;
				} catch(er){
					$('html').addClass('no-fullwindow');
				}
			})();
			
		}
		

		return fullScreenApi;
	})();
	
	$.jme.defineProp('fullscreen', {
		set: function(elem, value){
			var data = $.jme.data(elem);
			
			if(!data || !data.player){return 'noDataSet';}
			if(value){
				if(data.player.hasClass($.jme.classNS+'player-fullscreen')){return 'noDataSet';}

				data.scrollPos = {
					top: $(window).scrollTop(),
					left: $(window).scrollLeft()
				};

				$(document)
					.unbind('.jmefullscreen')
					.bind('keydown.jmefullscreen', function(e){
						if(e.keyCode == 27){
							data.player.jmeProp('fullscreen', false);
							return false;
						}
						if(e.keyCode === 32 && !('form' in e.target)){
							data.media.jmeFn('togglePlay');
							return false;
						}
					})
				;
				
				
				if(value == 'fullwindow'){
					$.jme.fullscreen.requestFullWindow(data.player[0]);
				} else {
					try {
						$.jme.fullscreen.requestFullScreen(data.player[0]);
					} catch(er){}
				}

				
				$('html').addClass($.jme.classNS+'has-media-fullscreen');

				data.player.addClass($.jme.classNS+'player-fullscreen');

				data.media.addClass($.jme.classNS+'media-fullscreen');
				
				$('.jme-default-control-bar', data.player).focus();

				if($.jme.fullscreen.supportsFullScreen){
					$(document)
						.bind($.jme.fullscreen.eventName+'.jmefullscreen', function(e){
							var fullScreenElem = $.jme.fullscreen.isFullScreen();
							if(fullScreenElem && elem == fullScreenElem){
								$(elem).triggerHandler('playerdimensionchange', ['fullscreen']);
							} else {
								data.player.jmeProp('fullscreen', false);
							}
						})
					;

				}
				data.player.triggerHandler('playerdimensionchange', ['fullwindow']);
				
			} else {
				if(!data.player.hasClass($.jme.classNS+'player-fullscreen')){return 'noDataSet';}
				$(document).unbind('.jmefullscreen');
				$('html').removeClass($.jme.classNS+'has-media-fullscreen');
				data.player.removeClass($.jme.classNS+'player-fullscreen');
				data.media.removeClass($.jme.classNS+'media-fullscreen');
				if($.jme.fullscreen.isFullScreen()){
					try {
						$.jme.fullscreen.cancelFullScreen();
					} catch(er){}
				} else {
					$.jme.fullscreen.cancelFullWindow();
				}


				data.player.triggerHandler('playerdimensionchange');
				if(data.scrollPos){
					$(window).scrollTop(data.scrollPos.top);
					$(window).scrollLeft(data.scrollPos.left);
					delete data.scrollPos;
				}
			}
			return 'noDataSet';
		},
		get: function(elem){
			var data = $.jme.data(elem);
			if(!data || !data.player){return;}
			var fs = data.player.hasClass($.jme.classNS+'player-fullscreen');
			if(!fs){return false;}
			return $.jme.fullscreen.isFullScreen() || 'fullwindow';
		}
	});
	
	$.jme.defineProp('autoplayfs');

	$.jme.registerPlugin('fullscreen', {
		pseudoClasses: {
			enter: 'state-enterfullscreen',
			exit: 'state-exitfullscreen'
		},
		options: {
			fullscreen: true,
			autoplayfs: false
		},
		structure: btnStructure,
		text: 'enter fullscreen / exit fullscreen',
		_create: function(control, media, base){
			var textFn = $.jme.getButtonText(control, [this[pseudoClasses].enter, this[pseudoClasses].exit]);
			var updateControl = function(){
				textFn(base.hasClass($.jme.classNS+'player-fullscreen') ? 1 : 0);
			};
			var options = this.options;
			var addDoubbleClick = function(){
				$(base.data('jme').controlElements)
					.filter('.jme-default-media-overlay')
					.off('.dblfullscreen')
					.on('dblclick.dblfullscreen', function(e){
						base.jmeProp('fullscreen', !base.jmeProp('fullscreen'));
					})
				;
			};
			
			base.on('controlsadded', addDoubbleClick);
			
			base.bind('playerdimensionchange', updateControl);
			
			control.bind((control.is('select')) ? 'change' : 'click', function(){
				var value = base.hasClass($.jme.classNS+'player-fullscreen') ? false : options.fullscreen;
				base.jmeProp('fullscreen', value);
				if(value && options.autoplayfs){
					media.jmeFn('play');
				}
			});
			addDoubbleClick();
			updateControl();
		}
	});
})(jQuery);
