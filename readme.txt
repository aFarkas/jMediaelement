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
Use the as a starting point
3. utils
uitils like an mouseactivity event (for UI behavior) or the
quick-starter utility 'jmeEmbedControls'.
4. plugins
API-Plugins like fullwindow/fullscreen, captions...

II. Getting started
ToDo

III. License
The jme-JavaScript is licensed under MIT & GPL Version 2. The 
player.swf is JW Player form http://www.longtailvideo.com, 
wich is Open Source for non-commercial use. For more information go
to http://www.longtailvideo.com.

III. Release notes

Release 1.1
Changed from 1.0.x to 1.1:

	Features with slightly API Changes (less configuration)
	-----------------------------------------------------
	All Usability - Cahnges are also API - Changes in most cases
	You on't have to change anything, except if you use the 
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
	  misconfigured Servers/Firewalls
	
	Features
	-----------------------------------------------------
	- playlist Markup-API
	- video-box Markup-API (part of fullwindow plugin)
	- media-label Markup-API
	- fallback Markup-API
	
	- getJMEVisual DOM-API
	- lots of changes to the fullwindow-plugin




