(function($){
	//helpers for api
	var split 		= /\s*\|\s*|\s*\,\s*/g,
		getPlayList = function( elem ){
			var data = $.data(elem, 'mediaElemSupport');
			if( !data.playlist ){
				data.playlist = $([]);
			}
			return data;
		},
		loadPrevNext =  function(api, dir){
			var data = getPlayList(api.element);
			var items =  $('[data-srces]', data.playlist),
				index = items.index( items.filter('.ui-state-active') ) + dir
			;
			if( index >= items.length || index < 0 ){
				if( !data.playlist.hasClass('loop') ){return;}
				if( index >= items.length ){
					index = 0;
				} else {
					index = items.length - 1;
				}
			}
			if ( items[index] ) {
				api.loadPlaylistItem(items[index], items);
			}
		}
	;
		
	$.multimediaSupport.fn._extend({
		playlist: function(list, noAutoplay){
			var elem 		= $(this.element),
				data 		= getPlayList(this.element),
				addAutoplay = function(){
					if( !setAutoplay && ( !noAutoplay || elem.hasClass('autoplay-next') ) ){
						elem.attr('autoplay', true);
						setAutoplay = true;
					}
				},
				setAutoplay
			;
			if( !list ){
				return data.playlist;
			}
			data.playlist.remove();
			data.playlist = list;
			elem
				.unbind('.playlist')
				.one('play.playlist', addAutoplay)
				.bind('ended.playlist', function(){
					//opera is not responding
					if( elem.hasClass('autoload-next') || elem.hasClass('autoplay-next') ){
						setTimeout(function(){
							elem.loadNextPlaylistItem();
						}, 0);
					}
				})
			;
						
			data.playlist
				.delegate('[data-srces]', 'ariaclick', function(e){
					addAutoplay();
					elem.loadPlaylistItem(this);
					e.preventDefault();
				})
			;
			this._trigger({
				type: 'playlistchange',
				playlist: data.playlist
			});
			// if we have no source, load and play ui-state-active marked or first playlist-item
			if( !elem.attr('srces').length ){
				var items 		= $('[data-srces]', data.playlist),
					activeItem 	= items.filter('.ui-state-active')
				;
				if( !activeItem[0] ){
					activeItem = items;
				}
				this.loadPlaylistItem(activeItem[0], items);
			}
		},
		loadPlaylistItem: function(item, _items){
			item = $(item);
			
			var data = getPlayList(this.element);
			_items = _items || $('[data-srces]', data.playlist);
			
			var oldItem  = _items
					.filter('.ui-state-active')
					.removeClass('ui-state-active'),
				newItem  = $(this),
				srces = item.attr('data-srces')
			;
			if(srces){
				srces = srces.split(split);
				item.addClass('ui-state-active');
				this.loadSrc(srces, item.attr('data-poster'), item.attr('data-label') || $.trim( item.text() ) );
				this._trigger({
					type: 'playlistitemchange',
					items: _items, 
					currentIndex: _items.index( item ),
					currentItem: item, 
					previousItem: oldItem
				});
			}
		},
		loadNextPlaylistItem: function(){
			loadPrevNext(this, 1);
		},
		loadPreviousPlaylistItem: function(){
			loadPrevNext(this, -1);
		}
	});
	
	$.fn.jmeControl.defaults.playlist = {autoplay: true};
	$.fn.jmeControl.addControl('playlist', function(playlist, element, api, o){
		
		element.playlist( playlist, !o.playlist.autoplay );
		var items = $('[data-srces]', playlist);
		//add themeroller classes
		if(o.addThemeRoller){
			playlist.addClass('ui-corner-all  ui-widget-header');
			items.addClass('ui-state-default ui-widget-content ui-corner-all');
		}
		if( items.attr('tabindex') === undefined && !items.attr('role') ){
			items.attr({
				role: 'button',
				tabindex: '0'
			});
		}
	});
})(jQuery);
