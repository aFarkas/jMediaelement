package {
	import com.longtailvideo.jwplayer.events.MediaEvent;
	import com.longtailvideo.jwplayer.events.PlayerStateEvent;
	import com.longtailvideo.jwplayer.player.IPlayer;
	import com.longtailvideo.jwplayer.player.PlayerState;
	import com.longtailvideo.jwplayer.plugins.IPlugin;
	import com.longtailvideo.jwplayer.plugins.PluginConfig;
	
	import flash.display.Sprite;
	import flash.events.MouseEvent;
	import flash.text.TextField;
	import flash.text.TextFormat;
	
	public class Player5Plugin extends Sprite implements IPlugin {
		private var api:IPlayer;

		private var textBox:TextField;
		private var infoBox:TextField;
		private var clickButton:Sprite;
		
		/** Let the player know what the name of your plugin is. **/
		public function get id():String { return "player5plugin"; }

		/** Constructor **/
		public function Player5Plugin() {
			
			
			clickButton = new Sprite();
			clickButton.graphics.beginFill(0x338800, 1);
			clickButton.graphics.drawCircle(5, 5, 10);
			clickButton.graphics.endFill();
			clickButton.x = 10;
			clickButton.y = 10;
			clickButton.buttonMode = true;
			addChild(clickButton);
			
			textBox = new TextField();
			textBox.defaultTextFormat = new TextFormat('_sans',14,0x111188,true);
			textBox.x = 5;
			textBox.y = 25
			addChild(textBox);
			
			infoBox = new TextField();
			infoBox.defaultTextFormat = new TextFormat('_sans', 13, 0x003311, true);
			infoBox.x = 5;
			infoBox.y = 45;
			addChild(infoBox);
		}
		
		/**
		 * Called by the player after the plugin has been created.
		 *  
		 * @param player A reference to the player's API
		 * @param config The plugin's configuration parameters.
		 */
		public function initPlugin(player:IPlayer, config:PluginConfig):void {
			api = player;
			
			clickButton.addEventListener(MouseEvent.CLICK, buttonClicked);

			textBox.text = config['text'];
		
			api.addEventListener(MediaEvent.JWPLAYER_MEDIA_TIME, timeHandler);	
			api.addEventListener(PlayerStateEvent.JWPLAYER_PLAYER_STATE, stateHandler);	
			api.addEventListener(MediaEvent.JWPLAYER_MEDIA_COMPLETE, completeHandler);	
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
		public function resize(wid:Number, hei:Number):void {
			this.graphics.beginFill(0x990000, 0.5);
			this.graphics.drawRect(0, 0, wid, hei);
			this.graphics.endFill();
		}

		/**
		 * Mouse click handler 
		 */
		private function buttonClicked(event:MouseEvent):void {
			// Toggle the mute state of the player.
			api.mute = !api.mute;
		}
		
		private function timeHandler(event:MediaEvent):void {
			infoBox.text = Math.round(event.duration - event.position) + " seconds left";
		}
		
		private function stateHandler(event:PlayerStateEvent):void {
			switch (event.newstate) {
				case PlayerState.PAUSED:
					infoBox.text = 'video paused';
					break;
				case PlayerState.PLAYING:
					// nothing here, since now the time is updating.
					break;
				case PlayerState.IDLE:
					infoBox.text = 'video idle';
					break;
				case PlayerState.BUFFERING:
					infoBox.text = 'video buffering';
					break;
			}
		}
		
		private function completeHandler(evt:MediaEvent):void {
			infoBox.text = "video complete";
		}
		
	}
}