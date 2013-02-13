var persona = require("../server/PersonaVerify.js");
var Config = require("../server/Config.js");

function AdminHandler(services) {
	this.services = services;
	this.server = null;
}

AdminHandler.prototype.setServer = function(server) {
	this.server = server;
	console.log('server set');
};

AdminHandler.prototype.authorise = function(app, query, callback) {
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

AdminHandler.prototype.onMessage = function(user, app, socket, message) {
	console.log('received message', user.email, app.path, message);
	this.services.broadcast({msg: message, user: user.email});
};

AdminHandler.prototype.userConnecting = function(user, app, socket) {
	console.log('user',user.email,'connecting');
	socket.emit('message', { message: 'welcome to this server!' });
	this.services.join(socket);
};

AdminHandler.prototype.userDisconnecting = function(user, app, socket) {
	console.log('user',user,'disconnecting');
};

module.exports = AdminHandler;