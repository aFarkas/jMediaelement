/**!
 * Part of the jMediaelement-Project | http://github.com/aFarkas/jMediaelement
 * @author Alexander Farkas
 * Copyright 2010, Alexander Farkas
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */

(function($){
	if(!$.event.special.ariaclick){
		(function(){
			var preventclick 	= false,
				handleAriaClick = function(e){
					if(!preventclick && (!e.keyCode || e.keyCode === 13 || ( e.keyCode === 32 && $.attr(e.target, 'role') === 'button' ) )){
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
			;
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
		})();
		
	}
	
	var controls 	= {},
		$m 			= $.multimediaSupport
	;
	
	function getElems(elem, o){
		var jElm 	= $(elem),
			ret 	= {},
			mmID 	= jElm.attr('data-controls')
		;
		
		ret.mm = (mmID) ? $('#'+ mmID) : $('video, audio', jElm).filter(':first');
		ret.api = ret.mm.getJMEAPI(true) || ret.mm.jmeEmbed(o.embed).getJMEAPI(true);
		if(!ret.api){return ret;}
		if(jElm.is(o.controlSel)){
			ret.controls = jElm;
		}
		
		if(!ret.controls || ret.controls.hasClass(o.classPrefix+'media-controls')) {
			if( jElm[0] && !ret.api.controlWrapper &&  $.contains( jElm[0], ret.mm[0] ) ){
				ret.api.controlWrapper = jElm;
			}
			ret.controls = (ret.controls) ? $(o.controlSel, jElm).add(ret.controls) : $(o.controlSel, jElm);
		}
		return ret;
	}
	
	
	function addWrapperBindings(wrapper, mm, api, o){
		if(wrapper.data('jmePlayer')){return;}
		$m.addStateClasses(wrapper, mm, o.classPrefix);
		wrapper.data('jmePlayer', {mediaelement: mm, api: api});
		if( $.fn.videoOverlay ){
			wrapper
				.videoOverlay({
					video: mm,
					startCSS: {
						width: 'auto',
						height: 'auto',
						zIndex: 99998,
						padding: 0,
						margin: 0,
						borderWidth: 0
					},
					position: {
						bottom: 0,
						left: 0,
						right: 0,
						top: 0,
						width: 0,
						height: 0
					}
				})
			;
		}
		if (!$.ui || !$.ui.keyCode) {return;}
		wrapper
			.bind('keydown', function(e){
				if( e.jmeHandledEvent ){return;}
				e.jmeHandledEvent = true;
				if( {40: 1,37: 1,39: 1,38: 1}[e.keyCode] ){
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
		
	$.fn.jmeControl = function(opts){
		opts = $.extend(true, {}, $.fn.jmeControl.defaults, opts);
		opts.controlSel = [];
		$.each(controls, function(name){
			if(name !== 'media-controls'){
				opts.controlSel.push('.'+ opts.classPrefix + name);
			}
		});
		opts.controlSel.push('.'+ opts.classPrefix + 'media-controls');
		opts.controlSel = opts.controlSel.join(', ');
		
		function registerControl(){
			var elems = getElems(this, opts);
			if( !elems.api ){return;}
			elems.api.controls = elems.api.controls || [];
			if(!elems.api){return;}
			elems.controls.each(function(){
				var jElm 	= $(this);
				
				if($.inArray(this, elems.api.controls) !== -1){return;}
				elems.api.controls.push(this);
				$.each(controls, function(name, ui){
					if( jElm.hasClass(opts.classPrefix+name) ){
						var o = $.extend(true, {}, opts);
						o[ui.optionsName] = $m.extendWithData(jElm[0], o[ui.optionsName], opts[ui.optionsName]);
						ui(jElm, elems.mm, elems.api, o);
						return false;
					}
				});
			});
			if( elems.api.controlWrapper && elems.api.controlWrapper[0] ){
				addWrapperBindings(elems.api.controlWrapper, elems.mm, elems.api, opts);
			}
		}
		
		return this.each(registerControl);
	};
	
	$.fn.jmeControl.defaults = {
		//common
		embed: {removeControls: true},
		classPrefix: '',
		addThemeRoller: true
	};
	
	$.support.waiaria = (!$.browser.msie || $.browser.version > 7);
	
	$.fn.jmeControl.getBtn = (function(){
		var split = /\s*\/\s*|\s*\|\s*|\s*\,\s*/g;
		return function(control){
			var elems = {
				icon: $('.ui-icon', control),
				text: $('.button-text', control),
				title: control
			};
			
			if (!control.is(':button') && !control.attr('role')) {
				if ($.support.waiaria) {
					control.removeAttr('href');
				}
				control.attr({
					role: 'button',
					tabindex: 0
				});
			}
			
			if (!elems.icon[0] && !elems.text[0] && !$('*', control)[0]) {
				elems.icon = control;
				elems.text = control;
			}
			
			elems.names = elems.text.text().split(split);
			elems.titleText = (control.attr('title') || '').split(split);
			
			if (elems.names.length !== 2) {
				elems.text = $([]);
			}
			if (elems.titleText.length !== 2) {
				elems.title = $([]);
			}
			return elems;
		};
	})();
	
	$m.camelCase = (function(){
		var rdashAlpha = /-([a-z])/ig,
			fcamelCase = function( all, letter ) {
				return letter.toUpperCase();
			}
		;
		return function(name){
			return name.replace(rdashAlpha, fcamelCase);
		};
	})();
	$.fn.jmeControl.addControl = function(name, fn, ops, optsName){
		ops = ops || {};
		optsName = optsName || $m.camelCase(name);
		$.fn.jmeControl.defaults[optsName] = ops;
		fn.optionsName = optsName;
		controls[name] = fn;
		
	};
	
	$.fn.jmeControl.addControls = function(controls){
		$.each(controls, function(i, control){
			$.fn.jmeControl.addControl(control.name, control.fn, control.options, control.optionName);
		});
	};
	
	$.fn.registerMMControl = $.fn.jmeControl;
	
	
	//implement controls
	var toggleModells = {
			'play-pause': {stateMethod: 'isPlaying', actionMethod: 'togglePlay', evts: 'play playing pause ended loadedmeta mediareset', trueClass: 'ui-icon-pause', falseClass: 'ui-icon-play'},
			'mute-unmute': {stateMethod: 'muted', actionMethod: 'toggleMuted', evts: 'mute loadedmeta', trueClass: 'ui-icon-volume-off', falseClass: 'ui-icon-volume-on'}
		}
	;
	
	$.each(toggleModells, function(name, opts){
		$.fn.jmeControl.addControl(name, function(control, mm, api, o){
			var elems = $.fn.jmeControl.getBtn(control);
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
			
			changeState();
			
			mm
				.bind(opts.evts, changeState)
				.jmeReady(changeState)
			;
			control.bind('ariaclick', function(e){
				mm[opts.actionMethod]();
				e.preventDefault();
			});
		});
	});
	
	
	
	$.each(['current-time', 'remaining-time'], function(i, name){
		$.fn.jmeControl.addControl(name, function(control, mm, api, o){
			var timeChange = ( name == 'remaining-time' ) ? 
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
			
			if( name == 'remaining-time' ){
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
		});
	});
	
	$.fn.jmeControl.addControls([
		{
			name: 'duration',
			fn: function(control, mm, api, o){
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
				
			}
		},
		{
			name: 'media-controls',
			options: {
				dynamicTimeslider: false,
				timeSliderAdjust: 0,
				excludeSel: false,
				fullWindowOverlay: false
			},
			fn: function(control, mm, api, o){
				if(o.addThemeRoller){
					control.addClass('ui-widget ui-widget-header ui-corner-all');
				}
				control.attr('role', 'toolbar');
				function calcSlider(){
					var space 		= control.width() + o.mediaControls.timeSliderAdjust,
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
					
					mm.jmeReady(function(){
						clearInterval(calcTimer);
						setTimeout(calcSlider, 0);
					});
					$(window).bind('resize', calcSlider);
					mm.bind('resize emchange', calcSlider);
				}
				if(o.mediaControls.fullWindowOverlay && $.fn.videoOverlay ){
					control.videoOverlay({
						fullscreenClass: o.classPrefix +'controls-fullscreenvideo',
						video: mm,
						startCSS: {
							width: 'auto'
						},
						position: {
							bottom: 0,
							left: 0,
							right: 0
						}
					});
				}
			}
		},
		{
			name: 'media-label',
			fn: (function(){
				var labelID = 0;
				return function(control, mm, data, o){
					if (!data.controlWrapper || data.controlWrapper.attr('role')) {
						return;
					}
					var id = control.attr('id'), mediaName = $('.' + o.classPrefix + 'media-name', control);
					if (!id) {
						labelID++;
						id = o.classPrefix + 'media-label-' + labelID;
						control.attr('id', id);
					}
					data.mediaName = (mediaName[0]) ? mediaName : control;
					data.controlWrapper.attr({
						role: 'group',
						'aria-labelledby': id
					});
				};
			})()
		},
		{
			name: 'fallback',
			fn: function(control, mm, api, o){
				if( o.embed.showFallback || !$.support.mediaElements ){return;}
				var fallback 		= control.clone(true),
					showFallback 	= function(){
						mm.after(fallback).hide();
						$(this).one('mediareset', function(){
							 mm.show();
							 fallback.detach();
						});
					}
				;
				mm.bind('totalerror', showFallback);
			}
		},
		{
			name: 'media-state',
			options: {
				click: 'togglePlay'
			},
			fn: function(control, mm, api, o){
				$m.addStateClasses(control, mm, o.classPrefix);		
				if( o.mediaState.click && mm[o.mediaState.click] ){
					control.click(function(){
						mm[o.mediaState.click]();
					});
				}
				
			}
		}
	]);
	
	$m.addStateClasses = function(control, mm, prefix){
		prefix = prefix || '';
		var stateClasses 		= prefix+'playing '+ prefix +'totalerror '+ prefix +'waiting '+ prefix +'idle '+ prefix +'flashblocker',
			removeStateClasses 	= function(){
				control.removeClass(stateClasses);
			}
		;
		mm.jmeReady(function(){
			var playing = mm.isPlaying();
			if(typeof playing !== 'boolean'){return;}
			control.addClass(prefix+ (playing) ? 'idle' : 'playing');
		});
		
		control.addClass(prefix + mm.getMediaAPI());
		mm
			.bind({
				apiActivated: function(e, d){
					control.addClass(prefix + d.api);
				},
				apiDeActivated: function(e, d){
					control.removeClass(prefix + d.api);
				}
			})
			.bind('playing totalerror waiting flashblocker', function(e){
				removeStateClasses();
				control.addClass(prefix + e.type);
			})
			.bind('play', function(){
				control.removeClass(prefix + 'idle');
			})
			.bind('pause ended mediareset', function(e){
				removeStateClasses();
				control.addClass(prefix +'idle');
			})
			.bind('canplay', function(e){
				control.removeClass(prefix +'waiting');
			})
		;
	};
	
	(function(){
		var sliderMethod 	= ($.fn.a11ySlider) ? 'a11ySlider' : 'slider';
		var sliderOpts = {range: false, animate: false};
		
		$(function(){
			sliderMethod = ($.fn.a11ySlider) ? 'a11ySlider' : 'slider';
		});
		
		$.fn.jmeControl.addControls([
			{
				name: 'timeline-slider',
				optionName: 'timeSlider',
				options: sliderOpts,
				fn: function(control, mm, api, o){
					var stopSlide 		= false,
						changeTimeState = function(e, ui){
							var time = parseInt( ui.timeProgress, 10 );
							if(ui.timeProgress !== undefined && !stopSlide ){
								control[sliderMethod]('value', ui.timeProgress);
							}
						},
						changeDisabledState = function(){
							if(api.apis[api.name].loadedmeta && api.apis[api.name].loadedmeta.duration){
								control[sliderMethod]('option', 'step', 100 / Math.max( 100, control[0].offsetWidth ) );
								control[sliderMethod]('option', 'disabled', false);
							} else {
								control[sliderMethod]('option', 'disabled', true);
							}
						}
					;
					
					control[sliderMethod](o.timeSlider)[sliderMethod]('option', 'disabled', true);
					$(window).bind('resize', changeDisabledState);
					$(document).bind('emchange', changeDisabledState);
					mm
						.bind('loadedmeta resize', changeDisabledState)
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
				}
			},
			{
				name: 'volume-slider',
				options: $.extend( {mutestate: false}, sliderOpts ),
				fn: function(control, mm, api, o){
						var stopSlide = false;
						
						control[sliderMethod](o.volumeSlider)[sliderMethod]('option', 'disabled', true);
						
						function changeVolumeUI(e, data){
							if (stopSlide) {return;}
							if(e.type == 'volumelevelchange') {
								control[sliderMethod]('value', data.volumelevel);
							} else {
								control[sliderMethod]('value', ( mm.muted() ) ? 0 : mm.volume() );
							}
							
						}
						
						control
							.bind('slidestart', function(e){
								if (e.originalEvent) {
									stopSlide = true;
								}
							})
							.bind('slidestop', function(){
								stopSlide = false;
							})
							.bind('slide', function(e, ui){
								if(e.originalEvent && api.apis[api.name].isAPIReady){
									api.apis[api.name].volume(ui.value);
									if( o.volumeSlider.mutestate && api.apis[api.name].muted() ){
										api.apis[api.name].muted(false);
									}
								}
							})
						;
						
						mm
							.bind('volumelevelchange loadedmeta', changeVolumeUI)
							.jmeReady(function(){
								control[sliderMethod]('option', 'disabled', false);
								changeVolumeUI({type: 'ready'});
							})
						;
						//todo!!!
						if(o.volumeSlider.mutestate){
							mm.bind('mute', changeVolumeUI);
						}
					}
			},
			{
				name: 'progressbar',
				fn: function(control, mm, api, o){
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
					
				}
			}
		]);
	})();
})(jQuery);