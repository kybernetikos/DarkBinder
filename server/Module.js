function Module() {}
Module.prototype = {
	initialise: function(app, room, allClients) {},
	userConnecting: function(user, app, socket) {
		return true;
	},
	onMessage: function(user, app, socket, message) {},
	userDisconnecting: function(user, app, socket) {},

	onError: function(e) {}
};

module.exports = Module;