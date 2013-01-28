var Server = require('./server/Server.js');

var server = new Server(process.env.C9_PORT || process.env.PORT || 8081);
server.start();