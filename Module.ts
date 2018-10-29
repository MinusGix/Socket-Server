import Axiom from "./Server";

export interface AxiomModule {
	(parent : Axiom) : any;
	filename?: string;
}

interface AxiomModuleCache {
	[propName: string] : AxiomModule;
}

const cache : AxiomModuleCache = {};

export function loadModule (name : string) : AxiomModule {
	if (cache.hasOwnProperty(name)) {
		return cache[name];
	}

	cache[name] = require('./modules/' + name + '.js').default;
	cache[name].filename = name;

	return cache[name];
}