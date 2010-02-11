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
	
	var split = /\s*\/\s*|\s*\|\s*/,
		controls = {
			'timeline-slider': function(control, mm, api, o){
				var stopSlide = false;
				control.slider(o.timeSlider).slider('option', 'disabled', true);
				
				function changeTimeState(e, ui){
					if(ui.timeProgress !== undefined && !stopSlide){
						control.slider('value', ui.timeProgress);
					}
				}
				
				function changeDisabledState(e){
					if(api.apis[api.name].loadedmeta && api.apis[api.name].loadedmeta.duration){
						control.slider('option', 'disabled', false);
					} else {
						control.slider('option', 'disabled', true);
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
				control.slider(o.volumeSlider).slider('option', 'disabled', true);
				
				function changeVolumeUI(e, ui){
					if(!stopSlide){
						control.slider('value', ui.volumelevel);
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
					control.slider('option', 'disabled', false);
					control.slider('value', api.apis[api.name].volume());
					
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
				mm.bind('loadedmeta emptied', function(e, evt){
					control.html(api.apis[api.name]._format(evt.duration));
				});
				bindState(mm, api.apis[api.name].isAPIReady, 'mmAPIReady', function(){
					control.html(api.apis[api.name].getFormattedDuration());
				}, 'one');
				
			},
			'current-time': function(control, mm, api, o){
				mm.bind('timechange', function(e, evt){
					control.html(api.apis[api.name]._format(evt.time));
				});
				
				
				bindState(mm, api.apis[api.name].isAPIReady, 'mmAPIReady', function(){
					control.html(api.apis[api.name].getFormattedTime());
				}, 'one');
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
			ret 	= {
							wrapper: $(elem).closest('[data-controls], [data-controlwrapper]')
						},
			mmID 	= ret.wrapper.attr('data-controls')
		;
		ret.mm = (mmID) ? $('#'+ mmID) : $('video, audio', ret.wrapper).filter(':first');
		ret.controls = ( jElm.is(o.controlSel) ) ? jElm : $(o.controlSel, ret.wrapper);
		ret.api = ret.mm.getMMAPI(true) || ret.mm.mediaElementEmbed(o.embed).getMMAPI(true);
		return ret;
	}
	
	$.fn.registerMMControl = function(o){
		o = $.extend(true, {}, $.fn.registerMMControl.defaults, o);
		o.controlSel = [];
		$.each(controls, function(name){
			o.controlSel.push('.'+ o.classPrefix + name);
		});
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
		//controls: false
		embed: $.fn.mediaElementEmbed.defaults,
		classPrefix: '',
		addThemeRoller: true,
		progressbar: {},
		volumeSlider: {},
		timeSlider: {}
	};
	
	$.fn.registerMMControl.addControl = function(name, fn){
		controls[name] = fn;
	};
})(jQuery);