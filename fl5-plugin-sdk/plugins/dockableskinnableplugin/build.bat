:: This is a simple script that compiles the plugin using the free Flex SDK on Windows.
:: Learn more at http://developer.longtailvideo.com/trac/wiki/PluginsCompiling

SET FLEXPATH="C:\Program Files (x86)\Adobe\Adobe Flash Builder Beta 2\sdks\3.4.1"

echo "Compiling dockable skinnable plugin..."

%FLEXPATH%\bin\mxmlc .\DockableSkinnablePlugin.as -sp .\ -o .\dockableskinnableplugin.swf -library-path+=..\..\lib -load-externs ..\..\lib\jwplayer-5-classes.xml -use-network=false