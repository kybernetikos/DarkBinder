var Module = require('./Module.js');
var utils = require('./Utils.js');

function AdminModule(modules) {
	Module.call(this);

	this.adminUsers = {
		'kybernetikos@gmail.com': true,
		'shikaga@gmail.com': true
	};
	this.modules = modules;
}

AdminModule.prototype = Object.create(Module.prototype);

AdminModule.prototype.initialise = function(app, room) {};

AdminModule.prototype.userConnecting = function(user, app, socket) {
	return this.adminUsers[user.email] === true;
};

/*
		{
			appPath: 'http://adami:8081',
			action: 'module.load',
			user: 'kybernetikos',
			repository: 'DarkBinder',
			path: 'example/TestApp.js'
		}
 */
AdminModule.prototype.onMessage = function(user, app, socket, message) {
	if (message.action = 'module.load') {
		var appPath = message.appPath;
		var githubUser = message.user;
		var repository = message.repository;
		var path = message.path;
		var branch = message.branch;

		try {
			utils.scriptFromGitHub(githubUser, repository, path, branch, function(script) {
				this.modules[appPath] = script;
				socket.emit('message', {request: message, result: 'success'})
			}.bind(this));
		} catch (e) {
			socket.emit('message', {request: message, result: 'fail', error: e});
		}
	}
};

AdminModule.prototype.userDisconnecting = function(user, app, socket) {};

AdminModule.prototype.onError = function(e) {};

module.exports = AdminModule;