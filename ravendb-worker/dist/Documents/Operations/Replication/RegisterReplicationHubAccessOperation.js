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
exports.RegisterReplicationHubAccessOperation = void 0;
const StringUtil_1 = require("../../../Utility/StringUtil");
const Exceptions_1 = require("../../../Exceptions");
const RavenCommand_1 = require("../../../Http/RavenCommand");
const RaftIdGenerator_1 = require("../../../Utility/RaftIdGenerator");
const StatusCode_1 = require("../../../Http/StatusCode");
class RegisterReplicationHubAccessOperation {
    constructor(hubName, access) {
        if (StringUtil_1.StringUtil.isNullOrWhitespace(hubName)) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "HubName cannot be null or whitespace.");
        }
        if (!access) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Access cannot be null");
        }
        this._hubName = hubName;
        this._access = access;
    }
    get resultType() {
        return "CommandResult";
    }
    getCommand(conventions) {
        return new RegisterReplicationHubAccessCommand(this._hubName, this._access);
    }
}
exports.RegisterReplicationHubAccessOperation = RegisterReplicationHubAccessOperation;
class RegisterReplicationHubAccessCommand extends RavenCommand_1.RavenCommand {
    constructor(hubName, access) {
        super();
        if (StringUtil_1.StringUtil.isNullOrWhitespace(hubName)) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "HubName cannot be null or whitespace.");
        }
        if (!access) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Access cannot be null");
        }
        this._hubName = hubName;
        this._access = access;
        this._responseType = "Empty";
    }
    get isReadRequest() {
        return false;
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + node.database + "/admin/tasks/pull-replication/hub/access?name=" + this._urlEncode(this._hubName);
        const headers = this._headers().typeAppJson().build();
        const body = this._serializer.serialize(this._access);
        return {
            uri,
            method: "PUT",
            headers,
            body
        };
    }
    processResponse(cache, response, bodyStream, url) {
        return __awaiter(this, void 0, void 0, function* () {
            if (response.status === StatusCode_1.StatusCodes.NotFound) {
                (0, Exceptions_1.throwError)("ReplicationHubNotFoundException", "The replication hub " + this._hubName + " was not found on the database. Did you forget to define it first?");
            }
            return "Automatic";
        });
    }
    getRaftUniqueRequestId() {
        return RaftIdGenerator_1.RaftIdGenerator.newId();
    }
}
