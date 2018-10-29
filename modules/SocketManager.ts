import {AxiomModule} from "../Module";
import * as net from "net";
import * as EventEmitter from "events";
import Axiom from "../Server.js";

interface ExtendedMapFilterFunc<T> {
	(value : Object, key : T, map : ExtendedMap<T>) : [net.Socket,Object][];
}

class ExtendedMap<T> extends Map {
	constructor () {
		super();
	}

	filter (func : ExtendedMapFilterFunc<T>) {
		const entries = this.entries();

		let entry = entries.next();

		let ret : [net.Socket,Object][] = [];

		while (!entry.done) {
			if (func(entry.value[1], entry.value[0], this)) {
				ret.push(entry.value);
			}
		}

		return ret;
	}
}

class SocketManagerEmitter extends EventEmitter {
	public Sockets : ExtendedMap<net.Socket>;

	constructor (parent : Axiom) {
		super();

		this.Sockets = new ExtendedMap<net.Socket>();

		this.constructAxiomListeners(parent);
	}

	set (key : net.Socket, data : Object) {
		this.Sockets.set(key, data);
		this.emit("set", key, data);
	}

	get (key : net.Socket) {
		return this.Sockets.get(key);
	}

	has (key: net.Socket) : boolean {
		return this.Sockets.has(key);
	}

	delete (key : net.Socket) {
		let val = this.get(key);

		this.Sockets.delete(key);

		this.emit("delete", key, val);
	}

	filter (func : ExtendedMapFilterFunc<net.Socket>) {
		return this.Sockets.filter(func);
	}

	constructAxiomListeners (axiom : Axiom) {
		axiom.on("server-connection", (socket : net.Socket) => {
			// Already have that socket
			if (this.has(socket)) {
				console.log('|<SocketManager> Socket was already connected, but joined again. Killing socket.');
				socket.destroy();

				return;
			}
	
			console.log("|<SocketManager> Added Socket");
			this.set(socket, { socket: socket });
		});
	
		axiom.on("socket-close", (socket : net.Socket) => {
			// If it's not in our list, then ignore it
			if (this.has(socket)) {
				console.log('|<SocketManager> Socket removed');
				this.delete(socket);
			}
		});
	}
}

let ret : AxiomModule = (parent) => {
	console.log('|<SocketManager> Starting up');

	return new SocketManagerEmitter(parent);
};

export default ret;