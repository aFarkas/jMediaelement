/**!
 * Part of the jMediaelement-Project v1.1.3 | http://github.com/aFarkas/jMediaelement
 * @author Alexander Farkas
 * Copyright 2010, Alexander Farkas
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */

(function($){
	$.multimediaSupport = {};
	var m 	= $.multimediaSupport,
		vID = new Date().getTime(),
		doc	= document
	;
	// support test + document.createElement trick
	$.support.video = !!($('<video />')[0].canPlayType);
	$.support.audio = !!($('<audio />')[0].canPlayType);
	
	$('<source />');
	$('<track />');
	
	$.support.mediaElements = ($.support.video && $.support.audio);
	$.support.dynamicHTML5 = !!($('<video><div></div></video>')[0].innerHTML);
	$.support.mediaLoop = ('loop' in $('<video />')[0]);
	
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
		getHiddenDim 	= function(jElm, ancestorFrom){
			var parent 	= ancestorFrom.parentNode,
				body 	= document.body,
				ret 	= {width: 0, height: 0}
			;
			while(parent && parent !== body){
				if( $.curCSS(parent, 'display') === 'none' ){
					$.swap( parent, cssShow, function(){
						var styles = false;
						// if !important is used
						if( $.curCSS(parent, 'display', true) === 'none' ){
							//for IE6/7 we need to remove inline-style first
							parent.style.display = '';
							styles = $.attr(parent, 'style');
							$.attr(parent, 'style', styles+'; display: block !important;');
						}
						ret.height = jElm.height();
						ret.width = jElm.width();
						if( !ret.width && !ret.height ){
							ret = getHiddenDim(jElm, parent);
						}
						if( styles !== false ){
							$.attr(parent, 'style', styles);
						}
					} );
					if( ret.width || ret.height ){
						break;
					}
				}
				
				parent = parent.parentNode;
			}
			return ret;
		}
	;
	
	$.fn.getDimensions = function(){
		var ret = {width: 0, height: 0};
		if(this[0]){
			var elmS = this[0].style;
			// assume that inline style is correct
			// enables 100% feature with inline-style
			ret.height = elmS.height;
			ret.width = elmS.width;
			
			if( !ret.width || !ret.height || ret.height == 'auto' || ret.width == 'auto' ){
				ret.height = this.height();
				ret.width = this.width();
				
				if( !ret.width && !ret.height ){
					ret = getHiddenDim(this, this[0]);
				}
			}
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
	
	$.attr = function(elem, name, value, pass){
		
		if( !(elem.nodeName && attrElems.test(elem.nodeName) && (mixedNames[name] || booleanNames[name] || srcNames[name])) ){
			return oldAttr(elem, name, value, pass);
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
					ret = elem.getAttribute('preload');
					if(!preloadVals[ret]){
						ret = 'auto';
					}
					break;
			}
			return ret;
		} else {
			if(booleanNames[name]){
				value = !!(value);
				elem[name] = value;
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
				if(!preloadVals[value]){
					value = 'auto';
				}
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
	
	function getExt(src){
		var pos = src.indexOf('?'),
			ext = ''
		;
		src = (pos > 0) ? src.substring(0, pos) : src;
		pos = src.lastIndexOf('.') + 1;
		ext = src.substr(pos);
		return ext;
	}
	
	var mimeTypes = {
			audio: {
				//ogm shouldn´t be used!
				'audio/ogg': ['ogg','oga', 'ogm'],
				'audio/mpeg': ['mp2','mp3','mpga','mpega'],
				'audio/mp4': ['mp4','mpg4'],
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
		if(supported === 'noSource'){return;}
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
			var elemName 	= this.nodeName.toLowerCase();
			
			if(elemName !== 'video' && elemName !== 'audio'){return;}
			var elem = this;
			
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
			
			if(opts.debug || !$.support.mediaElements){
				 findInitFallback(this, opts);
				 apiData.apis.nativ.isAPIReady = true;
			} else {
				apiData.apis.nativ._init();
			}
			$(this)
				.bind('mediaerror', function(e){
					if(apiData.name === 'nativ'){
						findInitFallback(this, opts);
					}
				})
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
		apiOrder: []
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
			jmeflashRefresh: 1
		},
		nuBubbleEvents 	= {
			native_mediareset: 1,
			apiDeActivated: 1,
			native_mediareset: 1,
			apiActivated: 1,
			timechange: 1,
			progresschange: 1,
			mmAPIReady: 1,
			jmeflashRefresh: 1,
			ended: 1
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
			
			if(!this.isAPIActive || (this.totalerror && !noAPIEvents[type])){return;}
			if(!this.isAPIReady && !noAPIEvents[type]){
				this._trigger('mmAPIReady');
			}
			
			if(e.type === 'progresschange'){
				//firefox buffer bug
				if(isFinite( this._bufferLoaded ) && isFinite( e.relLoaded ) && this._bufferLoaded >= e.relLoaded){return;}
				this._bufferLoaded = e.relLoaded;
				//should we support multiple buffer? if not remove relStart
//				e.relStart = e.relStart || 0;
//				if(this._concerningBufferStart !== e.relStart){
//					this._concerningBufferStart = e.relStart;
//					this._trigger({type: 'bufferrange', relStart: e.relStart, relLoaded: e.relLoaded});
//				}
			}
			
			e.target = this.element;
			e = $.Event(e);
			e.preventDefault();
			
			evt.mediaAPI = this.name;
			if(nuBubbleEvents[type]){
				e.stopPropagation();
			}
						
			$.event.trigger( e, evt, this.element );
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
		loadSrc: function(srces, poster, mediaName){
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
			
			if( mediaName !== undefined ){
				var data = $.data(this.element, 'mediaElemSupport');
				if( data.controlWrapper && data.controlWrapper.mediaLabel ){
					data.controlWrapper.mediaLabel.text(mediaName);
				}
			}
			
			this._isResetting = true;
			
			var canPlaySrc = this.canPlaySrces(srces);
			this._trigger('mediareset');
			if(canPlaySrc){
				canPlaySrc = canPlaySrc.src || canPlaySrc;
				this._mmload(canPlaySrc, poster);
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
		},
		_hidePoster: function(){
			if(!this._isHiddenPoster){
				$('img.poster-image', this.visualElem).css('visibility', 'hidden');
				$(this.apiElem).css('visibility', '');
				this._isHiddenPoster = true;
			}
		},
		_showPoster: function(e, d){
			if(!d.time){
				$('img.poster-image', this.visualElem).css('visibility', '');
				$(this.apiElem).css('visibility', 'hidden');
				this._isHiddenPoster = false;
			} else if(!this._isHiddenPoster){
				this._hidePoster();
			}
		},
		_setPoster: function(poster){
			$('img.poster-image', this.visualElem).remove();
			$(this.element).unbind('.jme_poster');
			if(poster){
				var time = this.currentTime();
				$('<img />', 
					{
						'class': 'poster-image',
						css: {
							position: 'absolute',
							top: 0,
							left: 0,
							margin: 0,
							'float': 'none',
							maxHeight: '100%',
							maxWidth: '100%',
							width: '100%',
							height: 'auto',
							visibility: 'hidden'
						},
						src: poster
					}
				)
					.appendTo(this.visualElem)
				;
				this._isHiddenPoster = true;
				$(this.element)
					.bind('play.jme_poster', $.proxy(this, '_hidePoster'))
					.bind('timechange.jme_poster', $.proxy(this, '_showPoster'))
				;
				if(!isFinite(time) || !time){
					this._showPoster(false, {time: 0});
				} else {
					this._hidePoster();
				}
			}
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
				//mediaevents do not bubble normally, except in ff, we make them bubble, because we love this feature
				bubbleEvents 		= function(e, data){
					if(!that.isAPIActive || that.totalerror || e.bubbles){return;}
					var parent = this.parentNode || this.ownerDocument;
					if ( !e.isPropagationStopped() && parent ) {
						e.bubbles = true;
						data = $.makeArray( data );
						data.unshift( e );
						$.event.trigger( e, data, parent, true );
					}
				},
				//bug: firefox loadingerror
				loadingTimer 		= false,
				triggerLoadingErr 	= function(e){
					clearInterval(loadingTimer);
					if ( !that.element.error && that.element.mozLoadFrom && that.isAPIActive && !that.element.readyState && that.element.networkState === 2 && ( $.support.flash9 || $.support.vlc ) ) {
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
					loadedmetadata: function(){
						that._trigger({
							type: 'loadedmeta',
							duration: this.duration
						});
					}
				})
				.bind('play pause playing waiting', bubbleEvents)
				// firefox also loads video without calling load-method, if autoplay is true and media pack has changed
				.bind('play playing', function(){
					if( !that.isAPIActive && !that.element.paused && !that.element.ended ){
						try{
							that.element.pause();
						} catch(e){}
					}
				})
				.bind('mediareset', triggerLoadingErr)
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
		play: function(src){
			this.element.play();
		},
		pause: function(){
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
			return (!this.element.paused && this.element.readyState > 2 && !this.element.error && !this.element.ended);
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
			playlist: 1,
			getMediaAPI: 1
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
						if(  noAPIMethods[name] || (api.isJMEReady() && !api.totalerror && (api.name !== 'nativ' || $.support.mediaElements) ) ){
							ret = api[name].apply(api, args);
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
	$m.fn._extend = function(exts){
		var names = [];
		$.each(exts, function(name, fn){
			$m.fn[name] = fn;
			names.push(name);
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
	var split 			= /\s*\/\s*|\s*\|\s*|\s*\,\s*/g,
		moveKeys 		= {
					40: true,
					37: true,
					39: true,
					38: true
				},
		sliderMethod 	= ($.fn.a11ySlider) ? 'a11ySlider' : 'slider',
		labelID 		= 0,
		controls 		= {
			'timeline-slider': function(control, mm, api, o){
				var stopSlide = false;
				control[sliderMethod](o.timeSlider)[sliderMethod]('option', 'disabled', true);
				function changeTimeState(e, ui){
					var time = parseInt( ui.timeProgress, 10 );
					if(ui.timeProgress !== undefined && !stopSlide ){
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
					.jmeReady(function(){
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
			'media-controls': function(control, mm, api, o){
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
			},
			'media-label': function(control, mm, data, o){
				if( !data.controlWrapper || data.controlWrapper.attr('role') ){return;}
				var id 			= control.attr('id'),
					mediaName 	= $('.'+o.classPrefix+'media-name', control)
				;
				if(!id){
					labelID++;
					id = o.classPrefix+'media-label-'+ labelID;
					control.attr('id', id);
				}
				data.controlWrapper.mediaLabel = (mediaName[0]) ? mediaName : control;
				data.controlWrapper.attr({
					role: 'group',
					'aria-labelledby': id
				});
			},
			fallback: function(control, mm, api, o){
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
			},
			'media-state': function(control, mm, api, o){
				//classPrefix
				var stateClasses 		= o.classPrefix+'playing '+ o.classPrefix +'totalerror '+o.classPrefix+'waiting '+ o.classPrefix+'idle',
					removeStateClasses 	= function(){
						control.removeClass(stateClasses);
					}
				;
				mm.jmeReady(function(){
					if( !mm.isPlaying() ){
						control.addClass(o.classPrefix+'idle');
					} else {
						control.addClass(o.classPrefix+'playing');
					}
				});
				if( typeof o.mediaState.click === 'string' && mm[o.mediaState.click] ){
					control.click(function(){
						mm[o.mediaState.click]();
					});
				}
				control.addClass(o.classPrefix+api.name);
				mm
					.bind({
						apiActivated: function(e, d){
							control.addClass(o.classPrefix+d.api);
						},
						apiDeActivated: function(e, d){
							control.removeClass(o.classPrefix+d.api);
						}
					})
					.bind('playing totalerror waiting', function(e){
						removeStateClasses();
						control.addClass(o.classPrefix+e.type);
					})
					.bind('play', function(){
						control.removeClass(o.classPrefix+'idle');
					})
					.bind('pause ended mediareset', function(e){
						removeStateClasses();
						control.addClass(o.classPrefix+'idle');
					})
					.bind('canplay', function(e){
						control.removeClass(o.classPrefix+'waiting');
					})
				;
				if( o.mediaState.fullWindowOverlay && $.fn.videoOverlay ){
					control.videoOverlay({
						video: mm,
						startCSS: {
							width: 'auto',
							height: 'auto'
						},
						position: {
							bottom: 0,
							left: 0,
							right: 0,
							top: 0,
							wdith: 0,
							height: 0
						}
					});
				}
			}
		},
		toggleModells = {
				'play-pause': {stateMethod: 'isPlaying', actionMethod: 'togglePlay', evts: 'play playing pause ended loadedmeta mediareset', trueClass: 'ui-icon-pause', falseClass: 'ui-icon-play'},
				'mute-unmute': {stateMethod: 'muted', actionMethod: 'toggleMuted', evts: 'mute', trueClass: 'ui-icon-volume-off', falseClass: 'ui-icon-volume-on'}
			}
	;
	
	$.each(['current-time', 'remaining-time'], function(i, name){
		controls[name] = function(control, mm, api, o){
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
		};
	});
	
	//create Toggle Button UI
	$.each(toggleModells, function(name, opts){
		controls[name] = function(control, mm, api, o){
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
		};
	});
	
	
	
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
		controls['media-state'](wrapper, mm, api, $.extend({}, o, {mediaState: {click: false}}));
		wrapper.data('jmePlayer', {mediaelement: mm, api: api});
		if( $.fn.videoOverlay ){
			wrapper
				.videoOverlay({
					video: mm,
					startCSS: {
						width: 'auto',
						height: 'auto',
						zIndex: 99998
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
		
	$.fn.jmeControl = function(o){
		o = $.extend(true, {}, $.fn.jmeControl.defaults, o);
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
			if( !elems.api ){return;}
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
			if( elems.api.controlWrapper && elems.api.controlWrapper[0] ){
				addWrapperBindings(elems.api.controlWrapper, elems.mm, elems.api, o);
			}
		}
		
		return this.each(registerControl);
	};
	
	$.fn.jmeControl.defaults = {
		//common
		embed: {removeControls: true},
		classPrefix: '',
		addThemeRoller: true,
		mediaControls: {
			dynamicTimeslider: false,
			timeSliderAdjust: 0,
			excludeSel: false,
			fullWindowOverlay: false
		},
		progressbar: {},
		volumeSlider: {},
		timeSlider: {},
		currentTime: {
			reverse: false
		},
		mediaState: {
			click: 'togglePlay',
			fullWindowOverlay: false
		}
	};
	
	$.support.waiaria = (!$.browser.msie || $.browser.version > 7);
	
	
	$.fn.jmeControl.getBtn = function(control){
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
	$.fn.jmeControl.addControl = function(name, fn){
		controls[name] = fn;
	};
	
	$.fn.registerMMControl = $.fn.jmeControl;
	
	$(function(){
		sliderMethod = ($.fn.a11ySlider) ? 'a11ySlider' : 'slider';
	});
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
				jwPlayer: {
					path: m.jsPath + 'player.swf',
					hideIcons: 'auto',
					vars: {},
					attrs: {},
					params: {
						allowscriptaccess: 'always',
						allowfullscreen: 'true'
					}
				}
			}
		)
	;
	
		
	var regs = {
			A: /&amp;/g,
			a: /&/g,
			e: /\=/g,
			q: /\?/g
		},
		replaceVar = function(val){
			return val.replace(regs.A, '%26').replace(regs.a, '%26').replace(regs.e, '%3D').replace(regs.q, '%3F');
		}
	;
	
	
	
	(function(){
		$.support.flash9 = false;
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
							$.support.flash9 = !!(obj[0] > 9 || (obj[0] === 9 && obj[1] >= 115));
						}
					} catch (e) {}
				
			}
		;
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
			_embed: function(src, id, cfg, fn){
				var opts 		= this.embedOpts.jwPlayer,
					vars 		= $.extend({}, opts.vars, {file: src, id: id}),
					attrs	 	= $.extend({name: id, data: opts.path}, opts.attrs, swfAttr),
					params 		= $.extend({movie: opts.path}, opts.params),
					provider 	= $.attr(this.element, 'data-provider')
				;
				
				if(cfg.poster){
					vars.image = cfg.poster;
				}
				if(provider){
					vars.provider = provider;
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
				
				params.flashvars = [];
				$.each(vars, function(name, val){
					params.flashvars.push(replaceVar(name)+'='+replaceVar(val));
				});
				params.flashvars = params.flashvars.join('&');
				fn(m.embedObject( this.visualElem[0], id, attrs, params, aXAttrs, 'Shockwave Flash' ));
			},
			canPlayCodecs: ['avc1.42E01E', 'mp4a.40.2', 'avc1.58A01E', 'avc1.4D401E', 'avc1.64001E', 'VP6', 'mp3', 'AAC'],
			canPlayContainer: ['video/3gpp', 'video/x-msvideo', 'video/quicktime', 'video/x-m4v', 'video/mp4', 'video/m4p', 'video/x-flv', 'video/flv', 'audio/mpeg', 'audio/mp3', 'audio/x-fla', 'audio/fla']
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
	var privJwEvents = {
		View: {
			PLAY: function(obj){
				var api = obj.state && getAPI(obj.id);
				if(!api){return;}
				api._trigger('play');
				api._$isPlaystate = true;
			}
		},
		Model: {
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
	window.jwEvents = {
		four: $.extend(true, {}, privJwEvents, {
			Model: {
				LOADED: function(obj){
					var api = getAPI(obj.id);
					if(!api){return;}
					var evt = {
						type: 'progresschange',
						lengthComputable: !!(obj.total)
					};
					if(obj.total){
						$.extend(evt, {
							relLoaded: obj.total / obj.loaded * 100
						});
						
						api._$buffered = evt.relLoaded;
					}
					api._trigger(evt);
				}
			}
			
		}),
		five: $.extend(true, {}, privJwEvents, {
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
				}
			}
		})
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
				}, 20);
				
			}
			setTimeout(function(){
				api._trigger('jmeflashRefresh');
			}, 20);
		}
		
		var apiVersion = (parseInt(obj.version, 10) > 4)? 'five' : 'four';
		//add events
		$.each(jwEvents[apiVersion], function(mvcName, evts){
			$.each(evts, function(evtName){
				api.apiElem['add'+ mvcName +'Listener'](evtName, 'jwEvents.'+ apiVersion +'.'+ mvcName +'.'+ evtName);
			});
		});
		
		//preload workaround
		setTimeout(function(){
			api._$lastMuteState = api.muted();
			var cfg = $.attr(api.element, 'getConfig');
			if(!cfg.autoplay){
				if( api.nodeName === 'audio' && cfg.preload === 'metadata' ){
					api.apiElem.sendEvent('PLAY', 'true');
					api.apiElem.sendEvent('PLAY', 'false');
				} else if( api.nodeName === 'video' && cfg.preload !== 'none' && !cfg.poster ){
					api.currentTime(0);
				}
			}
			api._trigger('mmAPIReady');
		}, 20);		
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
		canPlaySrc: function(media){
			var ret 	= $m.fn.canPlaySrc.apply(this, arguments), 
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
		_mmload: function(src, poster){
			this._lastLoad = {
				file: src
			};
			if(poster){
				this._lastLoad.image = poster;
			}
			this._$resetStates();
			this.apiElem.sendEvent('LOAD', this._lastLoad);
			
			if( this.isAPIActive && $.attr(this.element, 'autoplay') ){
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
			this.apiElem.sendEvent('mute', (state) ? 'true' : false);
		},
		_isSeekable: function(t){
			var cfg = this.apiElem.getConfig() || {};
			if(this._$buffered === 100 || ( cfg.provider !== 'video' && cfg.provider !== 'audio' ) ){
				return true;
			}
			var dur = this.getDuration();
			if(!dur){
				return false;
			}
			return (t / dur * 100 < this._$buffered);
		},
		currentTime: function(t){
			if(!isFinite(t)){
				return this._$currentPos || 0;
			}
			var api 			= this,
				wantsPlaying 	= (/PLAYING|BUFFERING/.test( this.apiElem.getConfig().state)),
				doSeek 			= function(){
					api.apiElem.sendEvent('SEEK', t);
					unbind();
					if(!wantsPlaying){
						api.apiElem.sendEvent('PLAY', 'false');
					}
					api._$currentPos = t;
					api._trigger({type: 'timechange', time: t});
				},
				unbind 			= function(){
					$(api.element).unbind('.jwseekrequest');
				}
			;
			if(!wantsPlaying){
				this.apiElem.sendEvent('PLAY', 'true');
				this.apiElem.sendEvent('PLAY', 'false');
			}
			clearTimeout(this._seekrequestTimer);
			unbind();
			
			if(this._isSeekable(t)){
				doSeek();
			} else {
				this.apiElem.sendEvent('PLAY', 'false');
				this._trigger('waiting');
				$(this.element)
					.bind('progresschange.jwseekrequest', function(){
						if(api._isSeekable(t)){
							var wasMuted = api.muted();
							unbind();
							clearTimeout(api._seekrequestTimer);
							if (!wasMuted) {
								api.muted(true);
							}
							api.apiElem.sendEvent('PLAY', 'true');
							api._seekrequestTimer = setTimeout(function(){
								if(!wasMuted){
									api.muted(wasMuted);
								}
								doSeek();
							}, 120);
							
							
						}
					})
					.bind('mediareset.jwseekrequest', unbind)
					.bind('play.jwseekrequest', function(){
						api.apiElem.sendEvent('PLAY', 'false');
						api._trigger('waiting');
						wantsPlaying = true;
					})
					.bind('pause.jwseekrequest', function(){
						wantsPlaying = false;
					})
				;
				
				//seek aborted
				this._seekrequestTimer = setTimeout(function(){
					$(api.element)
						.unbind('play.jwseekrequest')
						.unbind('pause.jwseekrequest')
						.bind('play.jwseekrequest', unbind)
						.bind('pause.jwseekrequest', unbind)
					;
				}, 999);
			}
		},
		getDuration: function(){
			var t = this.apiElem.getPlaylist()[0].duration || 0;
			return t < 0 ? 0 : t;
		},
		volume: function(v){
			if(!isFinite(v)){
				return parseInt(this.apiElem.getConfig().volume, 10);
			}
			this.apiElem.sendEvent('VOLUME', ''+v);
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
	
	
	$m.add('jwPlayer', 'video', jwAPI);
	$m.add('jwPlayer', 'audio', jwAPI);
	
})(jQuery);
/**!
 * Part of the jMediaelement-Project | http://github.com/aFarkas/jMediaelement
 * @author Alexander Farkas
 * Copyright 2010, Alexander Farkas
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */
(function($){
	$.extend($.fn.jmeEmbed.defaults, 
			{
				vlc: {
					params: {},
					attrs: {}
				}
			}
		)
	;
	
	var $m 				= $.multimediaSupport,
		defaultAttrs 	= {
			pluginspage: 'http://www.videolan.org',
			version: 'VideoLAN.VLCPlugin.2',
			progid: 'VideoLAN.VLCPlugin.2',
			type: 'application/x-vlc-plugin',
			events: 'True'
			
		},
		activeXAttrs 	= {
			classid: 'clsid:9BE31822-FDAD-461B-AD51-BE1D1C159921'
		}
	;
	
	var vlcMM = {
			isTechAvailable: function(){
				if($.support.vlc !== undefined){
					return $.support.vlc;
				}
				$.support.vlc = false;
				$.support.vlcWEBM = false;
				
				var vlc = $m.getPluginVersion('VLC Multimedia Plug-in');
				
				if(vlc[0] >= 0.9){
					if(vlc[0] >= 1.1){
						$.support.vlcWEBM = true;
					}
					$.support.vlc = true;
				} else if(window.ActiveXObject){
					try {
						vlc = new ActiveXObject('VideoLAN.VLCPlugin.2');
						
						if( vlc ){
							if( vlc.VersionInfo && parseFloat( vlc.VersionInfo, 10 ) >= 1.1 ){
								$.support.vlcWEBM = true;
							}
							$.support.vlc = true;
						}
					} catch(e){}
				}
				if( $.support.vlcWEBM ){
					vlcMM.canPlayCodecs.push('VP8');
					vlcMM.canPlayCodecs.push('VP8.0');
					vlcMM.canPlayContainer.push('video/webm');
					vlcMM.canPlayContainer.push('audio/webm');
				}
				return $.support.vlc;
			},
			_embed: function(src, id, attrs, fn){
				var opts 	= this.embedOpts.vlc,
					vlcAttr = $.extend( ( window.ActiveXObject ) ? {} : {data: src}, opts.attrs, defaultAttrs),
					params 	= $.extend({}, opts.params, {
						Src: src,
						ShowDisplay: 'True',
						autoplay: ''+ attrs.autoplay,//
						autoloop: ''+attrs.loop
					}),
					elem = $m.embedObject( this.visualElem[0], id, vlcAttr, params, activeXAttrs, 'VLC Multimedia Plug-in' )
				;
				this._currentSrc = src;
				this._loop = attrs.loop;
				fn( elem );
				if( !attrs.autoplay && window.ActiveXObject ){
					try {
						elem.playlist.playItem( elem.playlist.add(src, " ", ":no-video-title-show") );
						elem.playlist.items.clear();
						elem.playlist.stop();
					} catch(e){}
				}
				elem = null;
			},
			canPlayCodecs: ['avc1.42E01E', 'mp4a.40.2', 'avc1.58A01E', 'avc1.4D401E', 'avc1.64001E', 'theora', 'vorbis', 'VP6', 'mp3', 'AAC'],
			canPlayContainer: ['video/3gpp', 'video/x-msvideo', 'video/quicktime', 'video/x-m4v', 'video/mp4', 'video/m4p', 'video/x-flv', 'video/flv', 'audio/mpeg', 'audio/x-fla', 'audio/fla', 'video/ogg', 'video/x-ogg', 'audio/x-ogg', 'audio/ogg', 'application/ogg', 'application/x-ogg']
		}
	;
	
	$m.add('vlc', 'video', vlcMM);
	$m.add('vlc', 'audio', vlcMM);
})(jQuery);
/**!
 * Part of the jMediaelement-Project | http://github.com/aFarkas/jMediaelement
 * @author Alexander Farkas
 * Copyright 2010, Alexander Farkas
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */

(function($){
	function isReady(api){
		var timer;
		function testReady(){
			try{
				if( api.apiElem.input && api.apiElem.input.state !== undefined ){
					queueEvent('mmAPIReady', api);
				} else {
					return;
				}
				clearInterval(timer);
				if($.attr(api.element, 'autoplay')){
					interval.start(api);
				} else {
					api.apiElem.playlist.stop();
					setTimeout(function(){
						api.apiElem.playlist.stop();
					}, 0);
				}
			} catch(e){}
			
		}
		clearInterval(timer);
		timer = setInterval(testReady, 333);
	}
	
	function queueEvent(event, api){
		setTimeout(function(){
			api._trigger(event);
		}, 0);
	}
	
	var interval = {
		start: function(api){
			interval.end(api);
			api._intervalCheckTimer = setInterval(function(){
				api._intervalCheck.call(api);
			}, 1000);
		},
		end: function(api){
			if(api._intervalCheckTimer){
				clearInterval(api._intervalCheckTimer);
			}
		}
	};
	
	function queueCheck(api){
		setTimeout(function(){
			api._intervalCheck();
		}, 9);
	}
	
	var states = {
		2: 'waiting',
		3: 'playing',
		4: 'pause',
		6: 'ended'
	};
	
	var vlcAPI = {
		_init: function(){
			isReady(this);
			this._setPoster($.attr(this.element, 'poster'));
		},
		_intervalCheck: function(){
			var vlc 	= this.apiElem,
				state 	= vlc.input.state,
				api 	= this,
				meta 	= {
					type: 'loadedmeta',
					duration: vlc.input.length / 1000
				},
				evt
			;
			
			if((state && state > 1 && !this.data.metaLoaded) || (this.data.metaLoaded && this.data.metaLoaded.duration !== meta.duration)){
				queueEvent(meta, api);
				this.data.metaLoaded = meta;
			}
			
			evt = {
				type: 'timechange',
				time: vlc.input.time / 1000
			};
			
			if(state && state > 1 && this.data.time !== evt.time){
				if(meta.duration){
					evt.duration = meta.duration;
					evt.timeProgress = vlc.input.position * 100;
				}
				this.data.time = evt.time;
				queueEvent(evt, api);
			}
			
			evt = {
				type: 'mute',
				isMuted: vlc.audio.mute
			};
			
			if(evt.isMuted !== this.data.isMuted){
				this.data.isMuted = evt.isMuted;
				queueEvent(evt, api);
			}
			
			evt = {
				type: 'volumelevelchange',
				volumelevel: vlc.audio.volume / 2
			};
			
			if(evt.volumelevel !== this.data.volumelevel){
				this.data.volumelevel = evt.volumelevel;
				queueEvent(evt, api);
			}
			
			
			if(state !== this.data.state){
				this.data.state = state;
				if(states[state]){
					queueEvent(states[state], api);
				}
				if(states[state] === 'ended'){
					vlc.playlist.stop();
					api._adjustPluginLoop(api._loop);
				}
				if(state === 3){
					interval.start(api);
				} else if(state === 4 || state === 5 || state === 6 || state === 7) {
					interval.end(api);
				}
			}
			
		},
		play: function(){
			this.apiElem.playlist.play();
			this._trigger('play');
			interval.start(this);
			queueCheck(this);
			if(this._currentTimeAdjust !== false){
				try {
					this.apiElem.input.time = this._currentTimeAdjust;
				} catch(e){}
				this._resetCurrentTime();
			}
		},
		pause: function(){
			if(states[this.apiElem.input.state] === 'playing'){
				interval.end(this);
				this.apiElem.playlist.togglePause();
				queueCheck(this);
			}
		},
		_isPlaying: function(){
			var ret = false;
			try {
				ret = states[this.apiElem.input.state] === 'playing';
			} catch(e){}
			return ret;
		},
		_mmload: function(src, poster){
			$(this.element).unbind('playing.enterFullscreen');
			this.apiElem.playlist.stop();
			this.data = {};
			var item = this.apiElem.playlist.add(src, " ", ":no-video-title-show");
			this._currentSrc = src;
			this.apiElem.playlist.playItem(item);
			this.apiElem.playlist.items.clear();
			this._setPoster(poster);
			this._showPoster(false, {time: 0});
			if(!$.attr(this.element, 'autoplay')){
				interval.end(this);
				this.apiElem.playlist.stop();
			}
			
		},
		getCurrentSrc: function(){
			return this._currentSrc;
		},
		_currentTimeAdjust: false,
		_currentTimeTimer: false,
		_resetCurrentTime: function(){
			clearTimeout(this._currentTimeTimer);
			this._currentTimeAdjust = false;
		},
		currentTime: function(t){
			try {
				if(!isFinite(t)){
					return (this.apiElem.input) ? this.apiElem.input.time / 1000 : 0;
				}
				var state;
				if(!this.loadedmeta){
					state = states[this.apiElem.input.state];
					this.play();
				}
				this._currentTimeAdjust = t * 1000;
				clearTimeout(this._currentTimeTimer);
				this._currentTimeTimer = setTimeout($.proxy(this, '_resetCurrentTime'));
				this.apiElem.input.time = this._currentTimeAdjust;
				queueCheck(this);
				if(state && (state !== 'playing' && state !== 'waiting')){
					this.pause();
				}
			} catch(e){
				if(!isFinite(t)){
					return 0;
				}
			}
		},
		getDuration: function(){
			var dur;
			try {
				dur = this.apiElem.input.length / 1000 || 0;
			} catch(e){
				dur = 0;
			}
			return dur;
		},
		volume: function(v){
			if (!isFinite(v)) {
				return (this.apiElem.audio) ? parseInt(this.apiElem.audio.volume / 2, 10) : 100;
			}
			if(this.apiElem.audio){
				this.apiElem.audio.volume = v * 2;
				queueCheck(this);
			}
		},
		muted: function(state){
			if(typeof state !== 'boolean'){
				try {
					return (this.apiElem.audio) ? this.apiElem.audio.mute : true;
				} catch(e){
					return false;
				}
			} 
			if(this.apiElem.audio){
				this.apiElem.audio.mute = state;
				queueCheck(this);
			}
		}
	};
	
	$.multimediaSupport.add('vlc', 'video', $.extend({ 
			_videoFullscreen: true,
			enterFullScreen: function(){
				if(!this._isPlaying()){
					var that = this;
					$(that.element).one('playing.enterFullscreen', function(){
						that.apiElem.video.fullscreen = true;
					});
					this.play();
				} else {
					this.apiElem.video.fullscreen = true;
				}
				return true;
			},
			exitFullScreen: function(){
				this.apiElem.video.fullscreen = false;
				return true;
			}
		}, vlcAPI)
	);
	$.multimediaSupport.add('vlc', 'audio', vlcAPI);
})(jQuery);

