var devMode = (process.env.DEVMODE !== undefined ? Boolean(process.env.DEVMODE) : false);

module.exports = {
	useWebsocket: (process.env.USE_WEBSOCKET !== undefined ? Boolean(process.env.USE_WEBSOCKET) : true),
	adminAppPaths: devMode ? {
		"http://localhost:8081/admin/": true
	} : {
		"http://darkbinder.herokuapp.com/admin/": true
	},
	devMode: devMode
};