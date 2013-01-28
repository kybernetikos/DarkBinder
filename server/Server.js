var https = require('https');
var express = require('express');
var url = require('url');
var persona = require("./PersonaVerify.js");
var vm = require('vm');
var Module = require('./Module.js');
var AdminModule = require('./AdminModule.js');

var Server = function(port) {
	this.port = port;	this.modules = {};

	this.initialiseModules();
};

Server.prototype.initialiseModules = function() {
	this.modules['http://kybernetikos.github.com/DarkBinder/admin.html'] = new AdminModule(this.modules);
	this.modules['http://localhost:8081/admin.html'] = this.modules['http://kybernetikos.github.com/DarkBinder/admin.html'];
};

Server.prototype.start = function() {
	console.log('Server listening on port '+this.port);
	var app = express.createServer();
	app.listen(this.port);
	app.use(express["static"](__dirname+"/../web"));

	var io = require('socket.io').listen(app);
	io.configure(function () {
		/* Web sockets is not current supported on heroku :-( although they promise
		 * to support it eventually. */
		//io.set("transports", ["xhr-polling"]);
		//io.set("polling duration", 10);
		io.set("log level", 2);
		io.set('authorization', function (handshakeData, callback) {
			this.verifyLogin(handshakeData, callback);
		}.bind(this));
	}.bind(this));
	io.sockets.on('connection', this.onConnect.bind(this, io));
};

Server.prototype.onConnect = function(io, socket) {
	var app = socket.handshake.app, user = socket.handshake.user;
	var appPath = app.path;
	var handler = this.getHandler(appPath, io);
	if (handler != null && handler.userConnecting(user, app, socket)) {
		console.log('registering for message');
		socket.on('message', handler.onMessage.bind(handler, user, app, socket));
		socket.join(appPath);
		console.log('handler', handler != null);
		socket.on('disconnect', function() {
			console.log('user',user,'disconnecting');
			handler.userDisconnecting.bind(handler, user, app, socket)();
		});
		socket.emit('welcome', { message: 'welcome to this server!' });
	} else {
		console.log('no handler for '+app.path);
		socket.disconnect();
	}
};

Server.prototype.getHandler = function(appPath, io) {
	var serverHandler = this.modules[appPath];
	if (serverHandler instanceof vm.Script) {
		var mod = {exports: {}};
		var ctx = vm.createContext({
			module: mod,
			exports: mod.exports,
			Module: Module,
			console: console
		});
		serverHandler.runInContext(ctx);

		serverHandler = mod.exports;
		if (typeof serverHandler == 'function') {
			serverHandler = new serverHandler();
		}
		this.modules[appPath] = serverHandler;
		serverHandler.initialise(appPath, io.sockets.in(appPath));
	}
	return serverHandler;
};

Server.prototype.verifyLogin = function(handshakeData, callback) {
	var appUrl = url.parse(handshakeData.headers.referer, true);
	var app = {
		url: appUrl,
		path: appUrl.protocol+"//"+appUrl.host+appUrl.pathname,
		origin: handshakeData.headers.origin || (appUrl.protocol+"//"+appUrl.host)
	};
	handshakeData.app = app;
	var assertion = handshakeData.query.assertion;
	if (assertion == 'testassertion') {
		handshakeData.user = {email: 'kybernetikos@gmail.com'};
		callback(null, true);
	} else {
		console.log('verifying assertion', app.origin, assertion);
		persona.verify(assertion, app.origin, function(response) {
			if (response.status == 'okay') {
				handshakeData.user = {
					email: response.email,
					issuer: response.issuer,
					loginExpires: response.expires
				};
				callback(null, true);
			} else {
				console.log(response);
				callback(response.reason, false);
			}
		});
	}
};

module.exports = Server;