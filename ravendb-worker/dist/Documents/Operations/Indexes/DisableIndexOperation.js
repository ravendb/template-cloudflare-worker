"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisableIndexCommand = exports.DisableIndexOperation = void 0;
const Exceptions_1 = require("../../../Exceptions");
const RavenCommand_1 = require("../../../Http/RavenCommand");
const RaftIdGenerator_1 = require("../../../Utility/RaftIdGenerator");
class DisableIndexOperation {
    constructor(indexName, clusterWide = false) {
        if (!indexName) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "IndexName cannot be null");
        }
        this._indexName = indexName;
        this._clusterWide = clusterWide;
    }
    getCommand(conventions) {
        return new DisableIndexCommand(this._indexName, this._clusterWide);
    }
    get resultType() {
        return "CommandResult";
    }
}
exports.DisableIndexOperation = DisableIndexOperation;
class DisableIndexCommand extends RavenCommand_1.RavenCommand {
    constructor(indexName, clusterWide) {
        super();
        if (!indexName) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "IndexName cannot be null");
        }
        this._responseType = "Empty";
        this._indexName = indexName;
        this._clusterWide = clusterWide;
    }
    get isReadRequest() {
        return false;
    }
    createRequest(node) {
        const uri = node.url
            + "/databases/" + node.database
            + "/admin/indexes/disable?name=" + encodeURIComponent(this._indexName)
            + "&clusterWide=" + this._clusterWide;
        return { method: "POST", uri };
    }
    getRaftUniqueRequestId() {
        return RaftIdGenerator_1.RaftIdGenerator.newId();
    }
}
exports.DisableIndexCommand = DisableIndexCommand;