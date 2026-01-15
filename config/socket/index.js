const socketIo = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { CLIENT_1, CLIENT_2 } = require("../redis/index");
class SocketWeb {
	constructor(server) {
		this.io = socketIo(server, {
			cors: {
				origin: "*",
				methods: ["GET", "POST"],
				credentials: true,
			},
			transport: ["websocket"],
		});
		this.io.adapter(createAdapter(CLIENT_1, CLIENT_2));
		//prettier-ignore
		this.io.on("connect", (socket) => { // eslint-disable-line
			console.log("Web Socket connected to the server!");
		});
	}

	async emitMessage(jenis, data) {
		try {
			await this.io.emit(jenis, data);
			console.log("Message emitted:", data);
		} catch (error) {
			console.error("Error emitting message:", error);
		}
	}

	async emitManyMessage(dataArray) {
		try {
			const promises = dataArray.map(({ jenis, data }) => this.emitMessage(jenis, data));
			await Promise.all(promises);
		} catch (error) {
			console.error("Error emitting message:", error);
			throw error;
		}
	}
}

// Singleton pattern
let instance = null;

function getSocketWebInstance(server) {
	if (!instance) {
		instance = new SocketWeb(server);
	}
	return instance;
}

module.exports = getSocketWebInstance;
