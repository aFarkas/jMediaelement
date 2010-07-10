package 
{
	
	/** This is an example of a plugin that makes use of the dock and will take advantage
	 * of the currently loaded skin in determining it's appearance.
	 * 
	 * For this example we are making use of the Beelden skin which is included with the
	 * SDK. 
	 * 
	 * To take advantage of a skin, the skin must have the correct XML block 
	 * in the components section of its associated XML document.
	 * In the case of this skin, the XML would look like the following:
	 * 
	 * <component name="dockableskinnableplugin">
	 * 		<elements>
	 * 			<element name="dockIcon" src="skinicon.png"/>
	 * 		</elements>
	 * 	</component> 
	 * 
	 * In addition, in the skin directory you will need a folder named after your plugin
	 * which contains the image assets you wish to use.  You can find an example in the
	 * sdk5/skins/beelden/ directory.
	 * 
	 * For more information, please refer to the LongTail Video skinning guid at
	 * http://developer.longtailvideo.com/trac/wiki/Player5Skinning
	 * 
	 **/
	
	import com.longtailvideo.jwplayer.player.IPlayer;
	import com.longtailvideo.jwplayer.plugins.IPlugin;
	import com.longtailvideo.jwplayer.plugins.PluginConfig;
	import com.longtailvideo.jwplayer.view.components.DockButton;
	
	import flash.display.DisplayObject;
	import flash.display.Sprite;
	import flash.events.MouseEvent;	
	
	public class DockableSkinnablePlugin extends Sprite implements IPlugin
	{
		[Embed(source="icon.png")]
		private const Icon:Class;
		
		/** Reference to embed icon **/
		private var skinIcon:DisplayObject;
		/** Remenber if dock button is active or not. **/
		private var showing:Boolean;
		/** Reference to the dock button **/
		private var dockButton:DockButton;
		
		/** Let the player know what the name of your plugin is. **/
		public function get id():String { return "dockableskinnableplugin"; }
		
		/** Constructor **/
		public function sharing():void
		{
			showing = false;
		}
		
		/**
		 * Called by the player after the plugin has been created.
		 *  
		 * @param player A reference to the player's API
		 * @param config The plugin's configuration parameters.
		 */
		public function initPlugin(player:IPlayer, config:PluginConfig):void 
		{
			skinIcon = player.skin.getSkinElement("dockableskinnableplugin", "dockIcon");
			if (skinIcon == null) 
			{
				skinIcon = new Icon();
			}
			dockButton = player.controls.dock.addButton(skinIcon, "off", dockHandler) as DockButton;
		}
		
		/**
		 * When the player resizes itself, it sets the x/y coordinates of all components and plugins.  
		 * Then it calls resize() on each plugin, which is then expected to lay itself out within 
		 * the requested boundaries.  Plugins whose position and size are not set by flashvar configuration
		 * receive the video display area's dimensions in resize().
		 *  
		 * @param width Width of the plugin's layout area, in pixels 
		 * @param height Height of the plugin's layout area, in pixels
		 */		
		public function resize(wid:Number, hei:Number):void 
		{
		}
		
		/** Dock icon is clicked; toggle on/off. **/
		private function dockHandler(evt:MouseEvent):void 
		{
			if (showing) 
			{
				dockButton.text = "off";
			} else 
			{
				dockButton.text = "on";
			}
			showing = !showing;
		}
	}	
	
}