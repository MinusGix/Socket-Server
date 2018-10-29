import {AxiomModule} from "../Module";
import * as net from "net"
import {strip} from "./Util";

function isValidNick (text : string) : boolean {
	return true;
}

function isValidPass (text : string) : boolean {
	return true;
}

let ret : AxiomModule = (parent) => {
	// Requires SocketManager
	let Input = parent.getModuleData('Input');
	let SocketManager = parent.getModuleData('SocketManager');

	SocketManager.on("is-socket-ready", (socket : net.Socket, user, decide : Function) => {
		if (user && !!user.loggedIn) {
			decide(true);
		} else {
			decide(false);
		}
	});

	SocketManager.on("set", (socket : net.Socket, data : any) => {
		Input.ask(socket, "nick: ", (err : Error, nick : Buffer) => {
			if (err) {
				console.log('|<Login> nick err:', err);
				socket.destroy();

				return;
			}

			console.log("|<Login> socket chose nick: '" + strip(nick.toString()) + "'");

			data.nick = strip(nick.toString());

			// Rather than immediately after (which we can do with the queue system), it's in the callback because the socket might be destroyed
			Input.ask(socket, "pass: ", (err : Error, pass : Buffer) => {
				if (err) {
					console.log('|<Login> pass err:', err);
					socket.destroy();
	
					return;
				}
	
				console.log("|<Login> socket chose pass: '" + strip(pass.toString()) + "'");

				data.pass = pass;

				data.loggedIn = true;

				SocketManager.emit("logged-in", data);
			});
		});
	});
};

export default ret;