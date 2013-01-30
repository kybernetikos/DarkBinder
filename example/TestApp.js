function TestApp() {}

TestApp.prototype.initialise = function(app, room) {
	this.app = app;
	this.room = room;
};

TestApp.prototype.userConnecting = function(user, app, socket) {
	return true;
};

TestApp.prototype.onMessage = function(user, app, socket, message) {
	console.log('received message', message, 'from', user, 'app', app.path);
	// republish to everyone
	this.room.emit('message', message);
};

TestApp.prototype.userDisconnecting = function(user, app, socket) {};
TestApp.prototype.onError = function(e) {};

module.exports = TestApp;