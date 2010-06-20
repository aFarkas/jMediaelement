/**
 * playlist plugin for the jMediaelement project | http://github.com/aFarkas/jMediaelement
 * @author Alexander Farkas
 * Copyright 2010, Alexander Farkas
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * 
 * Documentation:
 * http://protofunc.com/jme/plugins/playlist.html
 */
(function($){
	//helpers for api
	var split 		= /\s*\|\s*|\s*\,\s*/g,
		itemSel 	= 'li[data-srces], li.play-item',
		getItemProps = function(item){
			var img 	= $('img', item),
				props 	= {
					label: item.attr('data-label'),
					srces: [],
					poster: (img[0]) ? img[0].src : item.attr('data-poster')
				},
				srces 	= $('a', item),
				nameElem
			;
			
			if(!props.label){
				nameElem = $('.item-name', item);
				props.label = $.trim( ( ( nameElem[0] ) ? nameElem : item ).text() );
			}
			
			if( srces.length ){
				$.each(srces, function(i, src){
					props.srces[i] = {src: this.href};
					var type = $.attr(src, 'type');
					if( type ){
						props.srces[i].type = type;
					}
				});
				
			} else {
				props.srces = (item.attr('data-srces') || '').split(split);
			}
			return props;
		},
		getPlayList = function( elem ){
			var data = $.data(elem, 'mediaElemSupport');
			if( !data.playlist ){
				data.playlist = $([]);
			}
			return data;
		},
		loadPrevNext =  function(api, list, dir, autoplay){
			var items =  $(itemSel, list),
				index = items.index( items.filter('.ui-state-active') ) + dir
			;
			if( index >= items.length || index < 0 ){
				if( !list.hasClass('loop') ){return;}
				if( index >= items.length ){
					index = 0;
				} else {
					index = items.length - 1;
				}
			}
			if ( items[index] ) {
				list.loadPlaylistItem(items[index], items, autoplay);
			}
		},
		createItemString = function(_i, item){
			if( !$.isArray(item.srces) ){
				item.srces = [item.srces];
			}
			
			if( typeof item === 'string' ){
				 item = {src:  item};
			}
			
			var domItem = '<li class="play-item"';
			if(item.poster){
				domItem += ' data-poster="'+ item.poster +'"';
			}
			
			if( item.name ){
				domItem += ' data-label="'+ item.name +'"><span class="item-name">'+item.name+'</span>';
			}
			
			for(var i = 0, len = item.srces.length; i < len; i++){
				if(typeof item.srces[i] === 'string'){
					item.srces[i] = {src: item.srces[i]};
				}
				domItem += ' <a href="'+item.srces[i].src +'"';
				
				if( item.srces[i].type ){
					domItem += ' type="'+ item.srces[i].type +'"';
				}
				
				domItem += '>'+item.srces[i].src +'</a>';
			}
			
			domItem += '</li>';
			return domItem;
		},
		createJDOMList = function(list){
			if(!list.length){return $([]);}
			//getItemProps,
			var domList = '<ul class="playlist">';
			for(var i = 0, len = list.length; i < len; i++){
				domList += createItemString(i, list[i]);
			}
			
			domList += '</ul>';
			
			return $(domList);
			
		}
	;
	
	$.each(['activatePlaylist', 'loadPlaylistItem', 'loadNextPlaylistItem', 'loadPreviousPlaylistItem'], function(i, name){
		var _name = '_'+ name;

		$.fn[name] = function(){
			var args = Array.prototype.slice.call(arguments, 0);
			return this.each(function(){
				var jme 	= $.data(this, 'playlistFor'),
					api
				;
				if( jme ){
					args.unshift(this);
					api = jme.getJMEAPI();
					if( name !== 'activatePlaylist' ){
						api._activatePlaylist.call(api, this);
					}
				} else {
					api = getPlayList(this);
					args.unshift(api.playlist);
					api = api.apis[api.name];
				}

				if( api ){
					api[_name].apply(api, args);
				}
			});
		};
	});
		
	$.multimediaSupport.fn._extend({
		_activatePlaylist: function(list){
			list = $(list);
			var data = getPlayList(this.element);
			if( data.playlist[0] === list[0] || list.hasClass('active-playlist') ){return;}
			
			var oldList = data.playlist.removeClass('active-playlist');
			$(itemSel, data.playlist).removeClass('ui-state-active');
			if(!list[0]){
				list = data.playlist;
			}			
			data.playlist = list;
			list.addClass('active-playlist');
			
			// if we have no source, load and play ui-state-active marked or first playlist-item
			var items 		= $(itemSel, list),
				activeItem 	= items.filter('.ui-state-active')
			;
			
			if( !activeItem[0] ){
				activeItem = items;
			}
			
			this._loadPlaylistItem(list, activeItem[0], items);
			
			this._trigger({
				type: 'playlistchange',
				playlist: list,
				oldPlaylist: oldList
			});
		},
		playlist: function(list, _addThemeRoller, activate){
			var elem 		= $(this.element);
			if( !list ){
				return getPlayList(this.element).playlist;
			}
			
			if( $.isArray(list) ){
				list = createJDOMList( list );
			} else {
				list = $( list );
			}
			
			if(activate || !$.attr(this.element, 'srces').length ){
				this._activatePlaylist(list);
			}
			
			if( !list.data('playlistFor') ) {
				var items = $(itemSel, list);
				elem
					// ToDo: should delay ended event instead
					.bind('ended.playlist', function(){
						var autoplay = list.hasClass('autoplay-next');
						if( list.hasClass('active-playlist') && ( autoplay || list.hasClass('autoload-next') ) ){
							//opera is not responding
							setTimeout(function(){
								elem.loadNextPlaylistItem(list, autoplay);
							}, 0);
						}
					})
				;
							
				list
					.delegate(itemSel, 'ariaclick', function(e){
						list.loadPlaylistItem(this, undefined, true);
						e.preventDefault();
					})
				;
				
				
				if(_addThemeRoller){
					list.addClass('ui-corner-all  ui-widget-header');
					items.addClass('ui-state-default ui-widget-content ui-corner-all');
				}
				
				if( !items.attr('role') ){
					items
						.attr({
							role: 'button',
							tabindex: '0'
						})
						.find('a')
						.attr({
							role: 'presentation',
							tabindex: '-1'
						})
					;
				}
				
				
				list.data('playlistFor', elem);
				
				this._trigger({
					type: 'playlistcreated',
					playlist: list
				});
			}
			return list;
		},
		_loadPlaylistItem: function(list, item, _items, _autoplay){
			if(!_items){
				_items = $(itemSel, list);
			}
			_items = $(_items);
			item = $(item);

			var oldItem  	= _items
					.filter('.ui-state-active')
					.removeClass('ui-state-active'),
				itemProps 	= getItemProps(item),
				curIndex 	= _items.index( item ),
				elem 		= $(this.element),
				available 	= {next: true, prev: true}
			;
			
			item.addClass('ui-state-active');
			
			this.loadSrc(itemProps.srces, itemProps.poster, itemProps.label );
						
			this._trigger({
				type: 'playlistitemchange',
				list: list,
				items: _items, 
				props: itemProps,
				currentIndex: curIndex,
				currentItem: item, 
				previousItem: oldItem,
				autoplay: _autoplay
			});
			
			if( _autoplay ){
				setTimeout(function(){
					elem.play();
				}, 0);
			}
		},
		_loadNextPlaylistItem: function(list, autoplay){
			loadPrevNext(this, list, 1, autoplay);
		},
		_loadPreviousPlaylistItem: function(list, autoplay){
			loadPrevNext(this, list, -1, autoplay);
		}
	});
	
	$.fn.jmeControl.defaults.playlist = {};
	$.fn.jmeControl.addControl('playlist', function(playlist, element, api, o){
		element.playlist( playlist, o.addThemeRoller, o.playlist.activate );
	});
})(jQuery);
