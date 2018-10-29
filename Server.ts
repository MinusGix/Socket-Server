import * as net from "net";
import * as EventEmitter from "events";
import * as Module from "./Module";

// The props to new net.Server() unsure how to get the type from that, so declared it myself
interface NetServerOptions {
	allowHalfOpen?: boolean;
	pauseOnConnect?: boolean;
}

interface AxiomOptions {
	port?: number;
	host?: string;

	modules?: string[];

	netServerOptions?: NetServerOptions;
}


export default class Axiom extends EventEmitter {
	public options : AxiomOptions;

	public _server : net.Server;

	// Bleh, Any because the modules can return anything
	// Might force it to at least return an object
	public loadedModules : any[];

	constructor (options : AxiomOptions = {}) {
		super();

		options = Object.assign({
			port: 7075,
			host: '127.0.0.1',

			modules: [],

			netServerOptions: {}
		}, options);

		this.options = options;

		this.loadedModules = [];

		this._server = null;

		this.construct();
	}

	construct () : void {
		this._server = Axiom.constructNetServer(this.options.netServerOptions, this, this._server);
		
		this.addModules(...Axiom.loadModulesList(this.options.modules));

		this.constructListeners();

		this.listen();
	}

	constructListeners () {
		
	}

	addModule (axModule: Module.AxiomModule) : void {
		this.loadedModules.push(axModule(this));
	}

	addModules (...axModules : Module.AxiomModule[]) : void {
		axModules.forEach(axModule => this.addModule(axModule));
	}

	hasModule (name : string) : boolean {
		return this.getModuleIndex(name) !== -1;
	}

	getModuleIndex (name : string) : number {
		return this.options.modules.indexOf(name);
	}

	getModuleData (name : string) {
		return this.loadedModules[this.getModuleIndex(name)] || null;
	}

	listen () {
		this._server.listen(this.options.port, this.options.host);
	}

	static loadModule (name : string) : Module.AxiomModule {
		return Module.loadModule(name);
	}

	static loadModules (...names : string[]) : Module.AxiomModule[] {
		return names.map(name => this.loadModule(name));
	}

	static loadModulesList (moduleList : string[]) : Module.AxiomModule[] {
		return this.loadModules(...moduleList);
	}

	static constructNetServer (options : NetServerOptions = {}, parent : Axiom, server : net.Server = null) : net.Server {
		Axiom.destroyNetServer(server);

		server = new net.Server(options);

		Axiom.constructNetServerListeners(parent, server);

		return server;
	}

	static destroyNetServer (server : net.Server) : boolean {
		if (server instanceof net.Server) {
			server.close();

			return true;
		}

		return false;
	}

	static constructNetServerListeners (parent : Axiom, server : net.Server) : void {
		server.on("close", () => {
			// TODO: make so these emits don't happen if the net server is not the current net server in the Axiom instance
			parent.emit("server-close");
		});

		server.on("connection", (socket : net.Socket) => {
			Axiom.constructNetSocketListeners(parent, socket);

			parent.emit("server-connection", socket);
		});

		server.on("error", (err: Error) => {
			parent.emit("server-error", err);
		});

		server.on("listening", () => {
			parent.emit("server-listening");
		});
	}

	static constructNetSocketListeners (parent : Axiom, socket : net.Socket) : void {
		socket.on("close", (hadError: boolean) => {
			parent.emit("socket-close", socket, hadError);
		});

		socket.on("error", (err: Error) => {
			parent.emit("socket-error", socket, err);
		});

		socket.on("connect", () => {
			parent.emit("socket-connect", socket);
		});

		socket.on("data", (data) => {
			parent.emit("socket-data", socket, data);
		});

		socket.on("drain", () => {
			parent.emit("socket-drain", socket);
		});

		socket.on("end", () => {
			parent.emit("socket-end", socket);
		});

		socket.on("lookup", (err: Error, address: string, family: string | number, host : string) => {
			parent.emit("socket-lookup", socket, err, address, family, host);
		});

		socket.on("timeout", () => {
			parent.emit("socket-timeout", socket);
		});
	}
}