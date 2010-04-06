/**!
 * Part of the jMediaelement-Project | http://github.com/aFarkas/jMediaelement
 * @author Alexander Farkas
 * Copyright 2010, Alexander Farkas
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */

(function($){
	
	var split 			= /\s*\/\s*|\s*\|\s*/,
		sliderMethod 	= ($.fn.a11ySlider) ? 'a11ySlider' : 'slider',
		controls 		= {
			'timeline-slider': function(control, mm, api, o){
				var stopSlide = false;
				control[sliderMethod](o.timeSlider)[sliderMethod]('option', 'disabled', true);
				
				function changeTimeState(e, ui){
					if(ui.timeProgress !== undefined && !stopSlide){
						control[sliderMethod]('value', ui.timeProgress);
					}
				}
				
				function changeDisabledState(){
					if(api.apis[api.name].loadedmeta && api.apis[api.name].loadedmeta.duration){
						control[sliderMethod]('option', 'disabled', false);
					} else {
						control[sliderMethod]('option', 'disabled', true);
					}
				}
				
				api.apis[api.name].onMediaReady(function(){
					mm
						.bind('loadedmeta', changeDisabledState)
						.bind('timechange', changeTimeState)
						.bind('mediareset', function(){
							control[sliderMethod]('value', 0);
							changeDisabledState();
						})
						.bind('ended', function(){
							control[sliderMethod]('value', 100);
						})
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
				});
				
			},
			'volume-slider': function(control, mm, api, o){
				var stopSlide = false;
				control[sliderMethod](o.volumeSlider)[sliderMethod]('option', 'disabled', true);
				
				function changeVolumeUI(e, ui){
					if(!stopSlide){
						control[sliderMethod]('value', ui.volumelevel);
					}
				}
				
				api.apis[api.name].onMediaReady(function(){
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
					
				});
			},
			'progressbar': function(control, mm, api, o){
				control.progressbar(o.progressbar).progressbar('option', 'disabled', true);
				
				function changeProgressUI(e, ui){
					if ('relLoaded' in ui) {
						control.progressbar('option', 'disabled', false).progressbar('value', ui.relLoaded);
					} else {
						control.progressbar('option', 'disabled', true);
					}
				}
				
				function resetProgress(e, ui){
					control.progressbar('option', 'disabled', true).progressbar('value', 0);
				}
				
				api.apis[api.name].onMediaReady(function(){
					mm
						.bind('progresschange', changeProgressUI)
						.bind('mediareset', resetProgress)
					;
				}, 'one');
				
			},
			duration: function(control, mm, api, o){
				if(o.addThemeRoller){
					control.addClass('ui-widget-content ui-corner-all');
				}
				control.html('--:--');
				mm
					.bind('loadedmeta', function(e, evt){
						control.html(api.apis[api.name]._format(evt.duration));
					})
					.bind('mediareset', function(){
						control.html('--:--');
					})
				;
				api.apis[api.name].onMediaReady(function(){
					control.html(api.apis[api.name].getFormattedDuration());
				});
				
			},
			'current-time': function(control, mm, api, o){
				if(o.addThemeRoller){
					control.addClass('ui-widget-content ui-corner-all');
				}
				control.html('--:--');
				mm
					.bind('timechange', function(e, evt){
						control.html(api.apis[api.name]._format(evt.time));
					})
					.bind('mediareset', function(){
						control.html('--:--');
					})
				;
				api.apis[api.name].onMediaReady(function(){
					control.html(api.apis[api.name].getFormattedTime());
				});
			},
			'media-controls': function(control, mm, api, o){
				if(o.addThemeRoller){
					control.addClass('ui-widget ui-widget-header ui-corner-all');
				}
				
				function calcSlider(){
					var space 		= control.innerWidth() + o.mediaControls.timeSliderAdjust,
						occupied 	= timeSlider.outerWidth(true) - timeSlider.innerWidth()
					;
					$('> *', control).each(function(){
						if(timeSlider[0] !== this && this.offsetWidth && ( !o.excludeSel || !$(this).is(o.excludeSel) ) ){
							occupied += $(this).outerWidth(true);
						}
					});
					timeSlider.css('width', space - occupied);
				}
				
				if(o.mediaControls.dynamicTimeslider){
					var timeSlider  = $('.'+ o.classPrefix +'timeline-slider', control),
						calcTimer	= setTimeout(calcSlider, 0)
					;
					
					api.apis[api.name].onMediaReady(function(){
						clearInterval(calcTimer);
						setTimeout(calcSlider, 0);
					}, 'one');
					$(window).bind('resize', calcSlider);
					mm.bind('resize emchange', calcSlider);
				}
			}
		},
		toggleModells = {
				'play-pause': {stateMethod: 'isPlaying', actionMethod: 'togglePlay', evts: 'play playing pause ended loadedmeta mediareset', trueClass: 'ui-icon-pause', falseClass: 'ui-icon-play'},
				'mute-unmute': {stateMethod: 'muted', actionMethod: 'toggleMuted', evts: 'mute', trueClass: 'ui-icon-volume-off', falseClass: 'ui-icon-volume-on'}
			}
	;
	
	//create Toggle Button UI
	$.each(toggleModells, function(name, opts){
		controls[name] = function(control, mm, api, o){
			var iconElem 	= $('.ui-icon', control),
				textElem 	= $('.button-text', control),
				stateNames,
				that 		= this
			;
			
			if(o.addThemeRoller){
				control.addClass('ui-state-default ui-corner-all');
			}
			
			if(!iconElem[0] && !textElem[0] && !$('*', control)[0]){
				iconElem = control;
				textElem = control;
			}
			
			stateNames = textElem.text().split(split);
			
			if(stateNames.length !== 2){
				textElem = $([]);
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
			
			api.apis[api.name].onMediaReady(function(){
				mm.bind(opts.evts, changeState);
				changeState();
			});
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
		ret.api = ret.mm.getMMAPI(true) || ret.mm.mediaElementEmbed(o.embed).getMMAPI(true);
		if(jElm.is(o.controlSel)){
			ret.controls = jElm;
		} 
		if(!ret.controls || ret.controls.hasClass(o.classPrefix+'media-controls')) {
			ret.controlsgroup = jElm;
			ret.controls = (ret.controls) ? $(o.controlSel, jElm).add(ret.controls) : $(o.controlSel, jElm);
			ret.api.controlWrapper = (ret.api.controlWrapper) ? ret.api.controlWrapper.add(jElm) : jElm;
		}
		return ret;
	}
	
	var moveKeys = {
		40: true,
		37: true,
		39: true,
		38: true
	};
	
	function addWrapperBindings(wrapper, mm, api, o){
		//classPrefix
		var stateClasses 		= o.classPrefix+'playing '+ o.classPrefix +'totalerror '+o.classPrefix+'waiting',
			removeStateClasses 	= function(){
				wrapper.removeClass(stateClasses);
			}
		;
		wrapper
			.addClass(o.classPrefix+api.name)
			.bind({
				apiActivated: function(e, d){
					wrapper.addClass(o.classPrefix+d.api);
				},
				apiDeActivated: function(e, d){
					wrapper.removeClass(o.classPrefix+d.api);
				}
			})
			.bind('playing totalerror waiting', function(e){
				removeStateClasses();
				wrapper.addClass(o.classPrefix+e.type);
			})
			.bind('pause ended mediareset', function(e){
				removeStateClasses();
			})
			.bind('canplay canplaythrough', function(e){
				wrapper.removeClass(o.classPrefix+'waiting');
			})
		;
		
		if($.ui && $.ui.keyCode){
			wrapper.bind('keydown', function(e){
				if(moveKeys[e.keyCode]){
					//user is interacting with the slider don´t do anything
					if($(e.target).is('.ui-slider-handle')){return;}
					var dif = 5;
					switch(e.keyCode) {
						case $.ui.keyCode.UP:
							if(e.ctrlKey){
								dif += 5;
							}
							api.apis[api.name].volume( Math.min(100, api.apis[api.name].volume() + dif ) );
							break;
						case $.ui.keyCode.DOWN:
							if(e.ctrlKey){
								dif += 5;
							}
							api.apis[api.name].volume( Math.max(0, api.apis[api.name].volume() - dif ) );
							break;
						case $.ui.keyCode.LEFT:
							if(e.ctrlKey){
								dif += 55;
							}
							api.apis[api.name].currentTime( Math.max(0, api.apis[api.name].currentTime() - dif ) );
							break;
						case $.ui.keyCode.RIGHT:
							if(e.ctrlKey){
								dif += 55;
							}
							api.apis[api.name].currentTime( Math.min( api.apis[api.name].getDuration(), api.apis[api.name].currentTime() + dif ) );
							break;
					}
					e.preventDefault();
				} else if(e.keyCode === $.ui.keyCode.SPACE && !$.nodeName(e.target, 'button')){
					api.apis[api.name].togglePlay();
					e.preventDefault();
				}
			});
		}
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
			elems.api.controls = elems.api.controls || [];
			if(!elems.api){return;}
			elems.controls.each(function(){
				var jElm = $(this);
				if($.inArray(this, elems.api.controls) !== -1){return;}
				elems.api.controls.push(this);
				$.each(controls, function(name, ui){
					if( jElm.hasClass(o.classPrefix+name) ){
						ui(jElm, elems.mm, elems.api, o);
						return false;
					}
				});
			});
			if(elems.controlsgroup && elems.controlsgroup[0]){
				addWrapperBindings(elems.controlsgroup, elems.mm, elems.api, o);
			}
		}
		
		return this.each(registerControl);
	};
	
	$.fn.registerMMControl.defaults = {
		//common
		embed: $.fn.mediaElementEmbed.defaults,
		classPrefix: '',
		addThemeRoller: true,
		
		mediaControls: {
			dynamicTimeslider: true,
			timeSliderAdjust: 0,
			excludeSel: false
		},
		progressbar: {},
		volumeSlider: {},
		timeSlider: {}
	};
	
	$.fn.registerMMControl.addControl = function(name, fn){
		controls[name] = fn;
	};
})(jQuery);