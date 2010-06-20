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
