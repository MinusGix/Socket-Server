import {AxiomModule} from "../Module";
import * as net from "net"
import { Socket } from "dgram";

interface ChatData {
	options: {
		logChat: boolean;
		prefix: string;
	},

	commands: Command[]
}

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

function strip (text : string) : string {
	return text.trimRight();
}

// TODO: make the Login module set this and getNick, if there's a chat module, rather than making Chat depend on Login
function userCanChat (user) : boolean {
	return !!user.loggedIn;
}

function userCanSeeChat (user) : boolean {
	return !!user.loggedIn;
}

function getNick (user) : string {
	return (<string>user.nick);
}

function sendMessage (socket : net.Socket, text : string, includeNewline : boolean = false) {
	if (includeNewline) {
		text += '\n';
	}

	socket.write(text);
}

let ret : AxiomModule = (parent) => {
	// Requires SocketManager
	let SocketManager = parent.getModuleData('SocketManager');

	const ret : ChatData = {
		options: {
			logChat: true,
			prefix: '/',
		},

		commands: [
			new Command("test", (args, socket, data) => {
				sendMessage(socket, "Testing worked!", true);
			})
		]
	};

	function broadcast (text : string, except : net.Socket[] = []) {
		if (ret.options.logChat) {
			console.log('|<Chat> ' + strip(text));
		}

		SocketManager.Sockets.forEach((data, socket : net.Socket) => {
			if (userCanSeeChat(SocketManager.get(socket))) {
				if (!except.includes(socket)) {
					sendMessage(socket, text);
				}
			}
		});	
	}

	parent.on("socket-data", (socket : net.Socket, data : Buffer) => {
		let user = SocketManager.get(socket);

		if (user) {
			if (userCanChat(user)) {
				if (Command.isCommand(data.toString(), ret.options.prefix)) {
					// Splits it by spaces, then grabs the first item (command) and removes the prefix
					let commandName = data.toString().trim().split(' ')[0].slice(ret.options.prefix.length);
					for (let i = 0; i < ret.commands.length; i++) {
						if (ret.commands[i].matches(commandName)) {
							ret.commands[i].run(data.toString().split(' '), socket, user);

							break;
						}
					}
				} else {
					broadcast(getNick(user) + ': ' + data.toString());
				}
			}
		}
	});

	SocketManager.on("logged-in", (data) => {
		broadcast(getNick(data) + " joined\n", [data.socket]);
	});

	SocketManager.on("delete", (socket : net.Socket, data) => {
		if (userCanChat(data)) {
			broadcast(getNick(data) + " left\n", [data.socket]);
		}
	});

	return ret;
};

export default ret;