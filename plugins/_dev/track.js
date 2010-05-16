/*
 * ToDo: change itext-plugin to track plugin
 * 
 * 
 * 
 * HTML:
 * <a class="track" href="srtfile.srt" data-charset="ISO-8859-1" lang="de" data-enabled="enabled" data-sanitize="sanitize" data-role="textaudiodesc">name</a>
 * 
 * API:
 * $('video, audio').track() setter/getter of tracks (setter will remove all current tracks) setting can be done by string, array or tackobject. getter always returns an array of track-objects
 * 
 * $('video, audio').addTrack pure setter without removing current tracks
 * 
 * $('video, audio').enableTrack(index|name|object)
 * 
 * $('video, audio').disableTrack(index|name|object)
 * 
 * $('video, audio').updateTrack() this will only look into the data-enabled attribute
 * 
 * Trackobject:
 * 
 * {
 * 	name: "name",
 * 	charset: "utf-8",
 * 	url: "file.srt",
 * 	enabled: true,
 *  sanitize: false,
 * 	role: "bla",
 *  lang: "de",
 * 	dom: jQuery-Object
 * }
 * 
 * HTML-Display-Area:
 * <video></video>
 * <div class="track-display">
 * 		<div>Text</div>
 * </div>
 * and
 * <div class="track-display tad-track" aria-live="assertive" style="position: absolute; left: -9999em; width: 5px; height: 5px; overflow: hidden; z-index: -100;">
 * 		<div>Text</div>
 * </div>
 * 
 * <video></video>
 * <div class="track-display inactive-track-display">
 * </div>
 * and
 * <div class="track-display tad-track inactive-track-display" aria-live="assertive" style="position: absolute; left: -9999em; width: 5px; height: 5px; overflow: hidden; z-index: -100;">
 * </div>
 * 
 * 
 * HTML-UI:
 * only toggles first track on/off. for more functionality script your own UI. API is powerfull enough
 * <a class="toggle-track">bla</a>
 */