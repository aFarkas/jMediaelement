(function($){
	var multiple = {
		contentURL: 1
	};
	var shemaData = {
		image: 'poster',
		thumbnail: 'poster',
		contentURL: 'srces',
		name: 'name',
		description: 'description'
	};
	var mediaProps = {
		poster: 1,
		srces: 1
	};
	var itemsSel = '[itemprop="video"], [itemprop="audio"], [itemprop="tracks"]';
	var getMediaInfo = function(){
		var elem = $(this);
		return elem.attr('content') || elem.attr('href') || elem.attr('src') || elem.text() || "";
	};
	
	$.jme.getMediaInfo = function(elem){
		elem = $(elem);
		var info = {
			media: {}
		};
		$.each(shemaData, function(name, value){
			var extData = (mediaProps[value]) ? info.media : info;
			if(!extData[value]){
				var item = $('[itemprop="'+ name +'"]', elem);
				if(multiple[name]){
					extData[value] = item.map(getMediaInfo).get();
				} else {
					extData[value] = getMediaInfo.call(item);
				}
			}
		});
		return info;
	};
	
	$.jme.defineProp('selectedItem', {
		get: function(elem){
			var data = $.jme.data(elem);
			var selectItem = data.selectedIndex;
			var items;
			if(!data.selectedItem){
				items = $(itemsSel, elem);
				if(typeof data.selectedIndex !== 'number') {
					data.selectedItem = items.filter('.selected-item');
					data.selectedIndex = items.index(data.selectedItem);
				} else {
					data.selectedItem = items.eq(data.selectedIndex);
				}
				
			}
			return [data.selectedItem, data.selectedIndex];
		},
		set: function(elem, item){
			var data = $.jme.data(elem);
			var items = $(itemsSel, elem);
			var newItem = (typeof item == 'number') ? items.eq(item) : $(item);
			if(newItem && newItem[0]){
				data.selectedIndex = (typeof item == 'number') ? item : items.index(newItem[0]);
				data.selectedItem = newItem;
				items.removeClass('selected-item');
				data.selectedItem.addClass('selected-item');
				data.mediaInfo = $.jme.getMediaInfo(newItem);
				data.media.jmeProp(data.mediaInfo.media);
			}
			return 'noDataSet';
		}
	});
	
	$.jme.registerPlugin('playlist', {
		pseudoClasses: {
			active: 'active-playlist'
		},
		options: {
			loop: false,
			autoplay: false,
			selectedIndex: false,
			selectedItem: false
		},
		structure: '<ul></ul>',
		_create: function(control, media, base, opts){
			
			this._getSelectedItem(control, media, base, opts);
			$(media).bind('ended', function(){
				if(opts.autoplay){
					var items = $(itemsSel, control);
					var selectedItem = control;
				}
			});
			$(control).delegate(itemsSel, 'click', function(){
				control.jmeProp('selectedItem', this);
				media.play();
				return false;
			});
		},
		_getSelectedItem: function(control, media, base, opts){
			console.log(control.jmeProp('selectedItem'));
		}
	});
})(jQuery);
