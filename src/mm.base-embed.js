/**!
 * Part of the jMediaelement-Project | http://github.com/aFarkas/jMediaelement
 * @author Alexander Farkas
 * Copyright 2010, Alexander Farkas
 * Dual licensed under the MIT or GPL Version 2 licenses.
 */

(function(){
	
	var $ 					= jQuery,
		v 					= $('<video />')[0],
		a 					= $('<audio />')[0],
		vID 				= new Date().getTime(),
		isOldSaf 			= ($.browser.safari && 532 > parseInt($.browser.version, 10)),
		oldAttr 			= $.attr,
		doc					= document,
		enhancedSupport
	;
	
	$('<source></source>');
	$('<itext></itext>');
	
	$.support.video = !!(v.canPlayType);
	$.support.audio = !!(a.canPlayType);
	
	v = null;
	a = null;
	
	enhancedSupport = ($.support.video && $.support.audio);// && !isOldSaf
	
	var attrElems = /video|audio|source/i,
		srcNames = {
			src: true,
			poster: true
		},
		booleanNames = {
			loop: true,
			autoplay: true,
			controls: true
		}
	;
	
	$.attr = function(elem, name, value, pass){
		
		if( !(elem.nodeName && attrElems.test(elem.nodeName) && (name === 'srces' || $.multimediaSupport.attrFns[name] || booleanNames[name] || srcNames[name])) ){
			return oldAttr(elem, name, value, pass);
		}
		
		var set = (value !== undefined), api, ret;
		if($.multimediaSupport.attrFns[name]){
			api = ($.data(this[0], 'mediaElemSupport') || {});
			if( !api.name || !api.apis ) {
				return oldAttr(elem, name, value, pass);
			} else {
				ret = api.apis[api.name](name, value, pass);
				if(!set){
					return ret;
				}
			} 
		}
		if(!set){
			if(booleanNames[name]){
				return (elem[name] || elem[name] === false) ? state : !!((elem.attributes[name] || {}).specified);
			}
			if(srcNames[name]){
				return $.support.video && elem[name] || $.multimediaSupport.helper.makeAbsURI(elem.getAttribute(name));
			}
			if(name === 'srces'){
				ret = [];
				$('source', elem).each(function(i){
					ret.push({
						src: $.attr(this, 'src'),
						type: this.getAttribute('type'),
						media: this.getAttribute('media')
					});
				});
				if(! ret.length ){
					ret = [{
							src: $.attr(elem, 'src'),
							type: elem.getAttribute('type'),
							media: elem.getAttribute('media')
						}]
					;
				}
				return ret;
			}
		} else {
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
				$('source', elem).remove();
				elem.removeAttribute('src');
				if(typeof value === 'string'){
					elem.setAttribute(value);
					return;
				}
				value = $.isArray(value) ? value : [value];
				
				$.each(value, function(i, src){
					if(typeof src === 'string'){
						src = {src: src};
					}
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
	
	function getExt(src){
		var pos = (src.indexOf('?') + 1),
			ext = ''
		;
		src = (pos) ? src.substring(0, pos) : src;
		pos = src.lastIndexOf('.') + 1;
		ext = src.substr(pos);
		return ext;
	}
	
	var booleanAttrs = ['autoplay', 'loop', 'controls'];
	
	$.multimediaSupport = {
		attrFns: {},
		add: function(name, elemName, api, hard){
			if(!this.apis[elemName][name] || hard){
				this.apis[elemName][name] = $.extend({}, this.apiProto, api);
			} else {
				$.extend(true, this.apis[elemName][name], api);
			}
		},
		apiProto: {
			_init: function(){},
			canPlayType: function(type){
				var parts 	= helper.extractContainerCodecsFormType(type),
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
				//empty and therefore invalid native implementation
				nativ: $.extend({}, this.apiProto)
			},
			video: {
				//empty and therefore invalid native implementation
				nativ: $.extend({}, this.apiProto)
			}
		},
		
		helper: {
			extractContainerCodecsFormType: function(type){
				var types = type.split(/\s*;\s*/g);
				if(types[1] && types[1].indexOf('codecs') !== -1){
					//console.log()
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
			_create: function(elemName, supType, html5elem){
				var data = $.data(html5elem, 'mediaElemSupport') || $.data(html5elem, 'mediaElemSupport', {apis: {}, nodeName: elemName});
				if(!data.apis[supType]){
					var F = function(){};
					F.prototype = $.multimediaSupport.apis[elemName][supType];
					data.apis[supType] = new F();
					data.apis[supType].html5elem = html5elem;
					data.apis[supType].nodeName = elemName;
					data.apis[supType].name = supType;
					data.apis[supType].data = {};
				}
				return data;
			},
			_setAPIActive: function(html5elem, supType){
				var data = $.data(html5elem, 'mediaElemSupport');
				if(data.name === supType){return;}
				var hideElem = data.apis[data.name].apiElem,
					showElem = data.apis[data.supType] && data.apis[data.supType].apiElem,
					apiReady
				;
				if(hideElem && hideElem.nodeName){
					hideElem.style.display = 'none';
					data.apis[data.name]._setInactive();
				}
				if(showElem && showElem.nodeName){
					showElem.style.display = 'block';
					data.apis[data.name]._setActive();
					apiReady = true;
				}
				data.name = supType;
				
				return apiReady;
			},
			getAttrBoolState: function(elem, name){
				var state = elem[name];
				return (state || state === false) ? state : !!((elem.attributes[name] || {}).specified);
			},
			getAttrs: function(media){
				var attrs 	= {
					poster: media.poster || $.multimediaSupport.helper.makeAbsURI(media.getAttribute('poster'))
				};
				
				$.each(booleanAttrs, function(i, name){
					attrs[name] = $.multimediaSupport.helper.getAttrBoolState(media, name);
				});
				
				return attrs;
			},
			getDimensions: function(media){
				var ret = {
							height: 150,
							width: 300,
							isAuto: false
						},
					curHeight
				;
				curHeight = $.curCSS(media, 'height');
				
				//only testing height
				//0px workaround for jQuery 1.4 + Opera
				if(media.currentStyle && curHeight !== '0px'){
					ret.isAuto = (media.currentStyle.height === 'auto');
				} else if(curHeight !== '0px') {
					$.swap(media, {height: 'auto'}, function(){
						ret.isAuto = (curHeight === $.curCSS(media, 'height'));
					});
				} else {
					ret.isAuto = false;
					
					ret.height = $(media).height();
					ret.width = $(media).width();
				}
				
				if(ret.isAuto){
					curHeight = media.getAttribute('height');
					if(curHeight){
						ret.isAuto = false;
						ret.height = curHeight;
						ret.width = media.getAttribute('width') || ret.width;
					}
				} else {
					ret.height = parseInt(curHeight, 10) || ret.height;
					ret.width = parseInt($.curCSS(media, 'width'), 10) || ret.width;
				}
				
				
				if(ret.isAuto){
					setTimeout(function(){
						throw('we do not support width/height without dimensions yet, use css or height/width-attributes plz');
					}, 0);
				}
				return  ret;
			}
		}
	};
	
	var mmApis 	= $.multimediaSupport.apis,
		helper 	= $.multimediaSupport.helper
	;
		
	function findInitFallback(mm, opts){
		var elemName 	= mm.nodeName.toLowerCase(),
			apis 		= mmApis[elemName]
		;
		
		if(!apis){return;}
		
		var srces 	= $.attr(mm, 'srces'),
			mmSrc, dims, id, fn, attrs, apiName,
			apiData	= $.data(mm, 'mediaElemSupport')
		;
		
		$.each(apis, function(name, api){
			
			if(!api.isTechAvailable || name === 'nativ'){
				return;
			}
			
			$.each(srces, function(i, src){
				
				//ToDo: Make a difference between maybe and probably
				if(api._canPlaySrc(src)){
					mmSrc = src.src;
					apiName = name;
					helper._create(elemName, name, mm);
					return false;
				}
				
			});
			if(mmSrc){return false;}
		});
		
		if(!mmSrc){return;}
		if(helper._setAPIActive(mm, apiName)){return;}
		id = mm.id;
		if(!id){
			vID++;
			id = elemName +'-'+vID;
			mm.id = id;
		}
		attrs = helper.getAttrs(mm);
		dims = helper.getDimensions(mm);
		fn = function(apiElem){
			apiData.apis[apiName].apiElem = apiElem;
			$(apiElem).addClass(elemName);
			apiData.apis[apiName]._init();
		};
		apiData.apis[apiName]._embed(mmSrc, apiData.name +'-'+ id, mm, dims, attrs, fn, opts);
	}
	
	
	
	function loadedmetadata(e){
		$(this).trigger('multiMediaAPIIsReady');
	}
	
	$.fn.mediaElementEmbed = function(opts){
		opts = $.extend(true, {}, $.fn.mediaElementEmbed.defaults, opts);
		
		function findInitFallbackOnError(e){
			if(this.error !== null){ // or > 2
				findInitFallback(this, opts);
			}
			e.stopImmediatePropagation();
		}
				
		return this.each(function(){
			var elemName 	= this.nodeName.toLowerCase();
			
			if(elemName !== 'video' && elemName !== 'audio'){return;}
			
			if(opts.removeControls){
				this.controls = false;
				$(this).removeAttr('controls');
			}
			
			var apiData = helper._create(elemName, 'nativ', this);
			apiData.name = 'nativ';
			apiData.apis.nativ.apiElem = this;
			if(opts.debug || !enhancedSupport || this.error !== null){
				 findInitFallback(this, opts);
			} else {
				apiData.apis[apiData.name]._init();
			}
			$(this)
				.bind('error', findInitFallbackOnError)
				.bind('loadedmetadata', loadedmetadata)
			;
		});
	};
	
	$.fn.mediaElementEmbed.defaults = {
		debug: false,
		removeControls: true
	};
	
	
})();