var request = require('./Utils.js').request;
var crypto = require('crypto');

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
	},
	authorisor: function(audience, assertion, callback) {
		this.verify(assertion, audience, function(response) {
			if (response.status == 'okay') {
				var md5 = crypto.createHash('md5');
				md5.update(response.email.trim().toLowerCase());
				var user = {
					id: response.email,
					email: response.email,
					hash: md5.digest('hex'),
					issuer: response.issuer,
					loginExpires: response.expires
				};
				callback(user);
			} else {
				console.log(response);
				callback(null, response.reason);
			}
		});
	}
};