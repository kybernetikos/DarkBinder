var https = require('https');
var express = require('express');
var url = require('url');
var Config = require('./Config.js');
var SessionKeeper = require('./SessionKeeper.js');
var Utils = require('./Utils.js');
var fs = require('fs');
var LogKeeper = require('./LogKeeper.js');

var Server = function(port) {
	this.port = port;
	this.handlerCache = {};
	this.sessionKeeper = new SessionKeeper();
	this.logKeeper = new LogKeeper();
	this.gitHubUsers = {};
	this.githubHandlerCache = {};
	for (var i = 0; i < Config.gitHubUsers.length; ++i) {
		this.gitHubUsers[Config.gitHubUsers[i]] = true;
	}
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
	this.io = io;
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
	io.sockets.on('connection', this.onConnect.bind(this));
};

Server.prototype.onConnect = function(socket) {
	var app = socket.handshake.app, user = socket.handshake.user;
	this.getHandler(app, function(handler) {
		socket.on('message', handler.onMessage.bind(handler, user, app, socket));
		socket.on('disconnect', function() {
			this.sessionKeeper.remove(app, user, socket);
			handler.userDisconnecting(user, app, socket);
		}.bind(this));
		this.sessionKeeper.add(app, user, socket);
		handler.userConnecting(user, app, socket);
	}.bind(this), function() {
		socket.disconnect();
	});
};

Server.prototype.requireHandlerFinder = function(app, notfound, callback, failback) {
	var fileName = __dirname+'/../handlers/'+app.path.replace(/[:\\\/\.]/g, "_")+".js";
	fs.stat(fileName, function (err, stats) {
		if ( ! err && stats.isFile() ) {
			try {
				var Handler = require(fileName);
				var handler = Handler.getHandler(app);
				this.logKeeper.log(app, "Loaded handler from file", fileName);
				callback(handler);
			} catch (e) {
				this.logKeeper.log(app, "Failed to instantiate handler from file.", e.stack.toString());
				failback(e);
			}
		} else {
			notfound();
		}
	}.bind(this));
};

Server.prototype.githubHandlerFinder = function(app, notfound, callback, failback) {
	// TODO: finish this
	var hostParts = app.url.hostname.split(".");
	var pathParts = app.url.path.split("/");
	var githubUser = hostParts[0];
	if (this.gitHubUsers[githubUser] !== true || app.url.hostname != githubUser+".github.com") {
		notfound();
	} else {
		var githubRepository = pathParts[1];
		var cachedHandlerCreator = this.githubHandlerCache[githubUser+":"+githubRepository];
		if (cachedHandlerCreator) {
			var handler = cachedHandlerCreator.getHandler(app);
			callback(handler);
			return;
		}
		Utils.scriptFromGitHub(githubUser, githubRepository, "darkbinder/Handler.js", "gh-pages", function(script) {
			var mod = {exports: {}}
			try {
				script.runInNewContext({
						'module': mod,
						'console': console,
						'require': function(requirement) {
							if (requirement == 'PersonaVerify') { return require('./PersonaVerify.js')};
							if (requirement.indexOf('.') >= 0) throw new Error("Not allowed to require "+requirement);
							return require(requirement);
						}
				});
				this.githubHandlerCache[githubUser+":"+githubRepository] = mod.exports;
				var handler = mod.exports.getHandler(app);
				this.logKeeper.log(app, "Loaded handler from github.");
				callback(handler);
			} catch (e) {
				this.logKeeper.log(app, "Failed to instantiate handler from github.", e.stack.toString());
				failback(e);
			}
		}.bind(this), function(e) {
			this.logKeeper.log(app, "Failed to instantiate handler from github.", e.stack.toString());
			failback(e);
		});
	}
};

Server.prototype.lookupHandler = function(app, callback, failback) {
	var finders = [
			this.requireHandlerFinder.bind(this),
			this.githubHandlerFinder.bind(this)
	];
	var i = 0;
	function notFound() {
		i = i+1;
		if (i < finders.length) {
			var finder = finders[i];
			finder(app, notFound, callback, failback);
		} else {
			failback("Unable to find a handler for app "+app.path);
		}
	}
	finders[0](app, notFound, callback, failback);
};

Server.prototype.getHandler = function(app, callback, failback) {
	if (this.handlerCache[app.path]) {
		callback(this.handlerCache[app.path]);
	} else {
		this.logKeeper.log(app, "First client requested handler, locating.");
		this.lookupHandler(app, function(handler) {
			this.handlerCache[app.path] = handler;
			if (Config.adminAppPaths[app.path] === true) {
				this.logKeeper.log(app, "Handler has admin capabilities.");
				handler.setServer(this);
			}
			callback(handler);
		}.bind(this), failback);
	}
};

Server.prototype.getApp = function getApp(io, headers) {
	if (headers.referer == null) return null;
	var appUrl = url.parse(headers.referer, true);
	var appPath = appUrl.protocol + "//" + appUrl.host + appUrl.pathname;
	var app = {
		url: appUrl,
		path: appPath,
		origin: headers.origin || (appUrl.protocol + "//" + appUrl.host),
		services: {
			join: function(room, socket) {
				if (socket === undefined) {
					socket = room;
					room = "";
				}
				socket.join(appPath+":"+room);
			},
			leave: function(room, socket) {
				socket.leave(appPath+":"+room);
			},
			broadcast: function(room, data) {
				if (data === undefined) {
					data = room;
					room = "";
				}
				io.sockets.in(appPath+":"+room).emit('message', data)
			}
		}
	};
	app.services.log = this.logKeeper.log.bind(this.logKeeper, app);
	return app;
};

Server.prototype.verifyLogin = function(io, handshakeData, callback) {
	var app = this.getApp(io, handshakeData.headers);
	if (app == null) {
		callback("Unable to get the app.", false);
		return;
	}
	handshakeData.app = app;

	this.getHandler(app, function(handler) {
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