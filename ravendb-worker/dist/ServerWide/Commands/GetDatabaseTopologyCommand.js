"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetDatabaseTopologyCommand = void 0;
const RavenCommand_1 = require("../../Http/RavenCommand");
const ServerNode_1 = require("../../Http/ServerNode");
const Topology_1 = require("../../Http/Topology");
class GetDatabaseTopologyCommand extends RavenCommand_1.RavenCommand {
    constructor(debugTag, applicationIdentifier) {
        super();
        this._debugTag = debugTag;
        this._applicationIdentifier = applicationIdentifier;
        this.timeout = 15000;
    }
    createRequest(node) {
        let uri = `${node.url}/topology?name=${node.database}`;
        if (node.url.toLowerCase().indexOf(".fiddler") !== -1) {
            uri += "&localUrl=" + encodeURIComponent(node.url);
        }
        if (this._debugTag) {
            uri += "&" + this._debugTag;
        }
        if (this._applicationIdentifier) {
            uri += "&applicationIdentifier=" + this._urlEncode(this._applicationIdentifier);
        }
        return { uri };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!bodyStream) {
                return;
            }
            let body = null;
            const rawTpl = yield this._pipeline()
                .collectBody(_ => body = _)
                .parseJsonSync()
                .objectKeysTransform("camel")
                .process(bodyStream);
            const nodes = rawTpl.nodes
                ? rawTpl.nodes.map(x => Object.assign(new ServerNode_1.ServerNode(), x))
                : null;
            this.result = new Topology_1.Topology(rawTpl.etag, nodes);
            return body;
        });
    }
    get isReadRequest() {
        return true;
    }
}
exports.GetDatabaseTopologyCommand = GetDatabaseTopologyCommand;
