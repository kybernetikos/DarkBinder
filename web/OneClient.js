var offlineMode = navigator.id == null || navigator.id.watch == null;

var socket = null;

function socketIOConnect(assertion) {
	if (offlineMode) {
		socket = io.connect('/?assertion='+assertion);
	} else {
		socket = io.connect('https://darkbinder.herokuapp.com/?assertion='+assertion);
	}

	console.log('connect called', socket);

	socket.on('message', function(data) {
		console.log('msg',data);
	});
    
	socket.on('disconnect', function() {
		console.log('disconnected');
	});
}

var currentUser = null;
if (offlineMode) {
	window.onload = socketIOConnect.bind("testassertion");
} else {
	navigator.id.watch({
		loggedInUser: currentUser,
		onlogin: function(assertion) {
			console.log('login');
			socketIOConnect(assertion);
		},
		onlogout: function() {
			if (socket != null) socket.disconnect();
		}
	});
}