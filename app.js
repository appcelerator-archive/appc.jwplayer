/**
 * NOTE: This file is simply for testing this connector and will not
 * be used or packaged with the actual connector when published.
 */
var Arrow = require('arrow'),
	server = new Arrow();

// lifecycle examples
server.on('starting', function(){
	server.logger.debug('server is starting!');
});

server.on('started', function(){
	server.logger.debug('server started!');
});

// a simple user model
var channel = Arrow.createModel('channel', {
	fields: {
		title: { type: String }
	},
	connector: 'appc.jwplayer',
	metadata: {
		endpoint: 'channels'
	}
});

// add the model since we're creating outside of models directory
server.addModel(channel);

// { channel_key: 'R3yEYct7' }
channel.findAll(function(err, coll) {
	console.log(arguments);
});

channel.findOne('R3yEYct7', function(err, coll) {
	console.log(arguments);
});

// start the server
server.start();
