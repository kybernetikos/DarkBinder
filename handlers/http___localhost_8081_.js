var persona = require("./../server/PersonaVerify.js");
var Config = require("../server/Config.js");

function ExampleHandler() {}

ExampleHandler.prototype.authorise = function(app, query, callback) {
	if (Config.devMode === true) {
		callback({
			email: "kybernetikos@gmail.com"
		});
	} else {
		persona.authorisor(app.origin, query.assertion, function(user, error) {
			if (error) {
				callback(null, error);
			} else if (user.email === 'kybernetikos@gmail.com') {
				callback(user);
			} else {
				callback(null, "not permitted");
			}
		});
	}
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