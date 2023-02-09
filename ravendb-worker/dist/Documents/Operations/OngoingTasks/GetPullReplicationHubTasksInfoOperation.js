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
exports.GetPullReplicationHubTasksInfoOperation = void 0;
const RavenCommand_1 = require("../../../Http/RavenCommand");
class GetPullReplicationHubTasksInfoOperation {
    constructor(taskId) {
        this._taskId = taskId;
    }
    getCommand(conventions) {
        return new GetPullReplicationTasksInfoCommand(this._taskId);
    }
    get resultType() {
        return "CommandResult";
    }
}
exports.GetPullReplicationHubTasksInfoOperation = GetPullReplicationHubTasksInfoOperation;
class GetPullReplicationTasksInfoCommand extends RavenCommand_1.RavenCommand {
    constructor(taskId) {
        super();
        this._taskId = taskId;
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + node.database + "/tasks/pull-replication/hub?key=" + this._taskId;
        return {
            method: "GET",
            uri
        };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._parseResponseDefaultAsync(bodyStream);
        });
    }
    get isReadRequest() {
        return false;
    }
}
