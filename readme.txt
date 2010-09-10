-------------------------------------------------------------------
jme - a media libary for jquery & jquery.ui
http://protofunc.com/jme/
-------------------------------------------------------------------


I. File-Structur
-------------------------------------------------------------------
1. packages
Main js files and swf fallback player, simply copy all of them into
your JS-directory. (You will only need to include one js-file.)
2. demos
Use the demos as a starting point
3. utils
uitils like an mouseactivity event (for UI behavior), the
quick-starter utility 'jmeEmbedControls' and a jme-debug helper which 
logs some usefull information, if you have troubles to get started.
4. plugins
API-Plugins like fullwindow/fullscreen, captions...

II. Getting started
ToDo, till then go to http://protofunc.com/jme/

III. License
The jme-JavaScript is licensed under MIT & GPL Version 2. The 
player.swf is JW Player form http://www.longtailvideo.com, 
wich is Open Source for non-commercial use. For more information go
to http://www.longtailvideo.com.

III. Release notes
Release 1.3.1
	- activateFlash option (always use flash, if available)
	- workaround for flash in newst flash version with IE (http://bugs.adobe.com/jira/browse/FP-5056)
	- preload none is respected in newest Chrome (due to the fact, that chrome has implemented the preload-interface, but not the preload feature, we are forced to do browser sniffing here)
	- better flash embedding

Release 1.3
	- added flashblocker handling + event
	- allow configuring flash-paths through markup
	- added some JWPlayer configuration through markup (i.e. data-type="sound")
	- added controls-configuration through markup (i.e. <div class="timeline-slider" data-range="min" />)
	- better flash fullscreen handling
	- fixed "position: fixed" feature detection
	- added minimalstic demo + styled demo (good starting examples)
	- added simple DFXP/TTML parsing for captions
	- dynamically changing preload-attribute through $.fn.attr/$.attr after initialzing is repsected now
	- Background, margin, padding Styles are transfered to the fallback (fallback is transparent by default now, if wmode is also transparent and icons are false)
	- provider/type for jw player is now calculated dynamically for loadSrc-method
	- workaround for jw-player autoplay bug with some streams

Release 1.2.4
	- refactored preload handling to better meet the spec
	- improved jmefs plugin
	- added support for background-styles/transparent flashplayer
	- added provider handling for jw player

Release 1.2.2 
	- fixed opera not playing with preload-workaround

Release 1.2.1 
	- fixed bug with native fullscreen in safari
	
Release 1.2
	- flash fullscreen plugin for modern browsers (thanks to Till Reitemeyer)
	- preload fix for webkit browser (opera will come soon)

Release 1.1.2
	- improvements to the fullscreen plugin (fixed IE7 z-index stacking issues)
	- improvements to the playlist-API 

Release 1.1.1

Changed from 1.1 to 1.1.1:
	- serious issue with a11y-slider
	- playlist rewrite
	- native fullscreen in safari5 
	- fixed opera ended bug
	- Initiializing a media in a display: none !important; area fixed

Changed from 1.0.x to 1.1:

	Features with slightly API Changes (less configuration)
	-----------------------------------------------------
	All Usability - Changes are also API - Changes in most cases
	you won't have to change anything, except if you used the 
	fullwindow-plugin you have to make small tweaks to your CSS.
	
	- fullscreen plugin (usability): changed how we position the
  	  media-controls
	  and media-state element
	- jmeEmbed (usability): setting JW-Player path automatically to
	  the JS-Path
	- jmeEmbed (usability): setting wmode to transparent, if
	  controls are false, the media element is a video element and
	  param-configuration for wmode is undefined.
	- jmeControl (usability): controls are remove if jmeEmbed is
  	  called through jmeControl
	
	Fixes
	-----------------------------------------------------
	- Initializing a media element in a hidden area (display: none)
	  calculates correct dimensions
	- Workaround for Firefox doesn't stop loading on/with
	  misconfigured servers/firewalls
	
	Features
	-----------------------------------------------------
	- playlist Markup-API
	- video-box Markup-API (part of fullwindow plugin)
	- media-label Markup-API
	- fallback Markup-API
	
	- getJMEVisual DOM-API
	- lots of changes to the fullwindow-plugin




