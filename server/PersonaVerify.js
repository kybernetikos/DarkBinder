var request = require('./Utils.js').request;

module.exports = {
	verify: function(assertion, audience, callback) {
		request('POST', 'https://verifier.login.persona.org/verify', function(result, response) {
			callback(JSON.parse(result));
		}, JSON.stringify({
			assertion: assertion,
			audience: audience
		}), {
			"Content-Type": "application/json"
		});
	}
};