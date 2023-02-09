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
exports.DeleteOngoingTaskOperation = void 0;
const RavenCommand_1 = require("../../../Http/RavenCommand");
const RaftIdGenerator_1 = require("../../../Utility/RaftIdGenerator");
class DeleteOngoingTaskOperation {
    constructor(taskId, taskType) {
        this._taskId = taskId;
        this._taskType = taskType;
    }
    get resultType() {
        return "CommandResult";
    }
    getCommand(conventions) {
        return new DeleteOngoingTaskCommand(this._taskId, this._taskType);
    }
}
exports.DeleteOngoingTaskOperation = DeleteOngoingTaskOperation;
class DeleteOngoingTaskCommand extends RavenCommand_1.RavenCommand {
    constructor(taskId, taskType) {
        super();
        this._taskId = taskId;
        this._taskType = taskType;
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + node.database + "/admin/tasks?id=" + this._taskId + "&type=" + this._taskType;
        return {
            uri,
            method: "DELETE"
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
