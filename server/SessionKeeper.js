var EventEmitter = require( "events" ).EventEmitter;

function Session(app, user, socket) {
	this.app = app;
	this.user = user;
	this.socket = socket;
}

Session.prototype.toString = function() {
	return "<Session "+this.app.path+" "+this.user.email+" "+this.socket.id+">";
}

function SessionKeeper() {
	EventEmitter.call(this);
	this.byUser = {};
	this.byApp = {};
}

SessionKeeper.prototype = Object.create(EventEmitter.prototype);

SessionKeeper.prototype.add = function(app, user, socket) {
	var session = new Session(app, user, socket);
	var userSessions = (this.byUser[user.email] = this.byUser[user.email] || {});
	userSessions[socket.id] = session;
	var appSessions = (this.byApp[app.path] = this.byApp[user.path] || {});
	appSessions[socket.id] = session;
	this.emit("added", session);
};

SessionKeeper.prototype.remove = function(app, user, socket) {
	var userSessions = this.byUser[user.email] || {};
	var appSessions = this.byApp[user.path] || {};
	var session = userSessions[socket.id] || appSessions[socket.id];
	delete userSessions[socket.id];
	delete appSessions[socket.id];
	if (session) {
		this.emit("removed", session);
	}
};

module.exports = SessionKeeper;