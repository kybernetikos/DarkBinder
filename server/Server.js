var https = require('https');
var express = require('express');
var url = require('url');
var crypto = require('crypto');
var Config = require('./Config.js');

var Server = function(port) {
	this.port = port;
	this.handlerCache = {};
};

Server.prototype.start = function() {
	console.log('Server listening on port '+this.port);
	var app = express.createServer();
	app.listen(this.port);
	app.use(express["static"](__dirname+"/../web"));
	app.get('/admin/', function(req,res) {
		res.sendfile(require.resolve(__dirname+'/../web/admin/index.html'));
	});
	app.get('/', function(req,res) {
		res.sendfile(require.resolve(__dirname+'/../web/index.html'));
	});

	var io = require('socket.io').listen(app);
	io.configure(function () {
		/* Web sockets is not current supported on heroku :-( although they promise
		 * to support it eventually. */
		if ( ! Config.useWebsocket) {
			io.set("transports", ["xhr-polling"]);
			io.set("polling duration", 10);
		}
		io.set("log level", 2);
		io.set('authorization', this.verifyLogin.bind(this, io));
	}.bind(this));
	if (Config.devMode === true) {
		console.log("Running in DevMode, this is not secure and should not be used on a publicly deployed system.");
	}
	io.sockets.on('connection', this.onConnect.bind(this, io));
};

Server.prototype.onConnect = function(io, socket) {
	var app = socket.handshake.app, user = socket.handshake.user;
	this.getHandler(io, app, function(handler) {
		socket.on('message', handler.onMessage.bind(handler, user, app, socket));
		socket.on('disconnect', handler.userDisconnecting.bind(handler, user, app, socket));
		handler.userConnecting(user, app, socket);
	}, function() {
		socket.disconnect();
	});
};

Server.prototype.lookupHandler = function(services, app, callback, failback) {
	var fileName = app.path.replace(/[:\\\/\.]/g, "_");
	try {
		var Handler = require('../handlers/'+fileName+".js");
		var handler = new Handler(services);
		if (Config.adminAppPaths[app.path] === true) {
			handler.setServer(this);
		}
		callback(handler);
	} catch (e) {
		failback(e);
	}
};

Server.prototype.getHandler = function(io, app, callback, failback) {
	if (this.handlerCache[app.path]) {
		callback(this.handlerCache[app.path]);
	} else {
		var services = {
			join: function(room, socket) {
				if (socket === undefined) {
					socket = room;
					room = "";
				}
				socket.join(app.path+":"+room);
			},
			leave: function(room, socket) {
				socket.leave(app.path+":"+room);
			},
			broadcast: function(room, data) {
				if (data === undefined) {
					data = room;
					room = "";
				}
				io.sockets.in(app.path+":"+room).emit('message', data)
			}
		};
		this.lookupHandler(services, app, function(handler) {
			this.handlerCache[app.path] = handler;
			callback(handler);
		}.bind(this), failback);
	}
};

Server.prototype.getApp = function getApp(headers) {
	var appUrl = url.parse(headers.referer, true);
	var app = {
		url: appUrl,
		path: appUrl.protocol + "//" + appUrl.host + appUrl.pathname,
		origin: headers.origin || (appUrl.protocol + "//" + appUrl.host)
	};
	return app;
};

Server.prototype.verifyLogin = function(io, handshakeData, callback) {
	var app = this.getApp(handshakeData.headers);
	handshakeData.app = app;

	this.getHandler(io, app, function(handler) {
		handler.authorise(app, handshakeData.query, function(user, error) {
			if (error != null) {
				callback(error, false);
			} else {
				handshakeData.user = user;
				callback(null, true);
			}
		});
	}, function() {
		callback("No handler found for "+app.path, false);
	});
};

module.exports = Server;