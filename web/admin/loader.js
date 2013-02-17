/*
just do this if you aren't concerned about running against a development
server
	<script src="https://darkbinder.herokuapp.com/socket.io/socket.io.js"></script>
	<script src="https://login.persona.org/include.js"></script>
	<script src="init.js"></script>
*/

// to run against your local server, add ?server=http://localhost:8081
// to not load the persona code, add &noauth=true
var query = {};
window.location.search.replace(/[?&]([^&=]+)(?:=([^&]*))?/g, function(_,key,value) {query[key] = value==undefined?true:value; return ""});
var server = query.server || "https://darkbinder.herokuapp.com";

var srcs = [
	server+'/socket.io/socket.io.js'
];

if (query.noauth != 'true') {
	srcs.push("https://login.persona.org/include.js");
}

srcs.push('darkbinder-client.js');

for (var i = 0; i < srcs.length; ++i) {
	document.write('<scr'+'ipt src="'+srcs[i]+'"></scr'+'ipt>');
}