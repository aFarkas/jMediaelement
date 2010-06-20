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




