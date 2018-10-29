import {AxiomModule} from "../Module";
import * as net from "net";
import {inspect} from "util";

let ret : AxiomModule = (parent) => {
	const opts = {
		log: true,
		prefix: '|<Log>',
		suffix: '',
		trim: true,
	};

	const log = (...args) => {
		if (opts.log) {
			let text = args.map(arg => inspect(arg).slice(1, -1).replace(/\'/g, "'").replace(/\"/g, '"')).join(' ')

			console.log(opts.prefix, text, opts.suffix);
		}
	}

	log("Logging code setting up");

	// Server Logging
	parent.on("server-close", () => {
		log("Server has closed");
	});

	parent.on("server-connection", () => {
		log("Socket has Connected");
	});

	parent.on("server-error", (err) => {
		log("Server has an error:", err);
	});

	parent.on("server-listening", () => {
		log("Server Listening");
	});

	// Socket Logging
	parent.on("socket-close", (socket : net.Socket, hadError : boolean) => {
		log("Socket Closed");
	});

	parent.on("socket-error", (socket : net.Socket, err: Error) => {
		log("Socket had error:", err);
	});

	parent.on("socket-connect", (socket : net.Socket) => {
		log("Socket Connect Event");
	});

	parent.on("socket-data", (socket : net.Socket, data : Buffer) => {
		log("Socket sent data (converted to string):", data.toString());
	});

	parent.on("socket-drain", (socket : net.Socket) => {
		log("Socket drained, whatever that is");
	});

	parent.on("socket-end", (socket : net.Socket) => {
		log("=Socket 'ended'");
	});

	parent.on("socket-lookup", (socket : net.Socket, address : string, family : string | number, host : string) => {
		log("Socket lookup event: Address:", address, "family:", family, "host:", host);
	});

	parent.on("socket-timeout", (socket : net.Socket) => {
		log("Socket timeout");
	});

	log("Logging code set up");

	return opts;
};

export default ret;