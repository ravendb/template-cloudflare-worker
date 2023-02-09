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
exports.GetTcpInfoForRemoteTaskCommand = void 0;
const RavenCommand_1 = require("../../Http/RavenCommand");
const index_1 = require("../../Exceptions/index");
class GetTcpInfoForRemoteTaskCommand extends RavenCommand_1.RavenCommand {
    constructor(tag, remoteDatabase, remoteTask, verifyDatabase = false) {
        super();
        if (!remoteDatabase) {
            (0, index_1.throwError)("InvalidArgumentException", "RemoteDatabase cannot be null");
        }
        this._remoteDatabase = remoteDatabase;
        if (!remoteTask) {
            (0, index_1.throwError)("InvalidArgumentException", "RemoteTask cannot be null");
        }
        this._remoteTask = remoteTask;
        this._tag = tag;
        this._verifyDatabase = verifyDatabase;
        this.timeout = 15000;
    }
    createRequest(node) {
        let uri = node.url + "/info/remote-task/tcp?" +
            "database=" + this._urlEncode(this._remoteDatabase) +
            "&remote-task=" + this._urlEncode(this._remoteTask) +
            "&tag=" + this._urlEncode(this._tag);
        if (this._verifyDatabase) {
            uri += "&verify-database=true";
        }
        this._requestedNode = node;
        return {
            method: "GET",
            uri
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
    getRequestedNode() {
        return this._requestedNode;
    }
    get isReadRequest() {
        return false;
    }
}
exports.GetTcpInfoForRemoteTaskCommand = GetTcpInfoForRemoteTaskCommand;
