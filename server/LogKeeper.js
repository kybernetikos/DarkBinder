var EventEmitter = require( "events" ).EventEmitter;

function LogKeeper() {
	EventEmitter.call(this);
	this.logMessages = [];
	this.logLimit = 50;
}

LogKeeper.prototype = Object.create(EventEmitter.prototype);

LogKeeper.prototype.log = function() {
	var logMsg = Array.prototype.join.call(arguments, " ");
	this.logMessages.push(logMsg);
	if (this.logMessages.length > this.logLimit) {
		this.logMessages.shift();
	}
	console.log("> "+logMsg);
	this.emit("log", logMsg);
};

module.exports = LogKeeper;