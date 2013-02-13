var GitHubApi = require("github");
var github = new GitHubApi({version:"3.0.0"});
var url = require('url');
var vm = require('vm');

module.exports =  {
	request: function request(method, requestUrl, onSuccess, dataToSend, headers) {
		var target = url.parse(requestUrl);
		var options = {
			host: target.host,
			path: target.path,
			method: method,
			headers: {}
		};
		if (dataToSend != null) {
			options.headers['Content-Length'] = dataToSend.length;
		}
		for (var key in headers) {
			options.headers[key] = headers[key];
		}
		var protocolLibrary = require(target.protocol.substring(0, target.protocol.length - 1));
		var request = protocolLibrary.request(options, function(response) {
			var result = '';
			response.on('data', function(chunk) { result += chunk; });
			response.on('end', function () { onSuccess(result, response); });
		});
		if (dataToSend != null) {
			request.write(dataToSend);
		}
		request.end();
	},

	scriptFromGitHub: function(user, repository, path, branch, onSuccess, onFail) {
		console.log("http://"+user+".github.com/"+repository+path+"  : "+branch);
		github.repos.getContent(
			{
				user:user,
				repo:repository,
				path:path,
				ref:branch
			},
			function(err, data) {
				if (err) {
					onFail(err);
				} else {
					var encodedData = data.content;
					var content = new Buffer(encodedData, 'base64').toString();
					var script = vm.createScript(content, user+"/"+repository+"/"+path );
					onSuccess(script);
				}
			}
		);
	}
};

/*
var utils = require('./server/Utils.js');
var sc = utils.scriptFromGitHub("kybernetikos", "UIT", "solar/JulianDay.js", "gh-pages", function(script) {global.script = script;});
*/