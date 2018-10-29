// THIS IS NOT A MODULE, ITS MEANT TO BE HERE AND REQUIRED BY MODULES
import {AxiomModule} from "../Module";
import * as net from "net";

export function strip (text : string) : string {
	return text.trimRight();
}

export function sendMessage (socket : net.Socket, text : string, includeNewline : boolean = false) {
	if (includeNewline) {
		text += '\n';
	}

	socket.write(text);
}
