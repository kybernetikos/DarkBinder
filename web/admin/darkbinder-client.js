// Must be loaded after SocketIO and potentially after persona.

var DarkBinder = {
	initialise:	function initialise(onConnect, onLogin, onLogout) {
		var io = window.io;
		var socket = null;

		var query = {};
		window.location.search.replace(/[?&]([^&=]+)(?:=([^&]*))?/g, function(_,key,value) {query[key] = value==undefined?true:value; return ""});
		var server = query.server || "https://darkbinder.herokuapp.com";

		function connect(assertion) {
			socket = io.connect(server+'/?assertion='+assertion);
			onConnect(socket);
		}

		if ( ! navigator.id) {
			if (console) {
				console.log('Attempting to run without authorisation.');
			}
			connect("dummyassertion");
		} else {
			navigator.id.watch({
				onlogin: function(assertion) {
					if (onLogin) onLogin();
					connect(assertion);
				},
				onlogout: function() {
					if (socket != null) socket.disconnect();
					if (onLogout) onLogout();
				}
			});
		}
	}
};