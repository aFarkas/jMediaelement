/**
 * Simple Poster Plugin for jme
 * @author Matt Dertinger
 * @version 1.0.0
 *
 * http://protofunc.com/jme
 * http://github.com/aFarkas/jMediaelement
 *
 * @description	
 *
 * HTML:
 * 
 * <video class="player" preload="none" poster="../media/big-buck-bunny-trailer.png" controls="controls">
 *   ...
 * </video>
 *
 * OR
 *
 * <div class="fallback">
 *   <img class="photo" src="../media/big-buck-bunny-trailer.png" alt="" data-enabled="enabled" />
 *   ...
 * </div>
 *
 * API:
 *
 * $('video, audio').setPosterAttribute()
 *
 * $('video, audio').enablePoster(index|object)
 *
 * $('video, audio').disablePoster(index|object)
 * 
 * Config:
 * 
 * Documentation:
 * 
 */
(function($){
  //enable posters
  $(document).bind('jmeEmbed', function(e, data){
    data = data.data;
    var mm = $(e.target);
    mm.setPosterAttribute();
    if ($.attr(e.target, 'poster')) {
      data.posterDisplay = $('<img />', {
        src : $.attr(e.target, 'poster'),
        "class": "poster-display inactive-poster-display",
        alt : ""
      }).insertAfter(e.target);
      if( data.posterDisplay ){
        mm.enablePoster(data.posterDisplay, data);
      }
      //add fullwindow support
      if(data.posterDisplay.videoOverlay && mm.is('video')){
        data.posterDisplay
          .videoOverlay({
            fullscreenClass: 'poster-in-fullscreen',
            video: mm,
            startCSS: {
              width: 'auto',
              zIndex: 99999
            },
            position: {
              bottom: 0,
              left: 0,
              right: 0
            }
          })
        ;
      }
      mm
        .bind('play', function(){
          mm.disablePoster(data.posterDisplay, data);
        })
        .bind('ended', function(){
          mm.enablePoster(data.posterDisplay, data);
		  //worarkound:
		  mm.pause();
        })
      ;
    }
  });
  
  /* 
   * extend jme api
   */
  $.multimediaSupport.fn._extend({
    positionPoster: function(object, _data){
      object = (isFinite(object)) ? posters.filter(':eq('+ object +')') : $(object);
      if( !_data ){
        _data = $.data(this.element, 'mediaElemSupport');
      }
      // Only if the poster is visible
      if (!_data.posterDisplay || _data.posterDisplay.is(":hidden")) { return; }
      _data.posterDisplay.height($(this.element).height() + "px"); // Need incase controlsBelow
      _data.posterDisplay.width($(this.element).width() + "px"); // Could probably do 100% of box
    },
    disablePoster: function(object, _data){
      object = (isFinite(object)) ? posters.filter(':eq('+ object +')') : $(object);
      if( !_data ){
        _data = $.data(this.element, 'mediaElemSupport');
      }
      object.removeAttr('data-enabled');
      _data.posterDisplay.addClass('inactive-poster-display').fadeOut('slow');
    },
    enablePoster: function(object, _data){
      var posters = $('img.poster-display', this.element),
          that = this,
          mm = $(this.element),
          posterData,
          found
      ;
      
      if( !_data ){
        _data = mm.data('mediaElemSupport');
      }
      object = (isFinite(object)) ? posters.filter(':eq('+ object +')') : $(object);
      posters
        .filter('[data-enabled]')
        .each(function(){
          if(this !== object[0]){
            that.disablePoster(this, _data);
          }
        })
      ;
      if (!object[0]) { return; }
      
      posterData = $.data(object[0], 'jmePoster') || $.data(object[0], 'jmePoster', {load: false});
      posterData.posterDisplay = _data.posterDisplay;
      posterData.posterDisplay.removeClass('inactive-poster-display').fadeIn("slow");
      // We may not need this. But if we do, we should make it respect config.
      /* if (this.options.fit) {
        that.positionPoster(this, _data);
      } */
      object.attr('data-enabled', 'enabled');
      
    },
    setPosterAttribute: function() {
      if (!$.attr(this.element, 'poster')) {
        var image = $('img.photo[data-enabled]', this.element).first();
        if (image) { $.attr(this.element, 'poster', image.attr('src')); }
      }
    }
  }, true);
  
})(jQuery);
