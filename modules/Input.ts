import {AxiomModule} from "../Module";
import * as net from "net"
import { resolve } from "path";

interface InputSettings {
	awaiting: InputQueueItem;
	queue: InputQueueItem[];
}

interface InputQueueItem {
	socket: net.Socket;
	text: string;
	callback: CallbackFunction;
	done: boolean;
}

interface CallbackFunction {
	(err : Error, data : Buffer) : any;
}

let ret : AxiomModule = (parent) => {
	// Requires SocketManager
	let SocketManager = parent.getModuleData('SocketManager');

	SocketManager.on("set", (socket : net.Socket, data : any) => {
		console.log("|<Input> Got socket, adding _input property");

		data._input = <InputSettings> {
			awaiting: null,
			queue: []
		};
	});

	const ret = {
		// Only goes to next in queue if current is done
		gotoNextInQueue (_input : InputSettings) : boolean {
			if (_input.awaiting === null || (typeof(_input.awaiting) === 'object' && _input.awaiting.done)) {
				return ret._gotoNextInQueue(_input);
			}

			return false;
		},

		_gotoNextInQueue (_input : InputSettings) : boolean {
			if (_input.queue.length === 0) {
				_input.awaiting = null;

				return false;
			}

			_input.awaiting = _input.queue.shift();
			ret._ask(_input.awaiting);

			return true;
		},

		_ask (item : InputQueueItem) {
			let user = SocketManager.get(item.socket);

			item.socket.write(item.text)

			item.socket.once('data', (data) => {
				item.callback(null, data);
				
				item.done = true;
				ret.gotoNextInQueue(user._input);
			});
		},

		ask (socket : net.Socket, text : string, callback : CallbackFunction) {
			let user = SocketManager.get(socket);

			if (typeof(user._input) === 'object') {
				user._input.queue.push({
					socket: socket, 
					text: text, 
					callback: callback, 
					done: false
				});

				ret.gotoNextInQueue(user._input);
			} else {
				callback(new Error("user does not have _input property"), null);
			}
		},

		askPromise (socket : net.Socket, text : string) {
			return new Promise((resolve, reject) => {
				ret.ask(socket, text, (err, data) => {
					if (err) {
						return reject(err);
					}

					resolve(data);
				});
			});
		}
	};

	return ret;
};

export default ret;