function ExampleHandler() {}

ExampleHandler.prototype.authorise = function(app, query, callback) {
	callback({
		email: "testuser@email.com"
	});
};

ExampleHandler.prototype.onMessage = function(user, app, socket, message) {
	console.log('received message', user.email, app.path, message);
	app.services.broadcast({msg: message, user: user.email});
};

ExampleHandler.prototype.userConnecting = function(user, app, socket) {
	console.log('user',user.email,'connecting');
	socket.emit('message', { message: 'welcome to this server!' });
	app.services.join(socket);
};

ExampleHandler.prototype.userDisconnecting = function(user, app, socket) {
	console.log('user',user,'disconnecting');
};

module.exports = ExampleHandler;