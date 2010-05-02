/**!
 * Part of the jMediaelement-Project | http://github.com/aFarkas/jMediaelement
 * @author Alexander Farkas
 * Copyright 2010, Alexander Farkas
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */

(function($){
	if(!$.event.special.ariaclick){
		var preventclick = false;
		function handleAriaClick(e){
			
			if(!preventclick && (!e.keyCode || e.keyCode === 13 || ( e.keyCode === 32 && $.attr(e.target, 'role') === 'button' ) )){
				//ToDo:  || e.keyCode === $.ui.keyCode.SPACE
				preventclick = true;
				setTimeout(function(){
					preventclick = false;
				}, 1);
				return $.event.special.ariaclick.handler.apply(this, arguments);
			} else if(preventclick && e.type == 'click'){
				e.preventDefault();
				return false;
			}
			return undefined;
		}
		$.event.special.ariaclick = {
			setup: function(){
				$(this).bind('click keydown', handleAriaClick);
	            return true;
	        },
			teardown: function(){
	            $(this).unbind('click keydown', handleAriaClick);
	            return true;
	        },
	        handler: function(e){
	            e.type = 'ariaclick';
	            return $.event.handle.apply(this, arguments);
	        }
		};
	}
	var split 			= /\s*\/\s*|\s*\|\s*/,
		moveKeys 		= {
					40: true,
					37: true,
					39: true,
					38: true
				},
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
						if(e.originalEvent && api.apis[api.name].isAPIReady){
							api.apis[api.name].relCurrentTime(ui.value);
						}
					})
				;
			},
			'volume-slider': function(control, mm, api, o){
				var stopSlide = false;
				control[sliderMethod](o.volumeSlider)[sliderMethod]('option', 'disabled', true);
				
				function changeVolumeUI(e, ui){
					if(!stopSlide){
						control[sliderMethod]('value', ui.volumelevel);
					}
				}
				
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
						if(e.originalEvent && api.apis[api.name].isAPIReady){
							api.apis[api.name].volume(ui.value);
						}
					})
				;
				
				mm
					.bind('volumelevelchange', changeVolumeUI)
					.onAPIReady(function(){
						
						control[sliderMethod]('option', 'disabled', false);
						control[sliderMethod]('value', parseFloat( mm.volume(), 10 ) || 100);
					})
				;
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
				
				mm
					.bind('progresschange', changeProgressUI)
					.bind('mediareset', resetProgress)
				;
				
			},
			duration: function(control, mm, api, o){
				if(o.addThemeRoller){
					control.addClass('ui-widget-content ui-corner-all');
				}
				control.html('00:00');
				mm
					.bind('loadedmeta', function(e, evt){
						control.html(api.apis[api.name]._format(evt.duration));
					})
					.bind('mediareset', function(){
						control.html('00:00');
					})
				;
				
			},
			'current-time': function(control, mm, api, o){
				var timeChange = ( o.currentTime.reverse ) ? 
					function(e, evt){
						control.html( api.apis[api.name]._format( duration - evt.time ));
					} :
					function(e, evt){
						control.html(api.apis[api.name]._format(evt.time));
					},
					duration = Number.MIN_VALUE
				;
				
				if(o.addThemeRoller){
					control.addClass('ui-widget-content ui-corner-all');
				}
				control.html('00:00').attr('role', 'timer');
				
				if( o.currentTime.reverse ){
					mm.bind('loadedmeta', function(e, evt){
						duration = evt.duration || Number.MIN_VALUE;
						timeChange(false, {time: 0});
					});
				}
				mm
					.bind('timechange', timeChange)
					.bind('mediareset', function(){
						control.html('00:00');
					})
				;
			},
			'media-controls': function(control, mm, api, o){
				if(o.addThemeRoller){
					control.addClass('ui-widget ui-widget-header ui-corner-all');
				}
				control.attr('role', 'toolbar');
				function calcSlider(){
					var space 		= control.innerWidth() + o.mediaControls.timeSliderAdjust,
						occupied 	= timeSlider.outerWidth(true) - timeSlider.innerWidth()
					;
					$('> *', control).each(function(){
						if(timeSlider[0] !== this && this.offsetWidth && $.curCSS(this, 'position') !== 'absolute' && ( !o.excludeSel || !$(this).is(o.excludeSel) ) ){
							occupied += $(this).outerWidth(true);
						}
					});
					timeSlider.css('width', space - occupied);
				}
				
				if(o.mediaControls.dynamicTimeslider){
					var timeSlider  = $('.'+ o.classPrefix +'timeline-slider', control),
						calcTimer	= setTimeout(calcSlider, 0)
					;
					
					mm.onAPIReady(function(){
						clearInterval(calcTimer);
						setTimeout(calcSlider, 0);
					});
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
			var elems = $.fn.registerMMControl.getBtn(control);
			if(o.addThemeRoller){
				control.addClass('ui-state-default ui-corner-all');
			}		
			function changeState(){
				var state = mm[opts.stateMethod]();
				
				if(state){
					elems.text.text(elems.names[1]);
					elems.title.attr('title', elems.titleText[1]);
					elems.icon.addClass(opts.trueClass).removeClass(opts.falseClass);
				} else {
					elems.text.text(elems.names[0]);
					elems.title.attr('title', elems.titleText[0]);
					elems.icon.addClass(opts.falseClass).removeClass(opts.trueClass);
				}
			}
			
			mm
				.bind(opts.evts, changeState)
				.onAPIReady(changeState)
			;
			control.bind('ariaclick', function(e){
				mm[opts.actionMethod]();
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
			if( jElm[0] && !ret.api.controlWrapper &&  $.contains( jElm[0], ret.mm[0] ) ){
				ret.api.controlWrapper = jElm;
			}
			ret.controls = (ret.controls) ? $(o.controlSel, jElm).add(ret.controls) : $(o.controlSel, jElm);
			ret.api.controlBar = ret.controls.filter('.'+o.classPrefix+'media-controls');
		}
		return ret;
	}
	
	
	function addWrapperBindings(wrapper, mm, api, o){
		//classPrefix
		var stateClasses 		= o.classPrefix+'playing '+ o.classPrefix +'totalerror '+o.classPrefix+'waiting',
			removeStateClasses 	= function(){
				wrapper.removeClass(stateClasses);
			}
		;
		wrapper.addClass(o.classPrefix+api.name);
		mm
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
			.bind('canplay', function(e){
				wrapper.removeClass(o.classPrefix+'waiting');
			})
		;
		if (!$.ui || !$.ui.keyCode) {return;}
		wrapper
			.bind('keydown', function(e){
				if( e.jmeHandledEvent ){return;}
				e.jmeHandledEvent = true;
				if( moveKeys[e.keyCode] ){
					//user is interacting with the slider don´t do anything
					if($(e.target).is('.ui-slider-handle')){return;}
					var dif = 5;
					switch(e.keyCode) {
						case $.ui.keyCode.UP:
							if(e.ctrlKey){
								dif += 5;
							}
							mm.volume( Math.min(100, mm.volume() + dif ) );
							break;
						case $.ui.keyCode.DOWN:
							if(e.ctrlKey){
								dif += 5;
							}
							mm.volume( Math.max(0, mm.volume() - dif ) );
							break;
						case $.ui.keyCode.LEFT:
							if(e.ctrlKey){
								dif += 55;
							}
							mm.currentTime( Math.max(0, mm.currentTime() - dif ) );
							break;
						case $.ui.keyCode.RIGHT:
							if(e.ctrlKey){
								dif += 55;
							}
							mm.currentTime( Math.min( mm.getDuration(), mm.currentTime() + dif ) );
							break;
					}
					e.preventDefault();
				} else if( e.keyCode === $.ui.keyCode.SPACE && ( !$.nodeName(e.target, 'button') && $.attr(e.target, 'role') !== 'button' || wrapper.hasClass('wraps-fullscreen')) ){
					mm.togglePlay();
					e.preventDefault();
				}
			})
		;
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
			if(elems.api.controlWrapper && elems.api.controlWrapper[0]){
				addWrapperBindings(elems.api.controlWrapper, elems.mm, elems.api, o);
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
		timeSlider: {},
		currentTime: {
			reverse: false
		}
	};
	
	$.support.waiaria = (!$.browser.msie || $.browser.version > 7);
	
	
	$.fn.registerMMControl.getBtn = function(control){
		var elems = {
			icon: $('.ui-icon', control),
			text: $('.button-text', control),
			title: control
		};
		
		if( !control.is(':button') && !control.attr('role') ){
			if($.support.waiaria){
				control.removeAttr('href');
			}
			control.attr({role: 'button', tabindex: 0});
		}
			
		if(!elems.icon[0] && !elems.text[0] && !$('*', control)[0]){
			elems.icon = control;
			elems.text = control;
		}
		
		elems.names = elems.text.text().split(split);
		elems.titleText = (control.attr('title') || '').split(split);
		
		if(elems.names.length !== 2){
			elems.text = $([]);
		}
		if(elems.titleText.length !== 2){
			elems.title = $([]);
		}
		return elems;
	};
	$.fn.registerMMControl.addControl = function(name, fn){
		controls[name] = fn;
	};
	
	$(function(){
		sliderMethod 	= ($.fn.a11ySlider) ? 'a11ySlider' : 'slider';
	});
})(jQuery);