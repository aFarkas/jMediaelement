var settings = {
	/** Player versions to embed in the testpage. **/
	players: {
		'5.0':'players/5.0.swf'
	},
	/** Available plugins (xml contains all info for flashvars). **/
	plugins: {
		player5plugin: {
			swf:'plugins/player5plugin/player5plugin.swf',
			xml:'plugins/player5plugin/player5plugin.xml'
		},
		dockableskinnableplugin: {
			swf:'plugins/dockableskinnableplugin/dockableskinnableplugin.swf',
			xml:'plugins/dockableskinnableplugin/dockableskinnableplugin.xml'
		},
		jmefs: {
			swf:'plugins/jmefs/jmefs.swf',
			xml:'plugins/jmefs/jmefs.xml'
		}
	},
	/** Skins to embed in the testpage. **/
	skins: {
		none:'',
		beelden:'skins/beelden/beelden.xml',
		bright:'skins/bright.swf',
		overlay:'skins/overlay.swf',
		simple:'skins/simple.swf',
		stylish:'skins/stylish.swf',
		swift:'skins/swift.swf',
		thin:'skins/thin.swf'
	},
	/** All the setup examples with their flashvars. **/
	examples: {
		'== select an example ==': {},
		'': {},
		'FLV video': {
			file:'../files/bunny.flv',
			image:'files/bunny.jpg',
			height:240,
			width:400
		},
		'MP3 audio': {
			file:'files/bunny.mp3',
			height:20,
			width:400
		},
		'JPG image': {
			file:'files/bunny.jpg',
			height:240,
			width:400
		},
		'RSS playlist': {
			file:'files/bunnies.xml',
			height:240,
			width:800,
			playlist:'right',
			playlistsize:400
		},
		' ': {
		},
		'Using a Player 5 Plugin': {
			file:'../files/bunny.flv',
			image:'files/bunny.jpg',
			plugins:'player5plugin',
			'player5plugin.position':'left',
			'player5plugin.size':200,
			'player5plugin.text':'Hello, world!',
			height:240,
			width:600
		},
		'Using a Dockable Skinnable Plugin': {
			file:'../files/bunny.flv',
			image:'files/bunny.jpg',
			plugins:'dockableskinnableplugin',
			'dockableskinnableplugin.text':'Hello World',
			height:240,
			width:400
		}
	}
}