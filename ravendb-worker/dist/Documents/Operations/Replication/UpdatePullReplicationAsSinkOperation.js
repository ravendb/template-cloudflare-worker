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
exports.UpdatePullReplicationAsSinkOperation = void 0;
const RavenCommand_1 = require("../../../Http/RavenCommand");
const RaftIdGenerator_1 = require("../../../Utility/RaftIdGenerator");
const Exceptions_1 = require("../../../Exceptions");
class UpdatePullReplicationAsSinkOperation {
    constructor(pullReplication) {
        if (!pullReplication) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "PullReplication cannot be null");
        }
        this._pullReplication = pullReplication;
    }
    getCommand(conventions) {
        return new UpdatePullEdgeReplication(this._pullReplication);
    }
    get resultType() {
        return "CommandResult";
    }
}
exports.UpdatePullReplicationAsSinkOperation = UpdatePullReplicationAsSinkOperation;
class UpdatePullEdgeReplication extends RavenCommand_1.RavenCommand {
    constructor(pullReplication) {
        super();
        if (!pullReplication) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "PullReplication cannot be null");
        }
        this._pullReplication = pullReplication;
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + node.database + "/admin/tasks/sink-pull-replication";
        const body = this._serializer.serialize({
            PullReplicationAsSink: this._pullReplication
        });
        return {
            method: "POST",
            uri,
            headers: this._headers().typeAppJson().build(),
            body
        };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!bodyStream) {
                this._throwInvalidResponse();
            }
            return this._parseResponseDefaultAsync(bodyStream);
        });
    }
    get isReadRequest() {
        return false;
    }
    getRaftUniqueRequestId() {
        return RaftIdGenerator_1.RaftIdGenerator.newId();
    }
}
