/**!
 * Part of the jMediaelement-Project | http://github.com/aFarkas/jMediaelement
 * @author Alexander Farkas
 * Copyright 2010, Alexander Farkas
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */

(function($){
	
	function bindState(jElm, con, evt, fn, bindStyle){
		bindStyle = bindStyle || 'bind';
		if(con){
			fn();
		} else if(bindStyle === 'one'){
			jElm.one(evt, fn);
		}
		if(!con || bindStyle !== 'one'){
			jElm.bind(evt, fn);
		}
	}
	
	var toggleModells = {
		'play-pause': {stateMethod: 'isPlaying', actionMethod: 'togglePlay', evts: 'play playing pause ended', trueClass: 'ui-icon-pause', falseClass: 'ui-icon-play'},
		'mute-unmute': {stateMethod: 'muted', actionMethod: 'toggleMuted', evts: 'mute', trueClass: 'ui-icon-volume-off', falseClass: 'ui-icon-volume-on'}
	};
	var sliderMethod = ($.fn.a11ySlider) ? 'a11ySlider' : 'slider';
	var split = /\s*\/\s*|\s*\|\s*/,
		controls = {
			'timeline-slider': function(control, mm, api, o){
				var stopSlide = false;
				control[sliderMethod](o.timeSlider)[sliderMethod]('option', 'disabled', true);
				
				function changeTimeState(e, ui){
					if(ui.timeProgress !== undefined && !stopSlide){
						control[sliderMethod]('value', ui.timeProgress);
					}
				}
				
				function changeDisabledState(e){
					if(api.apis[api.name].loadedmeta && api.apis[api.name].loadedmeta.duration){
						control[sliderMethod]('option', 'disabled', false);
					} else {
						control[sliderMethod]('option', 'disabled', true);
					}
				}
				
				bindState(mm, api.apis[api.name].isAPIReady, 'mmAPIReady', function(){
					mm
						.bind('emptied loadedmeta', changeDisabledState)
						.bind('timechange', changeTimeState)
					;
					control
						.bind('slidestart', function(e, ui){
							if (e.originalEvent) {
								stopSlide = true;
							}
						})
						.bind('slidestop', function(e, ui){
							stopSlide = false;
						})
						.bind('slide', function(e, ui){
							if(e.originalEvent){
								api.apis[api.name].relCurrentTime(ui.value);
							}
						})
					;
					
					changeDisabledState();
				}, 'one');
				
			},
			'volume-slider': function(control, mm, api, o){
				var stopSlide = false;
				control[sliderMethod](o.volumeSlider)[sliderMethod]('option', 'disabled', true);
				
				function changeVolumeUI(e, ui){
					if(!stopSlide){
						control[sliderMethod]('value', ui.volumelevel);
					}
				}
				
				bindState(mm, api.apis[api.name].isAPIReady, 'mmAPIReady', function(){
					mm.bind('volumelevelchange', changeVolumeUI);
					control
						.bind('slidestart', function(e, ui){
							if (e.originalEvent) {
								stopSlide = true;
							}
						})
						.bind('slidestop', function(e, ui){
							stopSlide = false;
						})
						.bind('slide', function(e, ui){
							if(e.originalEvent){
								api.apis[api.name].volume(ui.value);
							}
						})
					;
					control[sliderMethod]('option', 'disabled', false);
					control[sliderMethod]('value', api.apis[api.name].volume());
					
				}, 'one');
			},
			'progressbar': function(control, mm, api, o){
				control.progressbar(o.progressbar).progressbar('option', 'disabled', true);
				
				function changeProgressUI(e, ui){
					if (ui.lengthComputable) {
						control.progressbar('option', 'disabled', false).progressbar('value', ui.relLoaded);
					} else {
						control.progressbar('option', 'disabled', true);
					}
				}
				
				function resetProgress(e, ui){
					control.progressbar('option', 'disabled', true).progressbar('value', 0);
				}
				
				bindState(mm, api.apis[api.name].isAPIReady, 'mmAPIReady', function(){
					mm
						.bind('progresschange', changeProgressUI)
						.bind('emptied', resetProgress)
					;
				}, 'one');
				
			},
			duration: function(control, mm, api, o){
				if(o.addThemeRoller){
					control.addClass('ui-widget-content ui-corner-all');
				}
				control.html('--:--');
				mm.bind('loadedmeta emptied', function(e, evt){
					control.html(api.apis[api.name]._format(evt.duration));
				});
				bindState(mm, api.apis[api.name].isAPIReady, 'mmAPIReady', function(){
					control.html(api.apis[api.name].getFormattedDuration());
				}, 'one');
				
			},
			'current-time': function(control, mm, api, o){
				if(o.addThemeRoller){
					control.addClass('ui-widget-content ui-corner-all');
				}
				control.html('--:--');
				mm.bind('timechange', function(e, evt){
					control.html(api.apis[api.name]._format(evt.time));
				});
				bindState(mm, api.apis[api.name].isAPIReady, 'mmAPIReady', function(){
					control.html(api.apis[api.name].getFormattedTime());
				}, 'one');
			},
			'media-controls': function(control, mm, api, o){
				if(o.addThemeRoller){
					control.addClass('ui-widget ui-widget-header ui-corner-all');
				}
				
				function calcSlider(){
					var space 		= control.innerWidth(),
						occupied 	= timeSlider.outerWidth(true) - timeSlider.innerWidth()
					;
					$('> *', control).each(function(){
						if(timeSlider[0] !== this && this.offsetWidth){
							occupied += $(this).outerWidth(true);
						}
					});
					timeSlider.css('width', space - occupied);
				}
				
				if(o.mediaControls.dynamicTimeslider){
					var timeSlider  = $('.'+ o.classPrefix +'timeline-slider', control),
						calcTimer	= setTimeout(calcSlider, 0)
					;
					
					bindState(mm, api.apis[api.name].isAPIReady, 'mmAPIReady', function(){
						clearInterval(calcTimer);
						setTimeout(calcSlider, 0);
					}, 'one');
					$(window).bind('resize', calcSlider);
					mm.bind('resize emchange', calcSlider);
				}
			}
		}
	;
	
	//create Toggle Button UI
	$.each(toggleModells, function(name, opts){
		controls[name] = function(control, mm, api, o){
			var iconElem 	= $('.ui-icon', control),
				textElem 	= $('.button-text', control),
				stateNames 	= textElem.text().split(split),
				that 		= this
			;
			
			if(o.addThemeRoller){
				control.addClass('ui-state-default ui-corner-all');
			}
			
			if(!iconElem[0]){
				iconElem = control;
			}
			if(!textElem[0]){
				textElem = control;
			}
			if(stateNames.length < 2){
				stateNames = [stateNames[0], stateNames[1]];
			}
			
			function changeState(e, ui){
				var state = api.apis[api.name][opts.stateMethod]();
				
				if(state){
					textElem.text(stateNames[1]);
					iconElem.addClass(opts.trueClass).removeClass(opts.falseClass);
				} else {
					textElem.text(stateNames[0]);
					iconElem.addClass(opts.falseClass).removeClass(opts.trueClass);
				}
			}
			
			bindState(mm, api.apis[api.name].isAPIReady, 'mmAPIReady', function(){
				mm.bind(opts.evts, changeState);
				changeState();
			}, 'one');
			control.bind('click', function(e){
				api.apis[api.name][opts.actionMethod]();
				e.preventDefault();
			});
		};
	});
	
	
	
	function getElems(elem, o){
		var jElm 	= $(elem),
			ret 	= {},
			mmID 	= jElm.attr('data-controls')
		;
		
		ret.mm = (mmID) ? $('#'+ mmID) : $('video, audio', jElm).filter(':first');
		if(jElm.is(o.controlSel)){
			ret.controls = jElm;
		} else {
			ret.controlsgroup = jElm;
			ret.controls = $(o.controlSel, jElm);
		}
		
		ret.api = ret.mm.getMMAPI(true) || ret.mm.mediaElementEmbed(o.embed).getMMAPI(true);
		return ret;
	}
	
	$.fn.registerMMControl = function(o){
		o = $.extend(true, {}, $.fn.registerMMControl.defaults, o);
		o.controlSel = [];
		$.each(controls, function(name){
			if(name !== 'media-controls'){
				o.controlSel.push('.'+ o.classPrefix + name);
			}
		});
		o.controlSel.push('.'+ o.classPrefix + 'media-controls');
		o.controlSel = o.controlSel.join(', ');
		function registerControl(){
			var elems = getElems(this, o);
			
			if(!elems.api){return;}
			elems.controls.each(function(){
				var jElm = $(this);
				$.each(controls, function(name, ui){
					if( jElm.hasClass(o.classPrefix+name) ){
						ui(jElm, elems.mm, elems.api, o);
						return false;
					}
				});
			});
		}
		
		return this.each(registerControl);
	};
	
	$.fn.registerMMControl.defaults = {
		//common
		embed: $.fn.mediaElementEmbed.defaults,
		classPrefix: '',
		addThemeRoller: true,
		
		mediaControls: {
			dynamicTimeslider: true
		},
		progressbar: {},
		volumeSlider: {},
		timeSlider: {}
	};
	
	$.fn.registerMMControl.addControl = function(name, fn){
		controls[name] = fn;
	};
})(jQuery);