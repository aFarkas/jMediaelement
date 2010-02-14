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
			} else if(srcNames[name]){
				elem.setAttribute(name, value);
			} else if (name === 'srces') {
				elemName = elem.nodeName.toLowerCase();
				$('source, a.source', elem).remove();
				elem.removeAttribute('src');
				value = $.isArray(value) ? value : [value];
				
				$.each(value, function(i, src){
					
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
	
	function bindSource(e){
		
		//webkit is really stupid with the error event, so fallback to canPlaytype
		if ('webkitPreservesPitch' in this || window.opera) {
			var srces 	= $.attr(this, 'srces'),
				elem 	= this,
				name 	= elem.nodeName.toLowerCase(),
				canplay = false
			;

			$.each(srces, function(i, src){
				canplay = m.apiProto._canPlaySrc(src, elem, name);
				if(canplay){return false;}
			});

			if(!canplay){
				setTimeout(function(){
					$(elem).triggerHandler('mediaerror');
				}, 0);
				//stop trying to play
				try {
					$.attr(this, 'autoplay', false);
					this.pause();
				} catch(er){}
			}
			// we don´t need loadstart workaround, because this webkit has implemented emptied event, oh yeah
			if(e && e.type === 'emptied' && e.orginalEvent && e.orginalEvent.type === 'emptied'){
				$(this).unbind('loadstart', bindSource);
			}
		} //end webkit workaround

		//bind error 
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
			//some webkit browsers doesn´t throw emptied event, so we use loadstart instead
			if ('webkitPreservesPitch' in this) {
				$(this).bind('loadstart', bindSource);
			}
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
	
	function getExt(src){
		var pos = (src.indexOf('?') + 1),
			ext = ''
		;
		src = (pos) ? src.substring(0, pos) : src;
		pos = src.lastIndexOf('.') + 1;
		ext = src.substr(pos);
		return ext;
	}
	
	var mimeTypes = {
			audio: {
				//oga shouldn´t be used!
				'application/ogg': ['ogg','oga'],
				'audio/mpeg': ['mp2','mp3','mpga','mpega'],
				'audio/mp4': ['mp4','mpg4'],
				'audio/wav': ['wav'],
				'audio/x-m4a': ['m4a'],
				'audio/x-m4p': ['m4p']
			},
			video: {
				//ogv shouldn´t be used!
				'application/ogg': ['ogg','ogv'],
				'video/mpeg': ['mpg','mpeg','mpe'],
				'video/mp4': ['mp4','mpg4', 'm4v'],
				'video/quicktime': ['mov','qt'],
				'video/x-msvideo': ['avi'],
				'video/x-ms-asf': ['asf', 'asx'],
				'video/flv': ['flv', 'f4v']
			}
		}
	;
	
	$.extend($.multimediaSupport, {
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
			canPlayType: function(type, elem){
				elem = elem || this.apiElem;
				if(elem && elem.canPlayType){
					return elem.canPlayType(type);
				}
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
			_canPlaySrc: function(src, elem, name){
				var that = this;
				elem = elem || this;
				name = name || this.nodeName || ((elem || {}).nodeName || '').toLowerCase();
				if(typeof src !== 'string'){
					if(src.type){
						return elem.canPlayType(src.type);
					}
					src = src.src;
				}
				
				var ext = getExt(src), ret = '';
				$.each(mimeTypes[name], function(mime, exts){
					var index = $.inArray(ext, exts);
					if(index !== -1){
						ret = that.canPlayType(mime, elem);
						if(ret){
							return false;
						}
					}
				});
				return ret;
			},
			_setActive: function(){},
			_setInactive: function(){}
		},
		apis: {
			audio: {
				nativ: $.extend({}, this.apiProto)
			},
			video: {
				nativ: $.extend({}, this.apiProto)
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
					if(data.nodeName !== 'audio' || $.attr(html5elem, 'controls')){
						showElem.style.display = 'block';
					}
					data.apis[supType]._setActive();
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
			//ToDo: Simplify and move to $.fn.height/$.fn.width
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
			if( (!api.isTechAvailable || ( $.isFunction(api.isTechAvailable) && !api.isTechAvailable()) ) || name === 'nativ'){
				return;
			}
			$.each(srces, function(i, src){
				//ToDo: Make a difference between maybe and probably
				if(api._canPlaySrc(src, false, elemName)){
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
		
		//returns true if api is already active
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
			if(elemName === 'audio' && !attrs.controls){
				apiElem.style.display = 'none';
			}
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
			if(opts.debug || !$.support.mediaElements){
				 findInitFallback(this, opts);
			} else {
				apiData.apis[apiData.name]._init();
			}
			$(this)
				.bind('mediaerror', function findInitFallbackOnError(e){
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
		removeControls: false
	};
	
	
})();