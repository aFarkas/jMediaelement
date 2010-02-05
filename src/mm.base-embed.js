/**!
 * Part of the jMediaelement-Project | http://github.com/aFarkas/jMediaelement
 * @author Alexander Farkas
 * Copyright 2010, Alexander Farkas
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */

(function(){
	jQuery.multimediaSupport = {};
	var $ 	= jQuery, 
		m 	= $.multimediaSupport,
		vID = new Date().getTime(),
		doc	= document
	;
	$.support.video = !!($('<video />')[0].canPlayType);
	$.support.audio = !!($('<audio />')[0].canPlayType);
	$.support.mediaElements = ($.support.video && $.support.audio);
	
	
	var oldAttr 		= $.attr,
		attrElems 		= /video|audio|source/i,
		srcNames 		= {
					src: true,
					poster: true
				},
		booleanNames 	= {
					loop: true,
					autoplay: true,
					controls: true,
					autobuffer: true
				}
	;
	
	$.attr = function(elem, name, value, pass){
		
		if( !(elem.nodeName && attrElems.test(elem.nodeName) && (name === 'srces' || $.multimediaSupport.attrFns[name] || booleanNames[name] || srcNames[name])) ){
			return oldAttr(elem, name, value, pass);
		}
		
		var set = (value !== undefined), elemName, api, ret;
		
		if($.multimediaSupport.attrFns[name]){
			
			api = $.data(elem, 'mediaElemSupport');
			if( !api ) {
				return oldAttr(elem, name, value, pass);
			} else {
				ret = api.apis[api.name][name](value, pass);
				if(!set){
					return ret;
				}
			} 
		}
		if(!set){
			if(booleanNames[name]){
				return ( typeof elem[name] === 'boolean' ) ? elem[name] : !!((elem.attributes[name] || {}).specified);
			}
			if(srcNames[name]){
				
				return $.support.video && elem[name] || m.helper.makeAbsURI(elem.getAttribute(name));
			}
			if(name === 'srces'){
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
				
				return ret;
			}
		} else {
			name = (name === 'src') ? 'srces' : name;
			if(booleanNames[name]){
				value = !!(value);
				elem[name] = value;
				if(value){
					elem.setAttribute(name, name);
				} else {
					elem.removeAttribute(name);
				}
			}
			if(srcNames[name]){
				elem.setAttribute(name, value);
			}
			if (name === 'srces') {
				elemName = elem.nodeName.toLowerCase();
				$('source, a.source', elem).remove();
				elem.removeAttribute('src');
				value = $.isArray(value) ? value : [value];
				
				$.each(value, function(i, src){
					//add type if missing and available, good to avoid bugs in webkit browser
					src = $.multimediaSupport.addType(src, elemName);
					ret = doc.createElement('source');
					
					ret.setAttribute('src', src.src);
					if(src.type){
						ret.setAttribute('type', src.type);
					}
					if(src.media){
						ret.setAttribute('media', src.media);
					}
					elem.appendChild(ret);
				});
			}
		}
	};
	
	function sourceError(){
		$.event.special.mediaerror.handler.apply($(this).closest('video, audio')[0], arguments);
	}
	
	function bindSource(){
		$('source', this)
			.unbind('error', sourceError)
			.filter(':last')
			.bind('error', sourceError)
		;
		
	}
	
	$.event.special.mediaerror = {
		setup: function(){
			//ff always triggers an error on video/audio | webkit/opera triggers error event on source, if available
			$(this)
				.bind('error', $.event.special.mediaerror.handler)
				.each(bindSource)
				.bind('emtptied', bindSource)
			;
		},
		teardown: function(){
			$(this)
				.unbind('error', $.event.special.mediaerror.handler)
				.find('source')
				.unbind('error', sourceError)
			;
		},
		handler: function(e){
			e = $.extend({}, e || {}, {type: 'mediaerror'});
			return $.event.handle.apply(this, arguments);
		}
	};
	
	function getLastSrc(media){
		var src = media.currentSrc || media.getAttribute('src');
		if(!src){
			media = media.getElementsByTagName('source');
			if(media.length){
				src =  media[media.length - 1].getAttribute('src');
			}
		}
		return src;
	}
	
	function isNotLoaded(media){
		return (media.readyState === 0 || media.error || ($.nodeName(media, 'video') && !media.videoHeight));
	}
	
	var errorDelay = 3000;
	$(window).load(function(){
		errorDelay = 1000;
	});
	
	function assumeError(){
		var media 	= this,
			src 	= getLastSrc(this)
		;
		if( src && isNotLoaded(media)){
			var data = $.data(this, 'assumedError') || $.data(this, 'assumedError', {});
			data.triggerError = false;
			if(data.timer){
				clearTimeout(data.timer);
			}
			data.timer = setTimeout(function(){
				if(isNotLoaded(media)){
					$.event.special.assumedMediaerror.handler.call(media, {type: 'assumedError'});
				}
			}, errorDelay);
		}
	}
	
	$.event.special.assumedMediaerror = {
		setup: function(){
			$(this)
				.bind('mediaerror', $.event.special.assumedMediaerror.handler)
				// safari/chrome have several problems
				.each(function(){
					
					if('webkitPreservesPitch' in this){
						
						var jElm = $(this);
						jElm
							.bind('loadstart emptied', assumeError)
							.attr('srces', jElm.attr('srces'))
						;
						if(this.load){
							this.load();
						}
						assumeError.call(this, {type: 'manually'});
					}
				})
			;
		},
		teardown: function(){
			$(this)
				.unbind('mediaerror', $.event.special.assumedMediaerror.handler)
				.unbind('emtptied', assumeError)
			;
		},
		handler: function(e){
			var data 	= $.data(this, 'assumedError') || $.data(this, 'assumedError', {}),
				src 	= getLastSrc(this)
			;
			if(data.triggeredError !== src){
				clearTimeout(data.timer);
				data.triggerError = src;
				e = $.extend({}, e || {}, {type: 'assumedMediaerror'});
				return $.event.handle.apply(this, arguments);
			}
		}
	};
	
	function getExt(src){
		var pos = (src.indexOf('?') + 1),
			ext = ''
		;
		src = (pos) ? src.substring(0, pos) : src;
		pos = src.lastIndexOf('.') + 1;
		ext = src.substr(pos);
		return ext;
	}
	
	
	$.extend($.multimediaSupport, {
		addType: function(src, name){
			var type;
			
			if(typeof src === 'string'){
				src = {src: src};
			}
			if(src && !src.type){
				type = this.apis[name].nativ.ext2type[ getExt(src.src) ];
				if(type){
					src.type = type;
				}
			}
			return src;
		},
		attrFns: {},
		add: function(name, elemName, api, hard){
			if(!this.apis[elemName][name] || hard){
				this.apis[elemName][name] = $.extend(this.apis[elemName][name] || {}, this.apiProto, api);
			} else {
				$.extend(true, this.apis[elemName][name], api);
			}
		},
		apiProto: {
			_init: function(){},
			canPlayType: function(type){
				var parts 	= m.helper.extractContainerCodecsFormType(type),
					that 	= this,
					ret		= 'probably'
				;
				if(!parts[1]){
					return ($.inArray(parts[0], this.canPlayContainer) !== -1) ? 'maybe' : '';
				}
				$.each(parts[1], function(i, part){
					if($.inArray(part, that.canPlayCodecs) === -1){
						ret = '';
						return false;
					}
				});
				return ret;
			},
			_canPlaySrc: function(src){
				if(typeof src !== 'string'){
					if(src.type){
						return this.canPlayType(src.type);
					}
					src = src.src;
				}
				return ($.inArray(getExt(src), this.canPlayExts) !== -1) ? 'maybe' : '';
			},
			_setActive: function(){},
			_setInactive: function(){}
		},
		apis: {
			audio: {
				nativ: $.extend({}, {
					ext2type: {
						mp3: 'audio/mpeg',
						mp4: 'audio/mp4',
						ogg: 'audio/ogg',
						oga: 'audio/ogg'
					}
				}, this.apiProto)
			},
			video: {
				nativ: $.extend({}, {
					ext2type: {
						mov: 'video/quicktime',
						qt: 'video/quicktime',
						m4v: 'video/mp4',
						mp4: 'video/mp4',
						mpg: 'video/mpeg',
						mpeg: 'video/mpeg',
						ogg: 'video/ogg',
						ogv: 'video/ogg'
					}
				}, this.apiProto)
			}
		},
		
		helper: {
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
			beget: function(sup){
				var F = function(){};
				F.prototype = sup;
				return new F();
			},
			_create: function(elemName, supType, html5elem, opts){
				var data = $.data(html5elem, 'mediaElemSupport') || $.data(html5elem, 'mediaElemSupport', {apis: {}, nodeName: elemName});
				if(!data.apis[supType]){
					data.apis[supType] = m.helper.beget( m.apis[elemName][supType]);
					data.apis[supType].html5elem = html5elem;
					data.apis[supType].nodeName = elemName;
					data.apis[supType].name = supType;
					data.apis[supType].data = {};
					data.apis[supType].embedOpts = opts;
				}
				return data;
			},
			_setAPIActive: function(html5elem, supType){
				var data 		= $.data(html5elem, 'mediaElemSupport'),
					oldActive 	= data.name
				;
				if(oldActive === supType){return true;}
				var hideElem = data.apis[data.name].apiElem,
					showElem = data.apis[supType] && data.apis[supType].apiElem,
					apiReady = false
				;
				if(hideElem && hideElem.nodeName){
					hideElem.style.display = 'none';
					setTimeout(function(){
						try {
							data.apis[oldActive].pause();
						} catch(e){}
					}, 0);
					data.apis[data.name]._setInactive();
				}
				
				if(showElem && showElem.nodeName){
					showElem.style.display = 'block';
					data.apis[oldActive]._setActive();
					apiReady = true;
				}
				data.name = supType;
				
				return apiReady;
			},
			getAttrs: function(media){
				media = media;
				var attrs 	= {};
				$.each(['autobuffer', 'autoplay', 'loop', 'controls', 'poster'], function(i, name){
					attrs[name] = $.attr(media, name);
				});
				return attrs;
			},
			//ToDo: Simplify
			getDimensions: function(media){
				var ret = {
							height: 150,
							width: 300
						},
					isAuto,
					curHeight
				;
				curHeight = $.curCSS(media, 'height');
				if($.nodeName(media, 'audio')){
					ret.height = 28;
					if(!$.attr(media, 'controls')){
						return {
							width: 0,
							height: 0
						};
					}
				}
				//only testing height
				//0px workaround for jQuery 1.4 + Opera, needs further testing
				if( media.currentStyle ){
					isAuto = (media.currentStyle.height === 'auto');
				} else if( curHeight !== '0px' ) {
					$.swap(media, {height: 'auto'}, function(){
						isAuto = ( curHeight === $.curCSS(media, 'height') );
					});
				}
				
				if(isAuto){
					curHeight = media.getAttribute('height');
					if(curHeight){
						ret.height = parseInt( curHeight, 10);
						ret.width = parseInt( media.getAttribute('width'), 10) || ret.width;
					}
				} else {
					ret.height = $(media).height();
					ret.width = $(media).width();
				}
				
				return  ret;
			}
		}
	});
	
	
		
	function findInitFallback(elem, opts){
		var elemName 	= elem.nodeName.toLowerCase(),
			apis 		= m.apis[elemName]
		;
		
		if(!apis){return;}
		
		//getSupportedSrc
		var srces 	= $.attr(elem, 'srces'),
			supportedSrc, dims, id, fn, attrs, apiName, e,
			apiData	= $.data(elem, 'mediaElemSupport')
		;
		
		$.each(apis, function(name, api){
			
			if(!api.isTechAvailable || name === 'nativ'){
				return;
			}
			
			$.each(srces, function(i, src){
				//ToDo: Make a difference between maybe and probably
				if(api._canPlaySrc(src)){
					supportedSrc = src.src;
					apiName = name;
					m.helper._create(elemName, name, elem, opts);
					return false;
				}
				
			});
			if(supportedSrc){return false;}
		});
		
		// important total fail error event
		if(!supportedSrc){
			e = {
				type: 'totalerror',
				srces: srces
			};
			apiData.apis.nativ._trigger(e);
			return;
		}
		
		//returns true if apiWasAlread_setAPIActive
		if(m.helper._setAPIActive(elem, apiName)){return;}
		id = elem.id;
		if(!id){
			vID++;
			id = elemName +'-'+vID;
			elem.id = id;
		}
		attrs = m.helper.getAttrs(elem);
		dims = m.helper.getDimensions(elem);
		
		fn = function(apiElem){
			apiData.apis[apiName].apiElem = apiElem;
			$(apiElem).addClass(elemName);
			apiData.apis[apiName]._init();
		};
		apiData.apis[apiName]._embed(supportedSrc, apiData.name +'-'+ id, apiData.apis[apiName], dims, attrs, fn);
	}
	
	
	
	function loadedmetadata(e){
		$(this).trigger('multiMediaAPIIsReady');
	}
	
	$.fn.mediaElementEmbed = function(opts){
		opts = $.extend(true, {}, $.fn.mediaElementEmbed.defaults, opts);
		
		return this.each(function(){
			var elemName 	= this.nodeName.toLowerCase();
			
			if(elemName !== 'video' && elemName !== 'audio'){return;}
			
			if(opts.removeControls){
				this.controls = false;
				$(this).removeAttr('controls');
			}
			
			var apiData = m.helper._create(elemName, 'nativ', this, opts);
			apiData.name = 'nativ';
			apiData.apis.nativ.apiElem = this;
			if(opts.debug || !$.support.mediaElements || this.error !== null){
				 findInitFallback(this, opts);
			} else {
				apiData.apis[apiData.name]._init();
			}
			$(this)
				.bind(opts.errorEvent, function findInitFallbackOnError(e){
					if(apiData.name === 'nativ'){
						findInitFallback(this, opts);
					}
				})
				.bind('loadedmetadata', loadedmetadata)
			;
		});
	};
	
	$.fn.mediaElementEmbed.defaults = {
		debug: false,
		errorEvent: 'assumedMediaerror', // mediaerror
		removeControls: false
	};
	
	
})();