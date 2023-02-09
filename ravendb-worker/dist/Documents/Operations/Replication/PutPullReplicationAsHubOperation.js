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
exports.PutPullReplicationAsHubOperation = void 0;
const StringUtil_1 = require("../../../Utility/StringUtil");
const index_1 = require("../../../Exceptions/index");
const TypeUtil_1 = require("../../../Utility/TypeUtil");
const RavenCommand_1 = require("../../../Http/RavenCommand");
const RaftIdGenerator_1 = require("../../../Utility/RaftIdGenerator");
class PutPullReplicationAsHubOperation {
    constructor(nameOrDefinition) {
        if (TypeUtil_1.TypeUtil.isString(nameOrDefinition)) {
            const name = nameOrDefinition;
            if (StringUtil_1.StringUtil.isNullOrEmpty(name)) {
                (0, index_1.throwError)("InvalidArgumentException", "Name cannot be null or empty");
            }
            this._pullReplicationDefinition = {
                name
            };
        }
        else {
            const pullReplicationDefinition = nameOrDefinition;
            if (StringUtil_1.StringUtil.isNullOrEmpty(pullReplicationDefinition.name)) {
                (0, index_1.throwError)("InvalidArgumentException", "Name cannot be null or empty");
            }
            this._pullReplicationDefinition = pullReplicationDefinition;
        }
    }
    get resultType() {
        return "CommandResult";
    }
    getCommand(conventions) {
        return new UpdatePullReplicationDefinitionCommand(this._pullReplicationDefinition);
    }
}
exports.PutPullReplicationAsHubOperation = PutPullReplicationAsHubOperation;
class UpdatePullReplicationDefinitionCommand extends RavenCommand_1.RavenCommand {
    constructor(pullReplicationDefinition) {
        super();
        this._pullReplicationDefinition = pullReplicationDefinition;
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + node.database + "/admin/tasks/pull-replication/hub";
        const body = this._serializer.serialize(this._pullReplicationDefinition);
        return {
            method: "PUT",
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
