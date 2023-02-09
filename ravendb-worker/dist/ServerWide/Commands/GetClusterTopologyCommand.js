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
exports.GetClusterTopologyCommand = exports.ClusterTopologyResponse = void 0;
const RavenCommand_1 = require("../../Http/RavenCommand");
const ClusterTopology_1 = require("../../Http/ClusterTopology");
class ClusterTopologyResponse {
}
exports.ClusterTopologyResponse = ClusterTopologyResponse;
class GetClusterTopologyCommand extends RavenCommand_1.RavenCommand {
    constructor(debugTag) {
        super();
        this._debugTag = debugTag;
    }
    createRequest(node) {
        let uri = node.url + "/cluster/topology";
        if (this._debugTag) {
            uri += "?" + this._debugTag;
        }
        return { uri };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!bodyStream) {
                this._throwInvalidResponse();
            }
            let body = null;
            const result = yield this._pipeline()
                .collectBody(b => body = b)
                .parseJsonSync()
                .objectKeysTransform({
                defaultTransform: "camel",
                ignorePaths: [/topology\.(members|promotables|watchers|allNodes)\./i]
            })
                .process(bodyStream);
            const clusterTpl = Object.assign(new ClusterTopology_1.ClusterTopology(), result.topology);
            this.result = Object.assign(result, { topology: clusterTpl });
            this.result.status = new Map(Object.entries(this.result.status));
            return body;
        });
    }
    get isReadRequest() {
        return true;
    }
}
exports.GetClusterTopologyCommand = GetClusterTopologyCommand;
