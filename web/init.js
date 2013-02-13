(function() {

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