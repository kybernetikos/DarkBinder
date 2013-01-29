function AdamIApp() {}

AdamIApp.prototype.initialise = function(app, room) {
	this.app = app;
	this.room = room;
};

AdamIApp.prototype.userConnecting = function(user, app, socket) {
	return true;
};

AdamIApp.prototype.onMessage = function(user, app, socket, message) {
	console.log('received message', message, 'from', user, 'app', app.path);
	// republish to everyone
	this.room.emit('message', message);
};

AdamIApp.prototype.userDisconnecting = function(user, app, socket) {};
AdamIApp.prototype.onError = function(e) {};

module.exports = AdamIApp;