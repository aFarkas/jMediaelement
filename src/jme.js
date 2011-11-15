(function($){
	$.webshims = $.webshims || {
		ready: function(type, fn){
			setTimeout(fn, 0);
		},
		addReady: function(fn){
			$(function(){
				fn(document, $([]));
			});
		},
		mediaelement: {}
	};
	var webshims = $.webshims;
	
	if(!window.Modernizr || !('opacity' in Modernizr)){
		$('html').addClass($.support.opacity ? 'opacity' : 'no-opacity');
	}
	
	if(!$.fn.callProp){
		$.fn.callProp  = function(prop, args){
			var ret;
			if(!args){
				args = []; 
			}
			this.each(function(){
				var fn = $.prop(this, prop);
				
				if (fn && fn.apply) {
					ret = fn.apply(this, args);
					if (ret !== undefined) {
						return false;
					}
				}
			});
			return (ret !== undefined) ? ret : this;
		};
	}
	
	
	
	var mediaelement = webshims.mediaelement;
	
	
	var props = {};
	
	var fns = {};
	
	
	
	$.jme = {
		classNS: '',
		options: {},
		plugins: {},
		data: function(elem, name, value){
			var data = $(elem).data(ns+'jme') || $.data(elem, ns+'jme', {});
			if(value === undefined){
				return (name) ? data[name] : data;
			} else {
				data[name] = value;
			}
		},
		registerPlugin: function(name, plugin){
			this.plugins[name] = plugin;
			if(!plugin.nodeName){
				plugin.nodeName = '';
			}
			if(!plugin.className){
				plugin.className = name;
			}
		},
		defineMethod: function(name, fn){
			fns[name] = fn;
		},
		defineProp: function(name, desc){
			if(!desc.set){
				if(desc.readonly){
					desc.set = function(){
						throw(name +' is readonly');
					};
				} else {
					desc.set = $.noop;
				}
			}
			if(!desc.get){
				desc.get = function(elem){
					return $.jme.data(elem, name);
				};
			}
			props[name] = desc;
		},
		prop: function(elem, name, value){
			if(value === undefined){
				return props[name].get( elem );
			} else {
				var setValue = props[name].set(elem, value);
				if(setValue === undefined){
					setValue = value;
				}
				if(setValue != 'noDataSet'){
					$.jme.data(elem, name, setValue);
				}
			}
		}
	};
	
	$.fn.jmeProp = function(name, value){
		return $.access( this, name, value, true, $.jme.prop );
	};
	
	$.fn.jmeFn = function(fn){
		
		var args = Array.prototype.slice.call( arguments, 1 );
		var ret;
		this.each(function(){
			ret = fns[fn].apply(this, args);
			if(ret !== undefined){
				return false;
			}
		});
		return (ret !== undefined) ? ret : this;
	};
	
	
	
	var baseSelector;
	var pluginSelectors = [];
	var ns = '';
	var createSelectors = function(){
		if(baseSelector){return;}
		ns = $.jme.classNS;
		baseSelector = 'div.'+ns+ 'mediaplayer';
		$.each($.jme.plugins, function(name, plugin){
			plugin.className = ns + plugin.className;
			plugin.selector = plugin.nodeName +'.'+plugin.className;
			pluginSelectors.push(plugin.selector);
			if(ns && plugin.pseudoClasses){
				$.each(plugin.pseudoClasses, function(stateName, stateValue){
					plugin.pseudoClasses[stateName] = ns+stateValue;
				});
			}
			
		});
		pluginSelectors = pluginSelectors.join(',');
	};
	
	var idlStates = {
		emptied: 1,
		pause: 1
	};
	
	$.jme.getDOMList = function(attr){
		var list = [];
		if(!attr){
			attr = [];
		}
		if(typeof attr == 'string'){
			attr = attr.split(' ');
		}
		$.each(attr, function(i, id){
			if(id){
				id = document.getElementById(id);
				if(id){
					list.push(id);
				}
			}
		});
		return list;
	};
	
	$.jme.getButtonText = function(button, classes){
		var btnTextElem = $('span.jme-text', button);
		if(!btnTextElem[0]){
			btnTextElem = button;
		}
		var txt = btnTextElem.text().split('/');
		var title = button.prop('title').split('/');
		var doText;
		var doTitle;
		var lastState;
		if(txt.length == 2){
			txt[0] = txt[0].trim();
			txt[1] = txt[1].trim();
			doText = true;
		}
		if(title.length == 2){
			title[0] = title[0].trim();
			title[1] = title[1].trim();
			doTitle = true;
		}
		return function(state){
			if(lastState === state){return;}
			lastState = state;
			if(doText){
				btnTextElem.text(txt[state || 0]);
			}
			if(doTitle){
				button.prop('title', txt[state || 0]);
			}
			if(classes){
				button
					.removeClass(classes[(state) ? 0 : 1])
					.addClass(classes[state])
				;
			}
		};
	};
	
	$.fn.jmePlayer = function(opts){
		var removeClasses = ['idle', 'playing', 'ended', 'waiting', 'mediaerror'].map(function(state){
			return ns+'state-'+state;
		}).join(' ');
		return this.each(function(){
			if(opts){
				$.jme.data(this, $.extend(true, {}, opts));
			}
			var media = $('audio, video', this).filter(':first');
			var base = $(this);
			var insideControls = $(pluginSelectors, base);
			var externalControls = $.jme.getDOMList( $.jme.data(this, 'controls') );
			var controls = insideControls.add($(externalControls));
			var jmeData = $.jme.data(this);
			var mediaData = $.jme.data(media[0]);
			var init;
			mediaData.player = base;
			if(!jmeData.media){
				init = true;
				jmeData.media = media;
				media
					.bind('emptied waiting playing ended pause updateJMEState mediaerror', function(e){
						var state = e.type;
						var readyState;
						var paused;
						if(state == 'updateJMEState'){
							if($.prop(this, 'ended')){
								state = 'ended';
							} else {
								readyState = $.prop(this, 'readyState');
								paused = $.prop(this, 'paused');
								if(!paused && readyState < 3){
									state = 'waiting';
								} else if(!paused && readyState > 2){
									state = 'playing';
								} else {
									state = 'idle';
								}
							}
						}
						if(idlStates[state]){
							state = 'idle';
						}
						 
						base.removeClass(removeClasses).addClass(ns +'state-'+ state);
					})
					.triggerHandler('updateJMEState')
				;
				var focusenterTimer;
				var foverTimer;
				base
					.bind('useractive', function(){
						base.addClass(ns+'useractive');
					})
					.bind('userinactive', {idletime: 3500}, function(){
						base.removeClass(ns+'useractive');
					})
					.bind('focusin', function(){
						clearTimeout(focusenterTimer);
						base.addClass(ns+'focusenter');
					})
					.bind('focusout', function(){
						clearTimeout(focusenterTimer);
						focusenterTimer = setTimeout(function(){
							base.removeClass(ns+'focusenter');
						}, 1);
					})
					
					.bind('mouseenter focusin', function(){
						clearTimeout(foverTimer);
						base.addClass(ns+'fover');
					})
					.bind('mouseleave focusout', function(){
						clearTimeout(foverTimer);
						foverTimer = setTimeout(function(){
							base.removeClass(ns+'fover');
						}, 1);
					})
				;
			}
			base.jmeFn('addControls', controls);
			if(init && jmeData.controlbar){
				base.jmeProp('controlbar', true);
			}
		});
	};
	
	
	$.jme.defineProp('isPlaying', {
		get: function(elem){
			return (!$.prop(elem, 'ended') && !$.prop(elem, 'paused') && $.prop(elem, 'readyState') > 1 && !$.data(elem, 'mediaerror'));
		},
		readonly: true
	});
	
	$.jme.defineProp('player', {
		get: function(elem){
			return $.jme.data(this, 'player') || null;
		},
		readonly: true
	});
	
	$.jme.defineProp('media', {
		get: function(elem){
			return $.jme.data(this, 'media') || null;
		},
		readonly: true
	});
	
	$.jme.defineProp('srces', {
		get: function(elem){
			var srces = mediaelement.srces(elem);
			srces.forEach(function(src){
				delete src.elem;
				delete src.container;
				delete src.srcProp;
			});
			return srces;
		},
		set: function(elem, srces){
			mediaelement.srces(elem, srces);
			return 'noDataSet';
		}
	});
	$.jme.defineMethod('togglePlay', function(){
		$(this).callProp( ( props.isPlaying.get(this) ) ? 'pause' : 'play' );
	});
	
	
	$.jme.defineProp('controlbar', {
		set: function(elem, value){
			value = !!value;
			var controlBar = $('div.jme-default-media-overlay, div.jme-default-control-bar', elem);
			var data = $.jme.data(elem);
			var mediaControls = $.jme.plugins["media-controls"] ;
			var structure = '';
			var controls;
			if(value && !controlBar[0]){
				if(data._controlbar){
					data._controlbar.appendTo(elem);
				} else {
					data.media.prop('controls', false);
					$.each(mediaControls.pluginOrder, function(i, name){
						
						var plugin = $.jme.plugins[name];
						if(plugin && plugin.structure){
							structure += plugin.structure.replace('{%class%}', ns+name).replace('{%text%}', plugin.text || '');
						} else if(name && name.indexOf('<') != -1){
							structure += name;
						}
					});
					data._controlbar = $( mediaControls.barStructure );
					controlBar = data._controlbar.find('div.jme-cb-box').addClass(ns+'media-controls');
					controls = data._controlbar.filter('div.jme-default-media-overlay').addClass(ns+'play-pause');
					controls =  controls.add(  controlBar );
					controls = controls.add( $(structure).appendTo(controlBar) );
					data._controlbar.appendTo(elem);
					$(elem).jmeFn('addControls', controls);
				}
				
			} else if(!value) {
				controlBar.detach();
			}
			controlBar = null;
			controls = null;
			return value;
		}
	});
	
	$.jme.defineMethod('addControls', function(controls){
		var media = $.jme.data(this, 'media', media);
		var base = $(this);
		if(!media){return;}
		controls = $(controls);
		$.each($.jme.plugins, function(name, plugin){
			controls
				.filter('.'+plugin.className)
				.add(controls.find('.'+plugin.className))
				.each(function(){
					var control = $(this);
					var options = $.jme.data(this);
					options.player = base;
					options.media = media;
					if(options.rendered){return;}
					options.rendered = true;
					if(plugin.options){
						$.each(plugin.options, function(option, value){
							if(!(option in options)){
								options[option] = value;
							}
						});
					}
					plugin._create(control, media, base, options);
					control = null;
				})
			;
		});
		base.triggerHandler('controlsadded');
	});
	
	
	
	$.jme.defineMethod('updateControlbar', function(){
		
		
		var timeSlider = $('.'+ $.jme.classNS +'time-slider', this);
		var width = timeSlider.parent().width();
		var elemWidths = 0; 
		timeSlider.siblings()
			.each(function(){
				if(this !== timeSlider[0] && $.css(this, 'position') !== 'absolute'){
					elemWidths += $(this).outerWidth(true);
				}
			})
		;
		timeSlider.width(width - elemWidths - (timeSlider.outerWidth(true) - timeSlider.width()) - 1);
	});
	
	$.jme.registerPlugin('media-controls', {
		pluginOrder: ['play-pause', '<div class="media-bar">', 'currenttime-display', 'time-slider', 'duration-display', '<div class="volume-controls">', 'mute-unmute', 'volume-slider', '</div>', 'fullscreen', '</div>'],
		barStructure: '<div class="jme-default-media-overlay"></div><div class="jme-default-control-bar"><div class="jme-cb-box"></div></div>',
		_create: function(control, media, base, options){
			var timer;
			var update = function(){
				clearTimeout(timer);
				control.jmeFn('updateControlbar');
				timer = setTimeout(function(){
					control.jmeFn('updateControlbar');
				}, 9);
			};
			setTimeout(function(){
				media.bind('loadedmetadata volumechange play pause ended emptied', update);
				base.bind('updatetimeformat controlsadded playerdimensionchange', update);
			}, 1);
			update();
		}
	});
	
	
	(function(){
		var activity = {
			add: function(elem, cfg, name){
				var data 		= $.data(elem, 'jmeuseractivity') || $.data(elem, 'jmeuseractivity', {idletime: 2500, idle: true, trigger: {}}),
					jElm 		= $(elem),
					setInactive = function(){
						if(!data.idle){
							data.idle = true;
							if ( data.trigger.userinactive ) {
								jElm.trigger('userinactive');
							}
						}
					},
					x, y,
					setActive 	= function(e){
						if(!e || (e.type === 'mousemove' && e.pageX === x && e.pageY === y)){return;}
						if(e.type === 'mousemove'){
							 x = e.pageX;
							 y = e.pageY;
						}
						if(data.idleTimer){
							clearTimeout(data.idleTimer);
						}
						data.idleTimer = setTimeout(setInactive, data.idletime);
						if(data.idle){
							data.idle = false;
							if( data.trigger.useractive ){
								jElm.trigger('useractive');
							}
						}
					}
				;
				
				data.idletime = (cfg || {}).idletime || data.idletime;
				if(cfg && 'idle' in cfg){
					data.idle = cfg.idle;
				}
				data.trigger[name] = true;
				
				if( !data.bound ){
					jElm
						.bind('mouseleave.jmeuseractivity', setInactive)
						.bind('mousemove.jmeuseractivity focusin.jmeuseractivity mouseenter.jmeuseractivity keydown.jmeuseractivity keyup.jmeuseractivity mousedown.jmeuseractivity', setActive)
					;
					data.bound = true;
				}
				if(!data.idle){
					setActive({type: 'initunidled'});
				}
			},
			remove: function(elem, name){
				var data = $.data(elem, 'jmeuseractivity') || $.data(elem, 'jmeuseractivity', {idletime: 2500, idle: true, trigger: {}});
				data.trigger[name] = false;
				if(!data.trigger.useractive && !data.trigger.userinactive){
					$(elem).unbind('.jmeuseractivity');
					data.bound = false;
				}
			}
		};
		$.each(['useractive', 'userinactive'], function(i, name){
			$.event.special[name] = {
				setup: function(cfg){
					activity.add(this, cfg, name);
				},
				teardown: function(){
					activity.remove(this, name);
				}
			};
		});
	})();
	
	var initJME = function(context, insertedElement){
		$('video, audio', context)
			.add(insertedElement.filter('video, audio'))
			.filter('[data-muted]')
			.each(function(){
				$.prop(this, 'muted', true);
			})
			.end()
			.filter('[data-volume]')
			.each(function(){
				var defaultVolume = $(this).data('volume');
				if(defaultVolume <= 1 && defaultVolume >= 0){
					$.prop(this, 'volume', defaultVolume);
				}
			})
		;
		
		$(baseSelector, context).add(insertedElement.filter(baseSelector)).jmePlayer();
	};
	
	$(function(){
		createSelectors();
		initJME(document, $([]));
	});
	webshims.ready('mediaelement', function(){
		webshims.addReady(function(context, insertedElement){
			if(context !== document){
				initJME(context, insertedElement);
			}
		});
	});
	
})(jQuery);
(function($){
	var pseudoClasses = 'pseudoClasses';
	
	var playStates = {
		play: 1,
		playing: 1
	};
	
		
	var loadJqueryUI = function(){
		if($.webshims.loader){
			$.webshims.loader.loadList(['jquery-ui']);
			if($.webshims.modules['input-widgets'].src){
				$.webshims.loader.loadList(['input-widgets']);
			}
		}
	};
	var btnStructure = '<button class="{%class%}"><span class="jme-icon"></span><span class="jme-text">{%text%}</span></button>';
	var defaultStructure = '<div  class="{%class%}"></div>';
	$.jme.registerPlugin('play-pause', {
		pseudoClasses: {
			play: 'state-paused',
			pause: 'state-playing'
		},
		structure: btnStructure,
		text: 'play / pause',
		_create: function(control, media, base){
			var textFn = $.jme.getButtonText(control, [this[pseudoClasses].play, this[pseudoClasses].pause]);
			media
				.bind('play playing ended pause updateJMEState', function(e){
					var state = e.type;
					if(state == 'updateJMEState'){
						state = (media.jmeProp('isPlaying') )? 1 : 0;
					} else if(playStates[state]){
						state = 1;
					} else {
						state = 0;
					}
					textFn(state);
				})
				.triggerHandler('updateJMEState')
			;
			control.bind('click', function(){
				media.jmeFn('togglePlay');
				return false;
			});
		}
	});
	
	$.jme.registerPlugin('mute-unmute', {
		pseudoClasses: {
			mute: 'state-mute',
			unmute: 'state-unmute'
		},
		structure: btnStructure,
		text: 'mute / unmute',
		_create: function(control, media, base){
			var textFn = $.jme.getButtonText(control, [this[pseudoClasses].mute, this[pseudoClasses].unmute]);
			media
				.bind('volumechange updateJMEState', function(e){
					textFn(media.prop('muted') ? 1 : 0);
				})
				.triggerHandler('updateJMEState')
			;
			control.bind('click', function(){
				media.prop('muted', !media.prop('muted'));
				return false;
			});
		}
	});
	
	var onSliderReady = function(fn){
		$.webshims.ready('jquery-ui', function(){
			if(!$.fn.slider){
				$.webshims.ready('input-widgets', function(){
					if($.fn.slider){
						fn();
					}
				});
			} else {
				fn();
			}
		});
	};
	
	function createGetSetHandler(get, set){
		var throttleTimer;
		var blockedTimer;
		var blocked;
		return {
			get: function(){
				if(blocked){return;}
				return get.apply(this, arguments);
			},
			set: function(){
				clearTimeout(throttleTimer);
				clearTimeout(blockedTimer);
				
				var that = this;
				var args = arguments;
				blocked = true;
				throttleTimer = setTimeout(function(){
					set.apply(that, args);
					blockedTimer = setTimeout(function(){
						blocked = false;
					}, 30);
				}, 0);
			}
		};
	}
	
	$.jme.registerPlugin('volume-slider', {
		structure: defaultStructure,
		_create: function(control, media, base){
			loadJqueryUI();
			var volume = createGetSetHandler(
				function(){
					var volume = media.prop('volume');
					if(volume !== undefined){
						control.slider('value', volume);
					}
				},
				function(value){
					media.prop({
						muted: false,
						volume: value
					});
				}
			);
			var createFn = function(){
				control.slider({
					range: 'min',
					max: 1,
					step: 0.05,
					value: media.prop('volume'),
					slide: function(e, data){
						if(e.originalEvent){
							volume.set(data.value);
						}
					}
				});
				media.bind('volumechange', volume.get);
			};
			
			onSliderReady(createFn);
		}
	});
	
	$.jme.registerPlugin('time-slider', {
		structure: defaultStructure,
		options: {
			format: ['mm', 'ss']
		},
		_create: function(control, media, base){
			loadJqueryUI();
			var time = createGetSetHandler(
				function(){
					var time = media.prop('currentTime');
					if(!isNaN(time)){
						control.slider('value', time);
					}
				},
				function(value){
					try {
						media.prop('currentTime', value);
					} catch(er){}
				}
			);
			var createFn = function(){
				var duration = media.prop('duration');
				control.slider({
					range: 'min',
					max: duration || 1,
					disabled: !duration,
					step: 0.1,
					value: media.prop('currentTime'),
					slide: function(e, data){
						if(e.originalEvent){
							time.set(data.value);
						}
					}
				});
				media.bind({
					timeupdate: time.get,
					emptied: function(){
						control.slider('option', 'disabled', true);
					},
					durationchange: function(){
						control
							.slider('option', 'disabled', false)
							.slider('option', 'max', media.prop('duration'))
						;
					}
				});
			};
			base.jmeFn('addControls', $('<div class="'+ $.jme.classNS +'buffer-progress" />').prependTo(control) );
			onSliderReady(createFn);
		}
	});
	
	
	$.jme.defineMethod('concerningRange', function(type, time){
		var elem = this;
		var ret = {start: 0, end: 0};
		if(!type){
			type = 'buffered';
		}
		type = $.prop(elem, type);
		
		if(time == null){
			time = $.prop(elem, 'currentTime');
		}
		if(!type || !('length' in type)){return ret;}
		for(var i = 0, len = type.length; i < len; i++){
			ret.start = type.start(i);
			ret.end = type.end(i);
			if(ret.start <= time && ret.end >= time){
				
				break;
			}
		}
		return ret;
	});
	
	$.jme.defineProp('progress', {
		get: function(elem){
			return ($.jme.data(elem) || {}).progress || 0;
		},
		readonly: true
	});
	
	$.jme.registerPlugin('buffer-progress', {
		_create: function(control, media, base, options){
			var indicator = $('<div class="'+ $.jme.classNS +'buffer-progress-indicator" />').appendTo(control);
			var drawBufferProgress = function(){
				var progress = media.jmeFn('concerningRange').end / media.prop('duration') * 100;
				if(progress > 99.4){
					progress = 100;
				}
				
				if(options.progress !== progress){
					options.progress = progress;
					indicator.css('width', progress +'%');
				}
			};
			media.bind({
				progress: drawBufferProgress,
				emptied: function(){
					indicator.css('width', 0);
					options.progress = 0;
				},
				playing: drawBufferProgress
			});
			drawBufferProgress();
		}
	});
	
	var times = {
		hh: 60000,
		mm: 60,
		ss: 1,
		ms: 1/1000
	};
	var formatTime = function(sec, format){
		if(!format){
			format = ['mm', 'ss'];
		}
		if(sec == null){
			sec = $.prop(this, 'duration');
		}
		if(!sec){
			sec = 0;
		}
		var formated = [];
		var frac;
		for(var i = 0, len = format.length; i < len; i++){
			if(i == len -1){
				frac = Math.round(sec / times[format[i]]);
			} else {
				frac = parseInt(sec / times[format[i]], 10);
				sec = sec % times[format[i]];
			} 
			if(frac < 10){
				frac = '0'+frac;
			}
			formated.push( frac );
		}
		
		return formated.join(':');
	};
	$.jme.defineMethod('formatTime', formatTime);
	
	$.jme.defineProp('format', {
		set: function(elem, format){
			if(!$.isArray(format)){
				format = format.split(':');
			}
			var data = $.jme.data(elem);
			data.format = format;
			$(elem).triggerHandler('updatetimeformat');
			data.player.triggerHandler('updatetimeformat');
			return 'noDataSet';
		}
	});
	
	$.jme.registerPlugin('duration-display', {
		structure: defaultStructure,
		options: {
			format: "mm:ss"
		},
		_create: function(control, media, base, options){
			if(typeof options.format == 'string'){
				options.format = options.format.split(':');
			}
			var showDuration = function(){
				control.html(formatTime(media.prop('duration'), options.format));
			};
			media.bind('durationchange emptied', showDuration);
			
			control
				.bind('updatetimeformat', showDuration)
				.jmeProp('format', options.format)
			;
		}
	});
	
	$.jme.defineProp('countdown', {
		set: function(elem, value){
			
			var data = $.jme.data(elem);
			data.countdown = !!value;
			$(elem).triggerHandler('updatetimeformat');
			data.player.triggerHandler('updatetimeformat');
			return 'noDataSet';
		}
	});
	
	$.jme.registerPlugin('currenttime-display', {
		structure: defaultStructure,
		options: {
			format: "mm:ss",
			countdown: false
		},
		_create: function(control, media, base, options){
			if(typeof options.format == 'string'){
				options.format = options.format.split(':');
			}
			
			var showTime = function(e){
				var currentTime = media.prop('currentTime');
				if(options.countdown){
					currentTime = (media.prop('duration') || 0) - currentTime;
					if(currentTime < 0.7){
						currentTime = 0;
					}
				}
				control.html(formatTime(currentTime, options.format));
			};
			media.bind('timeupdate emptied durationchange', showTime);
			
			control
				.bind('updatetimeformat', showTime)
				.jmeProp('format', options.format)
			;
		}
	});
	
	
	//taken from http://johndyer.name/native-fullscreen-javascript-api-plus-jquery-plugin/
	$.jme.fullscreen = (function() {
		var parentData;
		var tmpData;
		var fullScreenApi = {
			supportsFullScreen: false,
			isFullScreen: function() { return false; },
			requestFullScreen: function(elem){
				parentData = [];
				$(elem).parentsUntil('body').each(function(){
					var pos =  $.curCSS(this, 'position');
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
				}
			},
			eventName: 'fullscreenchange',
			prefix: ''
		},
		browserPrefixes = 'webkit moz o ms khtml'.split(' ');
	
		// check for native support
		if (typeof document.cancelFullScreen != 'undefined') {
			fullScreenApi.supportsFullScreen = true;
		} else {
			// check for fullscreen support by vendor prefix
			for (var i = 0, il = browserPrefixes.length; i < il; i++ ) {
				fullScreenApi.prefix = browserPrefixes[i];
				if (typeof document[fullScreenApi.prefix + 'CancelFullScreen' ] != 'undefined' ) {
					fullScreenApi.supportsFullScreen = true;
					break;
				}
			}
		}
	
		// update methods to do something useful
		if (fullScreenApi.supportsFullScreen) {
			fullScreenApi.eventName = fullScreenApi.prefix + 'fullscreenchange';
			
			fullScreenApi.isFullScreen = function() {
				switch (fullScreenApi.prefix) {
					case '':
					return document.fullScreen;
					case 'webkit':
					return document.webkitIsFullScreen;
					default:
					return document[fullScreenApi.prefix + 'FullScreen'];
				}
			};
			fullScreenApi.requestFullScreen = function(el) {
				return (fullScreenApi.prefix === '') ? el.requestFullScreen() : el[this.prefix + 'RequestFullScreen']();
			};
			fullScreenApi.cancelFullScreen = function(el) {
				return (fullScreenApi.prefix === '') ? document.cancelFullScreen() : document[this.prefix + 'CancelFullScreen']();
			};
		}
	
		return fullScreenApi;
	})();
	
	
	$.jme.defineMethod('enterFullscreen', function(){
		if($(this).hasClass($.jme.classNS+'player-fullscreen')){return;}
		var elem = this;
		var data = $.jme.data(elem);
		data.scrollPos = {
			top: $(window).scrollTop(),
			left: $(window).scrollLeft()
		};
		
		$(document)
			.unbind('.jmefullscreen')
			.bind('keydown.jmefullscreen', function(e){
				if(e.keyCode == 27){
					$(elem).jmeFn('exitFullscreen');
					return false;
				}
			})
		;
		
		try {
			$.jme.fullscreen.requestFullScreen(elem);
		} catch(er){}
		
		
		$('html').addClass($.jme.classNS+'has-media-fullscreen');
		
		$(this).addClass($.jme.classNS+'player-fullscreen');
			
		data.media.addClass($.jme.classNS+'media-fullscreen');
		
		if($.jme.fullscreen.supportsFullScreen){
			$(document)
				.bind($.jme.fullscreen.eventName+'.jmefullscreen', function(e){
					var isFullscreen = $.jme.fullscreen.isFullScreen();
					if(isFullscreen && elem == e.target){
						$(elem).triggerHandler('playerdimensionchange', ['fullscreen']);
					} else if(!isFullscreen) {
						$(elem).jmeFn('exitFullscreen');
					}
				})
			;
			
		}
		$(this).triggerHandler('playerdimensionchange', ['fullwindow']);
		data.media.callProp('play');
	});
	$.jme.defineMethod('exitFullscreen', function(){
		if(!$(this).hasClass($.jme.classNS+'player-fullscreen')){return;}
		var data = $.jme.data(this);
		$(document).unbind('.jmefullscreen');
		$('html').removeClass($.jme.classNS+'has-media-fullscreen');
		$(this).removeClass($.jme.classNS+'player-fullscreen');
		data.media.removeClass($.jme.classNS+'media-fullscreen');
		
		try {
			$.jme.fullscreen.cancelFullScreen();
		} catch(er){}
		
		
		$(this).triggerHandler('playerdimensionchange');
		if(data.scrollPos){
			$(window).scrollTop(data.scrollPos.top);
			$(window).scrollLeft(data.scrollPos.left);
			delete data.scrollPos;
		}
	});
	
	$.jme.registerPlugin('fullscreen', {
		pseudoClasses: {
			enter: 'state-enterfullscreen',
			exit: 'state-exitfullscreen'
		},
		structure: btnStructure,
		text: 'enter fullscreen / exit fullscreen',
		_create: function(control, media, base){
			var textFn = $.jme.getButtonText(control, [this[pseudoClasses].enter, this[pseudoClasses].exit]);
			var updateControl = function(){
				textFn(base.hasClass($.jme.classNS+'player-fullscreen') ? 1 : 0);
			};
			base.bind('playerdimensionchange', updateControl);
			control.bind('click', function(){
				base.jmeFn(base.hasClass($.jme.classNS+'player-fullscreen') ? 'exitFullscreen' : 'enterFullscreen');
				return false;
			});
			updateControl();
		}
	});
	
})(jQuery);
