var socket = null;

function socketIOConnect(assertion) {
	socket = io.connect('https://darkbinder.herokuapp.com/?assertion='+assertion);
	console.log('connected called', socket);

	socket.on('message', function(data) {
		console.log('msg',data);
	});
}

var currentUser = null;
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