(function() {
	var query = {};
	window.location.search.replace(/[?&]([^&=]+)(?:=([^&]*))?/g, function(_,key,value) {query[key] = value==undefined?true:value; return ""});

	// var server = "http://localhost:8081";
	var server = "https://darkbinder.herokuapp.com";

	if (query.server) {
		server = query.server;
	}

	var socket = null;

	function connect(assertion) {
		socket = io.connect(server+'/?assertion='+assertion);
		if (window.onConnect) {
			window.onConnect(socket);
		}
	}

	if ( ! navigator.id && console) {
		console.log('Attempting to run without authorisation.');
		connect("dummyassertion");
	} else {
		navigator.id.watch({
			loggedInUser: null,
			onlogin: connect,
			onlogout: function() {
				if (socket != null) socket.disconnect();
			}
		});
	}

})();