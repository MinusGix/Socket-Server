import {AxiomModule} from "../Module";
import * as net from "net"
import {strip, sendMessage} from "./Util";

interface ChatData {
	options: {
		logChat: boolean;
		prefix: string;
	}
}

function getNick (user) : string {
	return (<string>user.nick);
}

let ret : AxiomModule = (parent) => {
	// Requires SocketManager
	let SocketManager = parent.getModuleData('SocketManager');

	const ret : ChatData = {
		options: {
			logChat: true,
			prefix: '/',
		},
	};

	parent.on("socket-data", (socket : net.Socket, data : Buffer) => {
		let user = SocketManager.get(socket);

		if (user) {
			if (SocketManager.socketReady(socket)) {
				let rejected = false;
				
				// The function lets Chat know that it will be handling the message itself, and not to display it
				SocketManager.emit("chat-message", socket, user, data, () => rejected = true);

				if (!rejected) {
					SocketManager.broadcast(getNick(user) + ': ' + data.toString());
				}
			}
		}
	});

	SocketManager.on("logged-in", (data) => {
		SocketManager.broadcast(getNick(data) + " joined\n", [data.socket]);
	});

	SocketManager.on("delete", (socket : net.Socket, data) => {
		if (SocketManager.socketReady(socket)) {
			SocketManager.broadcast(getNick(data) + " left\n", [data.socket]);
		}
	});

	return ret;
};

export default ret;