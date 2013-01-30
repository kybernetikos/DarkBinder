module.exports = {
	useAuth: (process.env.USE_AUTH !== undefined ? Boolean(process.env.USE_AUTH) : false),
	useWebsocket: (process.env.USE_WEBSOCKET !== undefined ? Boolean(process.env.USE_WEBSOCKET) : true)
};