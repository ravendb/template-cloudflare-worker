"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClusterWideBatchCommand = void 0;
const RaftIdGenerator_1 = require("../../../Utility/RaftIdGenerator");
const SingleNodeBatchCommand_1 = require("./SingleNodeBatchCommand");
const TypeUtil_1 = require("../../../Utility/TypeUtil");
class ClusterWideBatchCommand extends SingleNodeBatchCommand_1.SingleNodeBatchCommand {
    constructor(conventions, commands, options, disableAtomicDocumentsWrites) {
        super(conventions, commands, options, "ClusterWide");
        this._disableAtomicDocumentWrites = disableAtomicDocumentsWrites;
    }
    get disableAtomicDocumentWrites() {
        return this._disableAtomicDocumentWrites;
    }
    getRaftUniqueRequestId() {
        return RaftIdGenerator_1.RaftIdGenerator.newId();
    }
    _appendOptions() {
        let options = super._appendOptions();
        if (TypeUtil_1.TypeUtil.isNullOrUndefined(this._disableAtomicDocumentWrites)) {
            return "";
        }
        options
            += "&disableAtomicDocumentWrites=" + (this._disableAtomicDocumentWrites ? "true" : "false");
        return options;
    }
}
exports.ClusterWideBatchCommand = ClusterWideBatchCommand;