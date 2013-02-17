var EventEmitter = require( "events" ).EventEmitter;

function LogKeeper() {
	EventEmitter.call(this);
	this.logMessages = [];
	this.logLimit = 50;
}

LogKeeper.prototype = Object.create(EventEmitter.prototype);

LogKeeper.prototype.log = function(app) {
	var args = Array.prototype.slice.call(arguments, 1);
	for (var i = 0; i < args.length; ++i) {
		var arg = args[i];
		if (typeof arg === 'object' && arg.toString === Object.prototype.toString) {
			arg = JSON.stringify(arg);
		}
	}
	var logMsg = args.join(" ");
	this.logMessages.push({app: app, message: logMsg});
	if (this.logMessages.length > this.logLimit) {
		this.logMessages.shift();
	}
	console.log(app.path, logMsg);
	this.emit("log", app, logMsg);
};

module.exports = LogKeeper;