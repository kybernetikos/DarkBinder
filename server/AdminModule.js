var Module = require('./Module.js');
var utils = require('./Utils.js');

function AdminModule(server) {
	Module.call(this);

	this.adminUsers = {
		'kybernetikos@gmail.com': true,
		'shikaga@gmail.com': true
	};
	this.modules = server.modules;
}

AdminModule.prototype = Object.create(Module.prototype);

AdminModule.prototype.initialise = function(app, room) {
	console.log('init');
	this.app = app;
	this.room = room;
};

AdminModule.prototype.userConnecting = function(user, app, socket) {
	socket.emit('message', {
		currentModules: Object.keys(this.modules)
	});
	return this.adminUsers[user.email] === true;
};

/*
	An example message that configures the handler for the main page.
		{
			appPath: 'http://localhost:8081/test.html',
			action: 'module.load',
			user: 'kybernetikos',
			repository: 'DarkBinder',
			path: 'example/TestApp.js',
			branch: 'gh-pages'
		}
 */
AdminModule.prototype.onMessage = function(user, app, socket, message) {
	var appPath = message.appPath;
	if (message.action == 'module.load.github') {
		var githubUser = message.user;
		var repository = message.repository;
		var path = message.path;
		var branch = message.branch;

		try {
			utils.scriptFromGitHub(githubUser, repository, path, branch, function(script) {
				this.modules[appPath] = script;
				socket.emit('message', {result: 'success', request: message});
				this.room.emit('message', message);
			}.bind(this));
		} catch (e) {
			socket.emit('message', {result: 'fail', error: e, request: message});
		}
	} else if (message.action == 'module.load.require') {
		var filePath = '../example/'+message.path;
		console.log('trying to load', filePath);
		try {
			var handler = require(filePath);
			console.log('lloaded ', handler);
			this.modules[appPath] = handler;
			socket.emit('message', {result: 'success', request: message});
			this.room.emit('message', message);
		} catch (e) {
			console.log(e);
			socket.emit('message', {result: 'fail', error: e, request: message});
		}
	}
};

AdminModule.prototype.userDisconnecting = function(user, app, socket) {};

AdminModule.prototype.onError = function(e) {};

module.exports = AdminModule;