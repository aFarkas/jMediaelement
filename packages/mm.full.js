/**!
 * Part of the jMediaelement-Project v1.3.5 | http://github.com/aFarkas/jMediaelement
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
					obj.style.minWidth = '1px';
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
	var video 			= document.createElement('video'), 
		$m 				= $.multimediaSupport,
		noAPIEvents 	= {
			apiActivated: 1,
			apiDeActivated: 1,
			mediareset: 1,
			native_mediareset: 1,
			//these are api-events, but shouldn´t throw mmAPIReady
			totalerror: 1,
			jmeflashRefresh: 1,
			flashblocker: 1
		},
		nuBubbleEvents 	= {
			native_mediareset: 1,
			apiDeActivated: 1,
			native_mediareset: 1,
			apiActivated: 1,
			timechange: 1,
			progresschange: 1,
			mmAPIReady: 1,
			jmeflashRefresh: 1
		},
		fsMethods		= {}
	;
	
	if('enterFullScreen' in video && video.supportsFullscreen){
		$.support.videoFullscreen = true;
		fsMethods.enter = 'enterFullScreen';
		fsMethods.exit = 'exitFullScreen';
	} else {
		$.each(['webkit', 'moz', 'o', 'ms'], function(i, name){
			if(name+'EnterFullScreen' in video && name+'SupportsFullscreen' in video){
				$.support.videoFullscreen = true;
				fsMethods.enter = name+'EnterFullScreen';
				fsMethods.exit = name+'ExitFullScreen';
				return false;
			}
		});
	}
	
	video = null;
	
	$.extend($m, {
		capturingEvents: function(names){
			if(!document.addEventListener){return;}
			if(typeof names == 'string'){
				names = [names];
			}
			$.each(names, function(i, name){
				var handler = function( e ) { 
					e = $.event.fix( e );
					return $.event.handle.call( this, e );
				};
				$.event.special[name] = $.event.special[name] || {};
				$.extend($.event.special[name], {
					setup: function() {
						this.addEventListener(name, handler, true);
					}, 
					teardown: function() { 
						this.removeEventListener(name, handler, true);
					}
				});
			});
		},
		formatTime: function(sec){
			return $.map(
				[
					parseInt(sec/60, 10),
					parseInt(sec%60, 10)
				], 
				function(num){
					return (isNaN(num)) ? '--' : (num < 10) ? ('0'+num) : num;
				})
				.join(':')
			;
		}
	});
	
	//mediaevents/most html5 events do not bubble normally, except in ff, we make them bubble, because we love this feature
	$m.capturingEvents('play pause playing waiting ended'.split(' '));
	//ToDo add jmeReady/mmAPIReady
	$.event.special.loadedmeta = {
	    add: function( details ) {
			var api = $(this).getJMEAPI();
			if(api && api.loadedmeta){
				var evt = $.extend({}, api.loadedmeta);
				details.handler.call(this, evt, evt);
			}
	    }
	};
	
	//extend fn
	$.extend($m.fn, {
		_trigger: function(e){
			var evt  = (e.type) ? e : {type: e},
				type = evt.type
			;
			
			switch(type){
				case 'mmAPIReady':
					if(this.isAPIReady){
						return;	
					}
					this.isAPIReady = true;
					break;
				case 'loadedmeta':
					this.loadedmeta = evt;
					break;
				case 'totalerror':
					this.totalerror = true;
					break;
				case 'mute':
					this._muteState = e.isMuted;
					break;
				case 'volumelevelchange':
					this._volumelevelState = e.volumelevel;
					break;
				case 'mediareset':
					this.loadedmeta = false;
					this.totalerror = false;
					this._bufferLoaded = false;
					break;
			}
			
			if(!this.isAPIActive || (this.totalerror && !noAPIEvents[type]) || this._stoppedEvents[type]){return;}
			if(!this.isAPIReady && !noAPIEvents[type]){
				this._trigger('mmAPIReady');
			}
			
			if(e.type === 'progresschange'){
				this._bufferLoaded = e.relLoaded;
			}
			
			e.target = this.element;
			e = $.Event(e);
			e.preventDefault();
			
			evt.mediaAPI = this.name;
			
			if($.fn.on){
				$.event.trigger( e, evt, this.element, !!(nuBubbleEvents[type]) );
			} else {
				if(nuBubbleEvents[type]){
					e.stopPropagation();
				}
				$.event.trigger( e, evt, this.element );
			}
		},
		_stoppedEvents: {},
		_stopEvent: function(name, autoAllow){
			this._stoppedEvents[name] = true;
			if(autoAllow){
				var that = this;
				setTimeout(function(){
					that._allowEvent(name);
				}, 9);
			}
		},
		_allowEvent: function(name){
			this._stoppedEvents[name] = false;
		},
		supportsFullScreen: function(){
			return this._videoFullscreen || false;
		},
		enterFullscreen: $.noop,
		exitFullscreen: $.noop,
		isAPIReady: false,
		isJMEReady: function(){
			return this.isAPIReady;
		},
		relCurrentTime: function(rel){
			var dur = this.getDuration() || Number.MIN_VALUE;
			if(rel && isFinite(rel)){
				this.currentTime(dur * rel / 100);
			}
			return this.currentTime() / dur * 100; 
		},
		getMediaAPI: function(){
			return this.name;
		},
		togglePlay: function(){
			this[(this.isPlaying()) ? 'pause' : 'play']();
		},
		toggleMuted: function(){
			this.muted(!(this.muted()));
		},
		getJMEVisual: function(){
			return this.visualElem;
		},
		jmeReady: function(fn, n){
			var e = {type: 'mmAPIReady'};
			if( this.isJMEReady() && (this.name !== 'nativ' || $.support.mediaElements) ){
				fn.call(this.element, e, e);
			} else {
				n = n || 'jmediaelement';
				var that = this,
					fn2	 = function(){
					$(that.element)
						.unbind('mmAPIReady.'+n, fn2)
						.unbind('jmeflashRefresh.'+n, fn2)
					;
					fn.call(that.element, e, e);
				};
				$(this.element)
					.bind('mmAPIReady.'+n, fn2)
					.bind('jmeflashRefresh.'+n, fn2)
				;
			}
		},
		unAPIReady: function(name){
			$(this.element).unbind('mmAPIReady.'+name);
		},
		_adjustPluginLoop: function(pluginLoop){
			var htmlLoop 	= $.attr(this.element, 'loop'),
				api 		= this
			;
			if(htmlLoop !== pluginLoop){
				setTimeout(function(){
					api[ (htmlLoop) ? 'play' : 'pause' ]();
				}, 0);
			}
		},
		_format: $m.formatTime,
		getFormattedDuration: function(){
			return this._format(this.getDuration());
		},
		getFormattedTime: function(){
			return this._format(this.currentTime());
		},
		loadSrc: function(srces, poster, mediaName, extras){
			if(srces){
				$.attr(this.element, 'srces', srces);
				srces = $.isArray(srces) ? srces : [srces];
			} else {
				srces = $.attr(this.element, 'srces');
			}
			
			if(poster !== undefined){
				if(poster){
					$.attr(this.element, 'poster', poster);
				} else {
					$(this.element).removeAttr('poster');
				}
			} else {
				poster = $.attr(this.element, 'poster');
			}
			var data = $.data(this.element, 'mediaElemSupport');
			if( typeof mediaName == 'string' ){
				if( data.mediaName ){
					data.mediaName.text(mediaName);
				}
			}
			
			data.noSource = !!(srces.length);
			
			this._isResetting = true;
			
			var canPlaySrc = this.canPlaySrces(srces);
			this._trigger('mediareset');
			if(canPlaySrc){
				canPlaySrc = canPlaySrc.src || canPlaySrc;
				this._mmload(canPlaySrc, poster, extras);
			} else {
				$m._setAPIActive(this.element, 'nativ');
				this._trigger('native_mediareset');
				$(this.element).data('mediaElemSupport').apis.nativ._mmload();
			}
			this._isResetting = false;
		},
		isPlaying: function(){
			return (this._isResetting) ? false : this._isPlaying();
		},
		_makenum: function(num){
			var ret = false;
			if(num == num * 1){
				ret = parseFloat(num, 10);
			}
			return ret;
		}
	});
	
	// firefox and old webkits (safari 4/chrome 4) are using an extended event, but safari uses load instead of progress
	// newer webkits are compilant to the current w3c specification (progress is a simple event + buffered is a timerange-object)
	// opera 10.5 hasn´t implemented the timerange-object yet <- no support
	var fixProgressEvent = function(api){
		var getConcerningRange 			= function(){
				var time 		= api.element.currentTime || 0,
					buffered 	= api.element.buffered,
					bufLen 		= buffered.length,
					ret 		= {}
				;
				
				for(var i = 0; i < bufLen; i++){
					ret.start = buffered.start(i);
					ret.end = buffered.end(i);
					if(ret.start <= time && ret.end >= time){
						break;
					}
				}
				return ret;
			},
			
			calculateProgress 	= function(e){
				var evt = {type: 'progresschange'}, 
					dur, bufRange
				;
				
				//current implementation -> chrome 5/safari 5
				if(this.buffered && this.buffered.length){
					
					dur = this.duration;
					if(dur){
						bufRange = getConcerningRange();
						evt.relStart = bufRange.start / dur * 100;
						evt.relLoaded = bufRange.end / dur * 100;
					}
					api._trigger(evt);
				//ff + safari4 implementation
				} else if(e.originalEvent && 'lengthComputable' in e.originalEvent && e.originalEvent.loaded){
					if(e.originalEvent.lengthComputable && e.originalEvent.total){
						evt.relStart = 0;
						evt.relLoaded = e.originalEvent.loaded / e.originalEvent.total * 100;
					}
					api._trigger(evt);
				} 
				//opera fallback
				if( !evt.relLoaded && this.readyState === 4 ){
					evt.relStart = 0;
					evt.relLoaded = 100;
					api._trigger(evt);
				}
				return evt.relLoaded;
			},
			progressInterval = function(){
				if( calculateProgress.call(api.element, { type: 'ipadprogress' }) >= 100 || api.element.readyState === 1  ){
					clearInterval(timer);
				}
			},
			timer
		;
		$(api.element).bind('progress load', calculateProgress);
		
		//iPad has no progress event
		if ('buffered' in api.element) {
			$(api.element).bind('play waiting loadstart', function(){
				clearInterval(timer);
				if (api.isAPIActive) {
					timer = setInterval(progressInterval, 333);
					progressInterval();
				}
			});
		}
	};
	
	//add API for native MM-Support
	var nativ = {
		isTechAvailable: $.support.mediaElements,
		_init: function(){
			var that 				= this,
				curMuted 			= this.apiElem.muted,
				//bug: firefox loadingerror
				loadingTimer 		= false,
				triggerLoadingErr 	= function(e){
					clearInterval(loadingTimer);
					if ( !that.element.error && that.element.mozLoadFrom && that.isAPIActive && !that.element.readyState && that.element.networkState === 2 && $.support.flash9 ) {
						if(e === true){
							//this will abort and start the error handling
							that.element.load();
						} else {
							loadingTimer = setTimeout(function(){
								triggerLoadingErr(true);
							}, ( e === 'initial' ) ? 20000 : 9000);
						}
					}
				}
			;
			
			//addEvents
			fixProgressEvent(this);
			
			$(this.element)
				.bind({
					volumechange: function(){
						if(curMuted !== that.apiElem.muted){
							curMuted = that.apiElem.muted;
							that._trigger.call(that, {type: 'mute', isMuted: curMuted});
						} else {
							that._trigger.call(that, {type: 'volumelevelchange', volumelevel: that.apiElem.volume * 100});
						}
					},
					ended: function(){
						if(that.isAPIActive && this.ended && !this.paused && !$.attr(this, 'loop') ){
							that._stopEvent('pause', true);
							this.pause();
						}
					},
					timeupdate: function(){
						var e = {
							type: 'timechange',
							time: this.currentTime
						};
						if(this.duration){
							e.duration = this.duration;
							e.timeProgress = e.time / e.duration * 100;
						}
						
						that._trigger(e);
					},
					//Opera sometimes forgets to dispatch loadedmetadata
					progress: function(){
						if(!that.loadedmeta && this.duration){
							that._trigger({
								type: 'loadedmeta',
								duration: this.duration
							});
						}
					},
					loadedmetadata: function(){
						that._trigger({
							type: 'loadedmeta',
							duration: this.duration
						});
					}
				})
				.bind('play playing', function(e){
					if( !that.isAPIActive && e.originalEvent && !that.element.paused && !that.element.ended ){
						try{
							that.element.pause();
						} catch(e){}
					}
				})
				.bind('mediareset', triggerLoadingErr)
				.bind('ended play pause waiting playing', function(e){
					if( (!that.isAPIActive && e.originalEvent && (e.originalEvent.mediaAPI === "nativ" || !e.originalEvent.mediaAPI)) || that._stoppedEvents[e.type]){
						e.stopImmediatePropagation();
					}
				})
			;
			
			triggerLoadingErr( 'initial' );
			
			if( !$.support.mediaLoop  ){
				$(this.element).bind('ended', function(){
					if( that.isAPIActive && $.attr(this, 'loop') ){
						var elem = this;
						setTimeout(function(){
							( $.attr(elem, 'loop') && elem.play() );
						}, 0);
					}
				});
			}
			//workaround for loadedmeta and particularly mmAPIReady event
			if( this.element.error ){return;}
			//jmeEmbed is called very late (after onload)
			if ( this.element.readyState > 0 ) {
				this._trigger({
					type: 'loadedmeta',
					duration: this.element.duration
				});
			// if element isn't busy || opera can freeze and mozilla doesn't react on method load
			// bug: iPad & iPhone initially report networkState === 2 although they are idling
			} else if ( this.element.networkState !== 2 || 'webkitPreservesPitch' in this.element ) {
				this._trigger('mmAPIReady');
			}
		},
		play: function(){
			this.element.play();
		},
		pause: function(){
			this._allowEvent('pause');
			this.element.pause();
		},
		muted: function(bool){
			if(typeof bool !== 'boolean'){
				return this.element.muted;
			}
			this.element.muted = bool;
		},
		volume: function(vol){
			if(!isFinite(vol)){
				return this.element.volume * 100;
			}
			this.element.volume = vol / 100;
		},
		currentTime: function(sec){
			if(!isFinite(sec)){
				return this.element.currentTime;
			}
			try {
				this.element.currentTime = sec;
			} catch(e){}
		},
		_mmload: function(){
			if(this.element.load){
				this.element.load();
			} else {
				$(this.element).triggerHandler('error');
			}
		},
		_isPlaying: function(){
			//readyState should be above 1, but IE9 has a bug here above 1 means isPlaying means now isPlaying or will be playing
			return (!this.element.paused && this.element.readyState > 1 && !this.element.error && !this.element.ended);
		},
		getDuration: function(){
			return this.element.duration;
		},
		getCurrentSrc: function(){
			return this.element.currentSrc;
		}
	};
	
	
	
	$m.add('nativ', 'video', $.extend({
		_videoFullscreen: $.support.videoFullscreen,
		enterFullScreen: function(){
			if(!this._videoFullscreen){return false;}
			try {
				this.element[fsMethods.enter]();
			} catch(e){
				return false;
			}
			return true;
		},
		exitFullScreen: function(){
			if(!this._videoFullscreen){return false;}
			try {
				this.element[fsMethods.exit]();
			} catch(e){
				return false;
			}
			return true;
		}
	}, nativ));
	
	
	$m.add('nativ', 'audio', nativ);
	
	
	//public-methods
	$.fn.getJMEAPI = function(full){
		if(!this[0]){return;}
		var api = $.data(this[0], 'mediaElemSupport');
		return ( full || !api || !api.name || !api.apis ) ? api : api.apis[api.name];
	};
	
	var noAPIMethods = {
			jmeReady: 1,
			getJMEVisual: 1,
			jmeReady: 1,
			isJMEReady: 1,
			getMediaAPI: 1,
			supportsFullScreen: 1
		}
	;
	$m.registerAPI = function(names){
		if(typeof names === 'string'){
			names = [names];
		}
		$.each(names, function(i, name){
			var fn = $m.apis.video.nativ[name];
			if(fn && !$.fn[name] && $.isFunction(fn) && name.indexOf('_') !== 0){
				$.fn[name] =  function(){
					var args = arguments,
						ret
					;
					this.each(function(){
						var api = $(this).getJMEAPI();
						if(!api){return;}
						if(  noAPIMethods[name] || (name == 'loadSrc' && $.data(this, 'mediaElemSupport').noSource) || (api.isJMEReady() && !api.totalerror && (api.name !== 'nativ' || $.support.mediaElements) ) ){
							ret = api[name].apply(api, args);
							return !(ret !== undefined);
						} else {
							api.unAPIReady(name+'queue');
							api.jmeReady.call(api, function(){
								api[name].apply(api, args);
							}, name+'queue');
						}
					});
					return (ret === undefined) ? this : ret; 
				};
			}
		});
	};
	
	var fnNames = [];
	$.each($m.apis.video.nativ, function(name, fn){
		fnNames.push(name);
	});
	
	$m.registerAPI(fnNames);
	
	// deprecated
	$.fn.onAPIReady = $.fn.jmeReady;
	$.fn.getMMAPI = $.fn.getJMEAPI;
	
	//plugin mechanism
	$m.fn._extend = function(exts, noAPI){
		var names = [];
		$.each(exts, function(name, fn){
			$m.fn[name] = fn;
			names.push(name);
			if(noAPI){
				noAPIMethods[name] = true;
			}
		});
		$m.registerAPI(names);
	};
	
})(jQuery);/**!
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
			function changeState(e){
				var state = (name == 'play-pause' && e && e.type == 'playing') ? true : mm[opts.stateMethod]();
				
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
/**!
 * Part of the jMediaelement-Project | http://github.com/aFarkas/jMediaelement
 * @author Alexander Farkas
 * Copyright 2010, Alexander Farkas
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */

