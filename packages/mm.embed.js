/**!
 * Part of the jMediaelement-Project vpre1.3.5 | http://github.com/aFarkas/jMediaelement
 * @author Alexander Farkas
 * Copyright 2010, Alexander Farkas
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */

(function($){
	$.multimediaSupport = {};
	var m 		= $.multimediaSupport,
		vID 	= new Date().getTime(),
		doc		= document,
		tVid 	= $('<video />')[0],
		//this bad assumption isn't really true, but our workaround-implementation doesn't really hurt
		supportMediaPreload = !( 'webkitPreservesPitch' in tVid && parseFloat($.browser.version, 10) < 535 && (navigator.userAgent.indexOf('Chrome') !== -1 || navigator.userAgent.indexOf('Mac') === -1) )
	;
	// support test + document.createElement trick
	$.support.video = !!(tVid.canPlayType);
	$.support.autoBuffer = !!('autobuffer' in tVid);
	$.support.audio = !!($('<audio />')[0].canPlayType);
	
	tVid = null;
	
	$('<source />');
	$('<track />');
	
	$.support.mediaElements = ($.support.video && $.support.audio);
	$.support.dynamicHTML5 = !!($('<video><div></div></video>')[0].innerHTML);
	$.support.mediaLoop = ('loop' in $('<video />')[0]);
	$.browser.deprecatedPoster = !supportMediaPreload;
	
	// HTML5 shiv document.createElement does not work with dynamic inserted elements
	// thanks to jdbartlett for this simple script
	// see also http://jdbartlett.github.com/innershiv/
	$.fixHTML5 = (function(){
		var d, b;
		return ($.support.dynamicHTML5) ? 
			function(h){return h;} :
			function(h) {
				if (!d) {
					b = document.body;
					d = document.createElement('div');
					d.style.display = 'none';
				}
				var e = d.cloneNode(false);
				b.appendChild(e);
				e.innerHTML = h;
				b.removeChild(e);
				return e.childNodes;
			}
		;
	})();
	
	
	
	var cssShow 		= { left: "0px", position: "absolute", visibility: "hidden", display:"block" },
		dimStyles = ['float']
	;
	
	$.each(['Top', 'Left', 'Right', 'Bottom'], function(i, name){
		dimStyles.push('margin'+ name);
		dimStyles.push('padding'+ name);
		dimStyles.push('border'+ name +'Width');
		setTimeout(function(){
			m._transferStyles.push('border'+ name +'Color');
			m._transferStyles.push('border'+ name +'Style');
		}, 1);
	});
	$.fn.getDimensions = function(){
		var ret = {width: 0, height: 0};
		if(this[0]){
			var elem = this,
				elmS = this[0].style
			;
			// assume that inline style is correct
			// enables %, em etc. feature with inline-style (i.e.: 100%)
			ret.height = elmS.height || this.height();
			ret.width = elmS.width || this.width();
			$.each(dimStyles, function(i, name){
				// assume that inline style is correct
				ret[name] = elmS[name] || elem.css(name);
			});
		}
		return ret;
	};
	
	
	
	var oldAttr 		= $.attr,
		attrElems 		= /video|audio|source/i,
		srcNames 		= {
					src: 1,
					poster: 1
				},
		booleanNames 	= {
					loop: 1,
					autoplay: 1,
					controls: 1
				},
		mixedNames 		= {
			srces: 1,
			getConfig: 1,
			preload: 1
		},
		preloadVals = {
			auto: 1,
			metadata: 1,
			none: 1
		} 
	;
	
	var fixPreload = {
		change: function(elem, setPreload, force){
			if( !$.support.mediaElements ){return;}
			var _preload = elem.getAttribute('preload') || 'metadata';
			if( force || setPreload !== _preload ){
				if( !supportMediaPreload ){
					if( setPreload === 'none' || (_preload === 'none' && (setPreload === 'auto' || !elem.getAttribute('poster')) ) ){
						$(elem).unbind('play', fixPreload.changePlayMode);
						if(setPreload === 'none'){
							$(elem).bind('play', fixPreload.changePlayMode);
						}
						$.attr(elem, 'srces', $.attr(elem, 'srces'), setPreload);
					}
				} else if( $.support.autoBuffer ){
					elem.autobuffer = !!(setPreload === 'auto');
				}
			}
		},
		changeAutoplay: function(elem, autoplay){
			if( $.support.mediaElements && !supportMediaPreload && $.attr(elem, 'preload') === 'none' && autoplay !== $.attr(elem, 'autoplay')){
				var srces = $.attr(elem, 'srces');
				$.attr(elem, 'srces', srces, 'auto');
				if( srces.length && autoplay ){
					setTimeout(function(){
						if(elem.play && $(elem).getMediaAPI() === 'nativ' ){
							elem.play();
						}
					}, 9);
				}
			}
		},
		changePlayMode: function(){
			fixPreload.changeAutoplay(this, true);
		},
		addSrces: function(elem, srces, preload){
			if( supportMediaPreload || !$.support.mediaElements ){
				return false;
			}
			
			preload = preload || $.attr(elem, 'preload');
			$(elem).unbind('play', fixPreload.changePlayMode);
			if( preload === 'auto' || $.attr(elem, 'autoplay') ){return $.data(elem, 'jme-srces', false);}
			$(elem).bind('play', fixPreload.changePlayMode);
			$.data(elem, 'jme-srces', srces);
			return true;
		}
	};
	$.attr = function(elem, name, value, preloadPass){
		
		if( !(elem.nodeName && attrElems.test(elem.nodeName) && (mixedNames[name] || booleanNames[name] || srcNames[name])) ){
			return oldAttr(elem, name, value, preloadPass);
		}
		
		var set = (value !== undefined), elemName, api, ret;
		
		if(!set){
			if(booleanNames[name]){
				return ( typeof elem[name] === 'boolean' ) ? elem[name] : !!((elem.attributes[name] || {}).specified);
			}
			if(srcNames[name]){
				return $.support.video && elem[name] || m.makeAbsURI(elem.getAttribute(name));
			}
			switch(name) {
				case 'srces':
					ret = $.data(elem, 'jme-srces');
					if(ret){break;}
					
					ret = $.attr(elem, 'src');
					if( ret ){
						ret = [{
								src: ret,
								type: elem.getAttribute('type'),
								media: elem.getAttribute('media')
							}]
						;
					} else {
						ret = [];
						$('source', elem).each(function(i){
							ret.push({
								src: $.attr(this, 'src'),
								type: this.getAttribute('type'),
								media: this.getAttribute('media')
							});
						});
						// safari without quicktime ignores source-tags, initially
						if(!ret.length){
							$('a.source', elem).each(function(){
								ret.push({
									src: this.href,
									type: this.getAttribute('type'),
									media: this.getAttribute('data-media')
								});
							});
						}
					}
					break;
				case 'getConfig':
					ret = {};
					$.each(['autoplay', 'loop', 'controls', 'poster', 'preload'], function(i, name){
						ret[name] = $.attr(elem, name);
					});
					break;
				case 'preload':
					ret = elem.preload || elem.getAttribute('preload');
					if(ret === ''){
						ret = 'auto';
					}
					if(!preloadVals[ret]){
						ret = 'metadata';
					}
					break;
			}
			return ret;
		} else {
			if(booleanNames[name]){
				value = !!(value);
				elem[name] = value;
				if(name === 'autoplay'){
					fixPreload.changeAutoplay(elem, value);
				}
				if(value){
					elem[name] = value;
					elem.setAttribute(name, name);
				} else {
					elem[name] = value;
					elem.removeAttribute(name);
				}
			} else if(srcNames[name]){
				elem.setAttribute(name, value);
			} else if (name === 'srces') {
				$('source, a.source', elem).remove();
				elem.removeAttribute('src');
				value = $.isArray(value) ? value : [value];
				if(fixPreload.addSrces(elem, value, preloadPass)){return;}
				$.each(value, function(i, src){
					
					ret = doc.createElement('source');
					if(typeof src === 'string'){
						src = {src: src};
					}
					ret.setAttribute('src', src.src);
					if(src.type){
						ret.setAttribute('type', src.type);
					}
					if(src.media){
						ret.setAttribute('media', src.media);
					}
					elem.appendChild(ret);
				});
			} else if(name === 'getConfig'){
				//works, but you shouldn´t use as a setter
				$.each(value, function(n, v){
					$.attr(elem, n, v);
				});
			} else if(name === 'preload'){
				if(value === ''){
					value = 'auto';
				} else if(!preloadVals[value]){
					value = 'metadata';
				}
				fixPreload.change(elem, value, preloadPass);
				elem.setAttribute(name, value);
			}
		}
	};
	
	function sourceError(){
		$.event.special.mediaerror.handler.apply($(this).closest('video, audio')[0], arguments);
	}
	
	function bindSource(e){
		if(!$.support.mediaElements){return;}
		
		var apis = $.data(this, 'mediaElemSupport');
		if(!apis || !apis.apis){return;}
		//reset error
		if(e && e.type){
			$.data(this, 'calledMediaError', false);
		}
		apis = apis.apis;
		
		//webkit is really stupid with the error event, so fallback to canPlaytype
		var elem 	= this,
			srces 	= $.attr(this, 'srces')
		;
		
		if( elem.error || (srces.length && !apis.nativ.canPlaySrces(srces)) ){
			$.event.special.mediaerror.handler.call(this, $.Event('mediaerror'));
			//stop trying to play
			try {
				elem.pause();
			} catch(er){}
		}
				
		//bind error 
		$('source', this)
			.unbind('error', sourceError)
			.filter(':last')
			.bind('error', sourceError)
		;
	}
	
	$.event.special.mediaerror = {
		setup: function(){
			//ff always triggers an error on video/audio | w3c/webkit/opera triggers error event on source, if available
			var media = $(this)
				.bind('error', $.event.special.mediaerror.handler)
				//older webkit do not support emptied
				.bind('native_mediareset', bindSource)
			;
			//bindSource can trigger mediaerror, but event is always bound after setup
			setTimeout(function(){
				media.each(bindSource);
			}, 0);
		},
		teardown: function(){
			$(this)
				.unbind('error', $.event.special.mediaerror.handler)
				.find('source')
				.unbind('error', sourceError)
			;
		},
		handler: function(e){
			if($.data(this, 'calledMediaError')){return;}
			e = $.extend({}, e || {}, {type: 'mediaerror'});
			$.data(this, 'calledMediaError', true);
			return $.event.handle.apply(this, arguments);
		}
	};
	
	m.getExt = function(src){
		var pos = src.indexOf('?'),
			ext = ''
		;
		src = (pos > 0) ? src.substring(0, pos) : src;
		pos = src.lastIndexOf('.') + 1;
		ext = src.substr(pos);
		return (ext && ext.toLowerCase) ? ext.toLowerCase() : ext;
	};


	var getExt = m.getExt;
	var mimeTypes = {
			audio: {
				//ogm shouldn´t be used!
				'audio/ogg': ['ogg','oga', 'ogm'],
				'audio/mpeg': ['mp2','mp3','mpga','mpega'],
				'audio/mp4': ['mp4','mpg4', 'm4r'],
				'audio/wav': ['wav'],
				'audio/x-m4a': ['m4a'],
				'audio/x-m4p': ['m4p'],
				'audio/3gpp': ['3gp','3gpp'],
				'audio/webm': ['webm']
			},
			video: {
				//ogm shouldn´t be used!
				'video/ogg': ['ogg','ogv', 'ogm'],
				'video/mpeg': ['mpg','mpeg','mpe'],
				'video/mp4': ['mp4','mpg4', 'm4v'],
				'video/quicktime': ['mov','qt'],
				'video/x-msvideo': ['avi'],
				'video/x-ms-asf': ['asf', 'asx'],
				'video/flv': ['flv', 'f4v'],
				'video/3gpp': ['3gp','3gpp'],
				'video/webm': ['webm']
			}
		}
	;
	
	
	$.extend(m, {
		jsPath: (function(){
			var scripts = $('script'),
				path = scripts[scripts.length - 1].src.split('?')[0]
			;
			return path.slice(0, path.lastIndexOf("/") + 1);
		})(),
		extendWithData: (function(){
			var allowedVals ={
				string: 1,
				number: 1,
				'boolean': 1
			};
			return function(elem, target, obj){
				if(!obj){
					obj = target;
				}
				$.each(obj, $.isArray(obj) ? 
					function(i, name){
						m.getData(elem, name, target);
					} :
					function(name, val){
						if(allowedVals[typeof val]){
							m.getData(elem, name, target);
						}
					}
				);
				return target;
			};
		})(),
		getData: (function(){
			var getVal = function(elem, name){
				var val = elem.getAttribute('data-'+ name);
				if(!val && val !== ''){
					return undefined;
				}
								
				return (val * 1 == val) ? 
					parseFloat(val, 10) :
					(val === 'false') ?
					false :
					(val === 'true') ?
					true :
					val
				;
			};
			return function(elem, arr, ret){
				var name = arr;
				ret = ret || {};
				if(typeof arr === 'string'){
					arr = [name];
				}
				
				$.each(arr, $.isArray(arr) ? 
					function(i, name){
						var val = getVal(elem, name);
						if(val !== undefined){
							ret[name] = val;
						}
					} :
					function(name){
						var val = getVal(elem, name);
						if(val !== undefined){
							ret[name] = val;
						}
					}
				);
				return ret;
			};
		})(),
		registerMimetype: function(elemName, mimeObj){
			if(arguments.length === 1){
				$.each(mimeTypes, function(name){
					m.registerMimetype(name, elemName);
				});
				return;
			}
			$.each(mimeObj, function(mime, exts){
				if(mimeTypes[elemName][mime]){
					mimeTypes[elemName][mime] = [];
				}
				mimeTypes[elemName][mime] = mimeTypes[elemName][mime].concat(exts);
			});
			
		},
		_showMimeTypes: function(){
			if(window.console){
				console.log(mimeTypes);
			}
		},
		add: function(name, elemName, api){
			if(!this.apis[elemName][name]){
				this.apis[elemName][name] = m.beget(this.fn);
				if(name !== 'nativ' && $.inArray(name, $.fn.jmeEmbed.defaults.apiOrder) === -1){
					$.fn.jmeEmbed.defaults.apiOrder.push(name);
				}
			} 
			$.extend(true, this.apis[elemName][name], api);
		},
		fn: {
			_init: $.noop,
			canPlayType: function(type){
				var elem = this.apiElem,
					ret
				;
				if(elem && elem.canPlayType){
					ret = elem.canPlayType(type);
					return (ret === 'no') ? '' : ret;
				}
				var parts 	= m.extractContainerCodecsFormType(type),
					that 	= this
				;
				ret		= 'probably';
				if(!parts[1]){
					return (this.canPlayContainer && $.inArray(parts[0], this.canPlayContainer) !== -1) ? 'maybe' : '';
				}
				$.each(parts[1], function(i, part){
					if(!that.canPlayCodecs || $.inArray(part, that.canPlayCodecs) === -1){
						ret = '';
						return false;
					}
				});
				return ret;
			},
			canPlaySrc: function(src){
				var that = this;
				if(typeof src !== 'string'){
					if(src.type){
						return this.canPlayType(src.type);
					}
					src = src.src;
				}
				
				var ext = getExt(src), ret = '';
				$.each(mimeTypes[this.nodeName], function(mime, exts){
					var index = $.inArray(ext, exts);
					if(index !== -1){
						ret = that.canPlayType(mime);
						return false;
					}
				});
				return ret;
			},
			canPlaySrces: function(srces){
				srces = srces || $.attr(this.element, 'srces');
				if(!$.isArray(srces)){
					srces = [srces];
				}
				var that 	= this,
					canplay = false,
					src 	= ''
				;
				$.each(srces, function(i, curSrc){
					canplay = that.canPlaySrc(curSrc);
					if(canplay){
						src = curSrc;
						return false;
					}
				});
				return src;
			},
			_setActive: $.noop,
			_setInactive: $.noop,
			_trigger: function(e){$(this.element).triggerHandler(e, e);}
		},
		apis: {
			audio: {},
			video: {}
		},
		extractContainerCodecsFormType: function(type){
			var types = type.split(/\s*;\s*/g);
			if(types[1] && types[1].indexOf('codecs') !== -1){
				types[1] = types[1].replace(/["|']$/, '').replace(/^\s*codecs=('|")/, '').split(/\s*,\s*/g);
			}
			return types;
		},
		makeAbsURI: (function(){
			return function(src){
				if(src && typeof src === 'string'){
					src = $('<a href="'+ src +'"></a>')[0].href;
				}
				return src;
			};
		})(),
		// simple, but powerfull
		beget: function(sup){
			var F = function(){};
			F.prototype = sup;
			return new F();
		},
		_create: function(elemName, supType, element, opts){
			var data = $.data(element, 'mediaElemSupport') || $.data(element, 'mediaElemSupport', {apis: {}, nodeName: elemName});
			if(!data.apis[supType]){
				data.apis[supType] = m.beget( m.apis[elemName][supType]);
				data.apis[supType].element = element;
				data.apis[supType].nodeName = elemName;
				data.apis[supType].name = supType;
				data.apis[supType].data = {};
				data.apis[supType].embedOpts = opts;
			}
			return data;
		},
		_transferStyles: [
			'backgroundColor', 'backgroundPosition', 'backgroundImage', 'backgroundRepeat', 'background-attachment'
		],
		_setAPIActive: function(element, supType){
			var data 		= $.data(element, 'mediaElemSupport'),
				oldActive 	= data.name
			;
			if(oldActive === supType){return true;}
			
			var hideElem = data.apis[oldActive].apiElem,
				showElem = data.apis[supType] && data.apis[supType].apiElem,
				apiReady = false
			;
			
			if(showElem && showElem.nodeName){
				if(data.nodeName !== 'audio' || $.attr(element, 'controls')){
					if(supType === 'nativ'){
						data.apis[supType].visualElem.css({display: ''});
					} else {
						data.apis[supType].visualElem
							.css( $.extend({visibility: ''}, data.apis[oldActive].visualElem.getDimensions())  )
						;
					}
				}
				data.apis[supType]._setActive(oldActive);
				apiReady = true;
				
				data.apis[supType]._trigger({type: 'apiActivated', api: supType});
				if( data.apis[oldActive] ){
					if( data.apis[oldActive]._volumelevelState !== undefined ){
						$(element).volumelevel(data.apis[oldActive]._volumelevelState);
					}
					if( data.apis[oldActive]._muteState !== undefined ){
						$(element).muted(data.apis[oldActive]._muteState);
					}
					if(data.apis[oldActive].visualElem){
						$.each(m._transferStyles, function(i, name){
							data.apis[supType].visualElem.css(name, data.apis[oldActive].visualElem.css(name));	
						});
					}
				}
				
			}
			data.apis[supType].isAPIActive = true;
			if(hideElem && hideElem.nodeName){
				if(oldActive === 'nativ'){
					hideElem.style.display = 'none';
				} else {
					data.apis[oldActive].visualElem
						.css({
							height: 0,
							width: 0,
							visibility: 'hidden'
						})
					;
				}
				data.apis[oldActive]._setInactive(supType);
				data.apis[oldActive].isAPIActive = false;
				data.apis[supType]._trigger({type: 'apiDeActivated', api: oldActive});
			}
			
			data.name = supType;
			
			return apiReady;
		},
		getSuitedPlayers: function(elem, apiOrder){
			var apis = $.data(elem, 'mediaElemSupport');
			if(!apis || !apis.apis){return;}
			apis = apis.apis;
			var srces 		= $.attr(elem, 'srces'),
				supported 	= false,
				getSupported = function(name, api){
					if( (typeof api.isTechAvailable === 'boolean' && !api.isTechAvailable) || ( $.isFunction(api.isTechAvailable) && !api.isTechAvailable() ) ){
						return;
					}
					var src = api.canPlaySrces(srces);
					
					if(src){
						supported = {
							src: src.src || src,
							name: name
						};
					}
					return supported;
				}
			;
			if(!srces.length){return 'noSource';}
			if(apiOrder){
				$.each(apiOrder, function(i, name){
					return !(getSupported(name, apis[name]));
				});
			} else {
				$.each(apis, function(name, api){
					return !(getSupported(name, api));
				});
			}
			return supported;
		},
		_embedApi: function(elem, supported, apiData){
			var config 	= $.attr(elem, 'getConfig'),
				jElm 	= $(elem),
				dims 	= {},
				id 		= elem.id,
				fn 		= function(apiElem){
							apiData.apis[supported.name].apiElem = apiElem;
							$(apiElem).addClass(apiData.nodeName);
							if(!config.controls){
								$(apiElem).attr({
									tabindex: '-1',
									role: 'presentation'
								});
							}
							apiData.apis[supported.name]._init();
							apiData.apis[supported.name]._trigger({type: 'apiActivated', api: supported.name});
						},
				label 	= jElm.attr('aria-labelledby')
			;
			
			if(!id){
				vID++;
				id = apiData.nodeName +'-'+vID;
				elem.id = id;
			}
			apiData.apis[supported.name].visualElem = $('<div class="media-element-box mm-'+ apiData.nodeName +'-box" style="position: relative;" />').insertBefore(elem);
			
			if(label){
				apiData.apis[supported.name].visualElem.attr({
					role: 'group',
					'aria-labelledby': label
				});
			}
			
			if(apiData.nodeName === 'audio' && !config.controls){
				apiData.apis[supported.name].visualElem
					.css({
						height: 0,
						width: 0
					})
				;
			} else {
				apiData.apis[supported.name].visualElem
					.css( jElm.getDimensions() )
				;
				$.each(m._transferStyles, function(i, name){
					apiData.apis[supported.name].visualElem.css(name, jElm.css(name));	
				});
			}
			apiData.apis[supported.name]._embed(supported.src, apiData.name +'-'+ id, config, fn);
		},
		getPluginVersion: function(name, plugDesc){
			var plugin 	= plugDesc || (navigator.plugins && navigator.plugins[name]),
				version = [-1, 0],
				desc
			;
			if(plugin){
				desc = (plugin.description || '').replace(/,/g, '.').match(/(\d+)/g) || ['0'];
				if(desc && desc[0]){
				    version[0] = desc[0];
					if(desc[1]){
					    version[0] += '.'+desc[1];
					}
					version[0] = parseFloat(version[0], 10);
					if(desc[2]){
					    version[1] = parseInt(desc[2], 10);
					}
				}
			}
			return version;
		},
		embedObject: function(elem, id, attrs, params, activeXAttrs, pluginName){
			elem.style.overflow = 'hidden';
			elem = $('<div />').prependTo(elem)[0];
			var obj;
			
			if(navigator.plugins && navigator.plugins.length){ 
				obj = doc.createElement('object');
				$.each(attrs, function(name, val){
					obj.setAttribute(name, val);
				});
				
				$.each(params, function(name, val){
					var param = doc.createElement('param');
					param.setAttribute('name', name);
					param.setAttribute('value', val);
					obj.appendChild(param);
				});
				obj.setAttribute('id', id);
				obj.setAttribute('name', id);
				if(params.wmode === 'transparent'){
					obj.style.minHeight = '1px';
					obj.style.minHeight = '1px';
				} 
				elem.parentNode.replaceChild(obj, elem);
			} else if(window.ActiveXObject){
				obj = '<object style="width: 100%; height: 100%; width="100%" height="100%"';
				$.each($.extend({}, attrs, activeXAttrs), function(name, val){
					obj += ' '+ name +'="'+ val +'"';
				});
				obj += ' name="'+ id +'"';
				obj += ' id="'+ id +'"';
				obj += '>';
				$.each(params, function(name, val){
					obj += ' <param name="'+ name +'" value="'+ val +'" />';
				});
				obj += '</object>';
				elem.outerHTML = obj;
				obj = doc.getElementById(id);
			}
			if(obj){
				obj.setAttribute('width', '100%');
				obj.setAttribute('height', '100%');
			}
			$(window).unload(function(){
				jQuery.cleanData( [ obj ] );
				obj = null;
			});
//			vlc in ie is a little stupid here
			setTimeout(function(){
				if( !obj || !obj.style ){return;}
				obj.style.width = '100%';
				obj.style.height = '100%';
			}, 0);
			return obj;
		}
	});
	
	m.add('nativ', 'video', {});
	m.add('nativ', 'audio', {});
	
	function findInitFallback(elem, opts){
		var elemName 	= elem.nodeName.toLowerCase();
		
		//getSupportedSrc and Player
		var supported = m.getSuitedPlayers(elem, opts.apiOrder),
			apiData	= $.data(elem, 'mediaElemSupport')
		;
		
		// important total fail error event
		if(!supported){
			apiData.apis.nativ._trigger({type: 'totalerror'});
			try {
				elem.pause();
			} catch(e){}
			return;
		}
		if(supported === 'noSource'){
			apiData.noSource = true;
			return;
		}
		//_setAPIActive returns false if player isn´t embeded
		if(!m._setAPIActive(elem, supported.name)){
			m._embedApi(elem, supported, apiData, elemName);
		} else if(apiData.apis[supported.name]._mmload){
			apiData.apis[supported.name]._mmload(supported.src, $.attr(elem, 'poster'));
		}
	}
	
	var showFallback = function(){
		var fallback = $(this).hide().children(':not(source, track)').clone().insertAfter(this);
		$(this).one('mediareset', function(){
			 $(this).show();
			 fallback.remove();
		});
	};
	
	
	
	$.fn.jmeEmbed = function(opts){
		opts = $.extend(true, {}, $.fn.jmeEmbed.defaults, opts);
		if(opts.showFallback && $.support.mediaElements){
			this.bind('totalerror', showFallback);
		}
		
		return this.each(function(){
			var elemName 	= this.nodeName.toLowerCase(),
				supported 	= false,
				elem = this
			;
			
			if(elemName !== 'video' && elemName !== 'audio' || ($.support.flash9 && $.nodeName(elem.parentNode, 'object'))){return;}
			
			//remove swf fallback
			$('object, embed', this)
				.each(function(){
					$('> *:not(param, embed, object)', this).appendTo(elem);
				})
				.remove()
			;
			
			$(this).trigger('jmeBeforeEmbed', {
					options: opts,
					nodeName: elemName
				})
			;
			if(opts.removeControls){
				$.attr(this, 'controls', false);
			}
			
			var apiData = m._create(elemName, 'nativ', this, opts);
			apiData.name = 'nativ';
			apiData.apis.nativ.apiElem = this;
			apiData.apis.nativ.visualElem = $(this);
			apiData.apis.nativ.isAPIActive = true;
			$.each(m.apis[elemName], function(name){
				if(name !== 'nativ'){
					m._create(elemName, name, elem, opts);
				}
			});
			
			$(this)
				.bind('mediaerror', function(e){
					if(apiData.name === 'nativ'){
						findInitFallback(this, opts);
					}
				})
			;
			
			if($.support.flash9 && opts.activateFlash && opts.flashPlayer){
				supported = m.getSuitedPlayers(elem, [opts.flashPlayer]);
				if( supported == 'noSource' ){
					supported = {name: opts.flashPlayer};
				}
				apiData.apis.nativ.isAPIReady = true;
				if(supported.name == opts.flashPlayer && !m._setAPIActive(this, opts.flashPlayer)){
					m._embedApi(this, supported, apiData, elemName);
				} else {
					supported = false;
				}
			} 
			if( !supported ){
				if(opts.debug || !$.support.mediaElements){
					 findInitFallback(this, opts);
					 apiData.apis.nativ.isAPIReady = true;
				} else {
					apiData.apis.nativ._init();
				}
			}
			$.attr(this, 'preload', $.attr(this, 'preload'), true);
			
			$(this)
				.trigger('jmeEmbed', {
					options: opts,
					nodeName: elemName,
					data: apiData
				})
			;
		});
	};
	
	$.fn.jmeEmbed.defaults = {
		debug: false,
		removeControls: false,
		showFallback: false,
		apiOrder: [],
		activateFlash: false,
		flashPlayer: ''
	};
	
	// deprecated
	$.fn.mediaElementEmbed = $.fn.jmeEmbed;
	
	if($.cleanData && window.ActiveXObject){
		var _cleanData = $.cleanData;
		$.cleanData = function(elems){
			_cleanData(elems);
			for(var i = 0, len = elems.length; i < len; i++){
				if(elems[i].nodeName === 'OBJECT'){
					try {
						for (var j in elems[i]) {
							if (typeof elems[i][j] === "function") {
								elems[i][j] = null;
							}
						}
					} catch(e){}
				}
			}
		};
	}
	
})(jQuery);/**!
 * Part of the jMediaelement-Project | http://github.com/aFarkas/jMediaelement
 * @author Alexander Farkas
 * Copyright 2010, Alexander Farkas
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */

