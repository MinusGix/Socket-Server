import {AxiomModule} from "../Module";
import * as net from "net"
import {strip, sendMessage} from "./Util";


interface CommandRun {
	(args : string[], socket : net.Socket, data) : any;
}

class Command {
	public name : string;

	public _run : CommandRun;

	constructor (name : string, run : CommandRun) {
		this.name = name;

		this._run = run;
	}

	run (args : string[], socket : net.Socket, data) : any {
		return this._run(args, socket, data);
	}

	matches (name : string) : boolean {
		return this.name.toLowerCase() === name.toLowerCase();
	}

	static isCommand (text : string, prefix : string = '/') : boolean {
		return text.startsWith(prefix);
	}
}

let ret : AxiomModule = (parent) => {
	// Requires SocketManager
	let SocketManager = parent.getModuleData('SocketManager');
	let Chat = parent.getModuleData('Chat');

	SocketManager.on("chat-message", (socket : net.Socket, user, data : Buffer, reject : Function) => {
		if (Command.isCommand(data.toString(), ret.prefix)) {
			reject();

			let commandName = data.toString().trim().split(' ')[0].slice(ret.prefix.length);

			for (let i = 0; i < ret.commands.length; i++) {
				if (ret.commands[i].matches(commandName)) {
					ret.commands[i].run(data.toString().split(' '), socket, data);
				}
			}
		}
	});

	let ret = {
		prefix: '/',
		commands: [
			new Command("test", (args, socket, data) => {
				sendMessage(socket, "Testing worked!", true);
			})
		]
	};

	return ret;
};

export default ret;