(function($){
	var doc = document,
		$m 	= $.multimediaSupport,
		rep = /^jwPlayer-/
	;
	
	function getAPI(id){
		if(!id){return;}
		id = id.replace(rep, '');
		return $.data(doc.getElementById(id), 'mediaElemSupport').apis.jwPlayer;
	}
	
	window.jwEvents = {
		View: {
			PLAY: function(obj){
				var api = obj.state && getAPI(obj.id);
				if(!api){return;}
				api._trigger('play');
				api._$isPlaystate = true;
			}
		},
		Model: {
			BUFFER: function(obj){
				var api = getAPI(obj.id);
				if(!api){return;}
				
				if( api._$timeProgress && obj.percentage + api._$startBuffer + 1 < api._$timeProgress ){
					api._$startBuffer = api._$timeProgress;
				}
				var evt = {
					type: 'progresschange',
					relLoaded: obj.percentage + api._$startBuffer,
					relStart: 0
				};
				api._$buffered = evt.relLoaded;
				api._trigger(evt);
			},
			STATE: function(obj){
				var state = privJwEvents.Model.STATE(obj);
				if(state === 'playing'){
					var api = getAPI(obj.id);
					if(!api){return;}
					api._trigger('playing');
					api._$isPlaystate = true;
				}
			},
			META: function(obj){
				if(obj.type === 'metadata'){
					var api = getAPI(obj.id);
					if(!api){return;}
					api._trigger({
						type: 'loadedmeta',
						duration: obj.duration
					});
				}
				
			},
			TIME: function(obj){
				var api = getAPI(obj.id),
					e 	= {
							type: 'timechange',
							time: obj.position
						}
				;
				if(!api){return;}
				
				//workaround: meta isn´t triggered on audio | ToDo: Is this needed with jwplayer 5.1.x?
				if(!api.loadedmeta){
					api._trigger({
						type: 'loadedmeta',
						duration: obj.duration
					});
				}
				
				api._$currentPos = obj.position;
				if(obj.duration){
					e.duration = obj.duration;
					e.timeProgress = obj.position / obj.duration * 100;
					api._$timeProgress = e.timeProgress;
				}
				api._trigger(e);
			},
			STATE: function(obj){
				if(obj.newstate === 'IDLE'){
					return false;
				}
				var api = getAPI(obj.id),
					type
				;
				if(!api){return false;}
				switch(obj.newstate) {
					case 'PLAYING':
						type = 'playing';
						break;
					case 'PAUSED':
						api._$isPlaystate = false;
						type = 'pause';
						break;
					case 'COMPLETED':
						api._$isPlaystate = false;
						type = 'ended';
						api._adjustPluginLoop( (api.apiElem.getConfig().repeat == 'single') );
						break;
					case 'BUFFERING':
						type = 'waiting';
					break;
				}
				
				if(type){
					api._trigger(type);
				}
				return type;
			}
		},
		Controller: {
			VOLUME: function(obj){
				var api = getAPI(obj.id);
				if(!api ||  api._$lastMuteState !== api.muted() ){return;}
				api._trigger({type: 'volumelevelchange', volumelevel: obj.percentage});
			},
			MUTE: function(obj){
				var api = getAPI(obj.id);
				if(!api){return;}
				api._$lastMuteState = obj.state;
				api._trigger({type: 'mute', isMuted: obj.state});
			}
		}
	};
		
	window.playerReady = function (obj) {
		
		var api = getAPI(obj.id);
		if(!api){return;}
		//https://bugzilla.mozilla.org/show_bug.cgi?id=90268 every html5video shim has this problem fix it!!!
		if(api.isAPIReady){
			if(!api.apiElem.sendEvent){
				api._$reInit();
				return;
			} else {
				setTimeout(function(){
					if( api._lastLoad ){
						api._mmload(api._lastLoad.file, api._lastLoad.image);
					}
					if(api._$isPlaystate && !(api.apiElem.getConfig() || {}).autostart){
						api.play();
					}
				}, 8);
			}
			setTimeout(function(){
				api._trigger('jmeflashRefresh');
			}, 8);
		} else if(!api.apiElem.sendEvent){
			api._$reInit();
			return;
		}
		
		//add events
		$.each(jwEvents, function(mvcName, evts){
			$.each(evts, function(evtName){
				api.apiElem['add'+ mvcName +'Listener'](evtName, 'jwEvents.'+ mvcName +'.'+ evtName);
			});
		});
		
		//preload workaround
		setTimeout(function(){
			api._$lastMuteState = api.muted();
			var cfg = $.attr(api.element, 'getConfig');
			api._trigger('mmAPIReady');
			if(!cfg.autoplay && !api._$isPlaystate && (api.apiElem.getConfig() || {}).state === 'IDLE'){
				if( api.nodeName === 'audio' && cfg.preload === 'auto' ){
					api.apiElem.sendEvent('PLAY', 'true');
					api.apiElem.sendEvent('PLAY', 'false');
				} else if( api.nodeName === 'video' && cfg.preload !== 'none' && !cfg.poster ){
					api.apiElem.sendEvent('PLAY', 'true');
					api.apiElem.sendEvent('PLAY', 'false');
					api.currentTime(0);
				}
			}
		}, 9);		
	};
	
	var jwAPI = {
		_init: function(){
			this._$resetStates();
		},
		_$resetStates: function(){
			this._$buffered = 0;
			this._$startBuffer = 0;
			this._$timeProgress = 0;
			this._$currentPos = 0;
		},
		_$reInitCount: 0,
		_$reInitTimer: false,
		_$reInit: function(){
			var that = this;
			if(this._$reInitCount < 5){
				this.visualElem[0].style.overflow = 'visible';
				setTimeout(function(){
					that.visualElem[0].style.overflow = 'hidden';
				}, 0);
			}
			this._$reInitCount++;
			this._$resetStates();
			if(!this._$reInitTimer){
				this._$reInitTimer = true;
				setTimeout(function(){
					that._$reInitCount = 0;
					that._$reInitTimer = false;
				}, 20000);
			}
		}, 
		play: function(){
			this.apiElem.sendEvent('PLAY', 'true');
			this._$isPlaystate = true;
			this._trigger('play');
		},
		pause: function(){
			this.apiElem.sendEvent('PLAY', 'false');
		},
		_isPlaying: function(){
			var cfg = this.apiElem.getConfig();
			return (cfg) ? (cfg.state === 'PLAYING' ) : undefined;
		},
		_mmload: function(src, poster, jwExtras){
			var playing = this._isPlaying();
			this._lastLoad = {file: src};
			if(poster){
				this._lastLoad.image = poster;
			}
			this._$resetStates();
			this._extendJWLoad(src, this._lastLoad);
			if(typeof jwExtras == 'object'){
				$.extend(this._lastLoad, jwExtras);
			}
			if(!this.apiElem.sendEvent){return;}
			this.apiElem.sendEvent('LOAD', this._lastLoad);
			if( this.isAPIActive && ($.attr(this.element, 'autoplay') || playing) ){
				this.apiElem.sendEvent('PLAY', 'true');
			} else {
				this.apiElem.sendEvent('PLAY', 'false');
			}
		},
		muted: function(state){
			if(typeof state !== 'boolean'){
				var cfg = this.apiElem.getConfig();
				return (cfg || {}).mute;
			}
			this.apiElem.sendEvent('mute', ''+state);
		},
		currentTime: function(t){
			if(!isFinite(t)){
				return this._$currentPos || 0;
			}
			this._$currentPos = t;
			var playing = this._isPlaying();
			this.apiElem.sendEvent('SEEK', t);
			if(!playing){
				this.pause();
			}
			this._trigger({type: 'timechange', time: t});
		},
		getDuration: function(){
			var t = this.apiElem.getPlaylist()[0].duration || 0;
			return t < 0 ? 0 : t;
		},
		volume: function(v){
			if(!isFinite(v)){
				return parseInt(this.apiElem.getConfig().volume, 10);
			}
			var wasMuted = this.muted();
			this.apiElem.sendEvent('VOLUME', ''+v);
			if(wasMuted){
				this.apiElem.sendEvent('mute', 'true');
			}
		},
		getCurrentSrc: function(){
			return (this.apiElem.getConfig() || {}).file || '';
		}
	};
	
	// ff flash refreshbug https://bugzilla.mozilla.org/show_bug.cgi?id=90268 
	// opera also has some problems here
	$.extend(jwAPI, {
		isJMEReady: function(){
			var ret = false;
			if(this.isAPIReady && this.apiElem.sendEvent && this.apiElem.getConfig){
				// seems stupid, but helps :-)
				( $.browser.mozilla && this.apiElem.getConfig() );
				ret = true;					
			}
			return ret;
		}
	});
	
	
	$m.add('jwPlayer', 'video', $.extend({}, jwAPI, {
		exitFullScreen: function(){
			if(this.apiElem.jmeExitFullScreen){
				try {
					this.apiElem.jmeExitFullScreen();
					return true;
				} catch(e){}
			}
			return false;
		}
	}));
	
	$m.add('jwPlayer', 'audio', jwAPI);
	
})(jQuery);