(function($){
	
	var swfAttr = {type: 'application/x-shockwave-flash'},
		aXAttrs = {classid: 'clsid:D27CDB6E-AE6D-11cf-96B8-444553540000'},
		m 		= $.multimediaSupport
	;
	
	$.extend($.fn.jmeEmbed.defaults, 
			{
				flashPlayer: 'jwPlayer',
				jwPlayer: {
					path: m.jsPath + 'player.swf',
					hideIcons: 'auto',
					vars: {},
					attrs: {},
					plugins: {},
					params: {
						allowscriptaccess: 'always',
						allowfullscreen: 'true'
					}
				}
			}
		)
	;
	
	$(function(){
		var path = ($('script.jwPlayer')[0] || {}).src;
		if(path){
			$.fn.jmeEmbed.defaults.jwPlayer.path = path;
		}
	});
		
	var regs = {
			A: /&amp;/g,
			a: /&/g,
			e: /\=/g,
			q: /\?/g
		},
		providerMatch = {
			audio: 'sound',
			video: 'video'
		},
		replaceVar = function(val){
			return (val.replace) ? val.replace(regs.A, '%26').replace(regs.a, '%26').replace(regs.e, '%3D').replace(regs.q, '%3F') : val;
		}
	;
	
	
	
	(function(){
		$.support.flash9 = false;
		$.support.flashVersion = 0;
		var swf 				= m.getPluginVersion('Shockwave Flash'),
			supportsMovieStar 	= function(obj, _retest){
				$.support.flash9 = false;
					try {
						//opera needs typeof check do not use 'GetVariable' in obj
						if (obj && typeof obj.GetVariable !== 'undefined') {
							var version = obj.GetVariable("$version");
							obj = m.getPluginVersion('', {
								description: version
							});
							$.support.flashVersion = obj[0];
							$.support.flash9 = !!(obj[0] > 9 || (obj[0] === 9 && obj[1] >= 115));
						}
					} catch (e) {}
				
			}
		;
		if(swf && swf[0]){
			$.support.flashVersion = swf[0];
		}
		if(swf[0] > 9 || (swf[0] === 9 && swf[1] >= 115)){
			//temp result
			
			$.support.flash9 = true;
			$(function(){
				swf = $('<object />', swfAttr).appendTo('body');
				supportsMovieStar(swf[0]);
				swf.remove();
			});
		} else if(window.ActiveXObject){
			try {
				swf = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
				supportsMovieStar(swf);
				swf = null;
			} catch(e){}
		}
	})();
	
	var jwMM 	= {
			isTechAvailable: function(){
				return $.support.flash9;
			},
			_extendJWLoad: function(src, obj, elem){
				if(!src){return;}
				
				elem = elem || this.element;
				var changeVars = this.embedOpts.jwPlayer.changeVars;
				m.extendWithData(elem, obj, ['type', 'provider', 'stretching', 'bufferlength', 'streamer']);
				obj.file = (elem.getAttribute('data-jwprefixsrc') || '') + obj.file; 
				// if we can't autodetect provider by file-extension,
				// we add a provider
				var ext = m.getExt(src),
					name = (ext == 'm4r') ? 'video' : this.nodeName
				;
				if(ext == 'm4r' || !this.canPlaySrc(src)){
					if(!obj.provider){
						obj.provider = providerMatch[name];
					}
					if(!obj.type){
						obj.type = providerMatch[name];
					}
				}
				if(changeVars){
					changeVars(src, obj, elem, this);
				}
				return obj;
			},
			_embed: function(src, id, cfg, fn){
				var opts 		= this.embedOpts.jwPlayer,
					vars 		= $.extend({}, opts.vars, {file: src, id: id}),
					attrs	 	= $.extend({name: id}, opts.attrs, swfAttr, !(window.ActiveXObject) ? {data: opts.path} : {}),
					params 		= $.extend({movie: opts.path}, opts.params),
					plugins 	= [],
					that 		= this
				;
				
				this._extendJWLoad(src, vars);
				
				if(cfg.poster){
					vars.image = cfg.poster;
				}
												
				vars.autostart = ''+ cfg.autoplay;
				vars.repeat = (cfg.loop) ? 'single' : 'false';
				vars.controlbar = (cfg.controls) ? 'bottom' : 'none';
				
				if( !cfg.controls && this.nodeName !== 'audio' && params.wmode === undefined ){
					params.wmode = 'transparent';
				}
				
				if( (!cfg.controls && opts.hideIcons && params.wmode === 'transparent') || opts.hideIcons === true ){
					vars.icons = 'false';
					vars.showicons = 'false';
				}
				
				if( params.wmode === 'transparent' && !vars.screencolor && !attrs.bgcolor ){
					vars.screencolor = 'ffffffff';
					attrs.bgcolor = '#000000';
				}
				
				params.flashvars = [];
				$.each(vars, function(name, val){
					params.flashvars.push(replaceVar(name)+'='+replaceVar(val));
				});
				
				$.each(opts.plugins, function(name, src){
					plugins.push(src);
				});
				if(plugins.length){
					params.flashvars.push( 'plugins='+ ( plugins.join(',') ) );
				}
				params.flashvars = params.flashvars.join('&');
				fn(m.embedObject( this.visualElem[0], id, attrs, params, aXAttrs, 'Shockwave Flash' ));
				setTimeout(function(){
					var swf = $('object', that.visualElem)[0];
					if( !swf || (swf.style.display === 'none' && $('> *', that.visualElem).length > 1 ) ){
						$('div[bgactive]', that.visualElem).css({width: '100%', height: '100%'});
						that._trigger('flashblocker');
					}
				}, 9);
			},
			canPlaySrc: function(media){
				var ret 	= m.fn.canPlaySrc.apply(this, arguments), 
					index 	= -1,
					src 	= media.src || media
				;
				
				if( !ret && typeof src === 'string' ){
					index = src.indexOf('youtube.com/');
					if(index < 15 && index > 6){
						ret = 'maybe';
					}
				}
				
				return ret;
			},
			canPlayCodecs: ['avc1.42E01E', 'mp4a.40.2', 'avc1.58A01E', 'avc1.4D401E', 'avc1.64001E', 'VP6', 'mp3', 'AAC'],
			canPlayContainer: ['video/3gpp', 'video/x-msvideo', 'video/quicktime', 'video/x-m4v', 'video/mp4', 'video/m4p', 'video/x-flv', 'video/flv', 'audio/mpeg', 'audio/aac', 'audio/mp4', 'audio/x-m4a', 'audio/m4a', 'audio/mp3', 'audio/x-fla', 'audio/fla', 'youtube/flv', 'jwplayer/jwplayer']
		}
	;
	
	m.add('jwPlayer', 'video', jwMM);
	m.add('jwPlayer', 'audio', jwMM);
	
})(jQuery);
