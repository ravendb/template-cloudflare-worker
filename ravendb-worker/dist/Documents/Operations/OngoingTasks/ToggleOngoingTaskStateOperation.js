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
exports.ToggleOngoingTaskStateOperation = void 0;
const RavenCommand_1 = require("../../../Http/RavenCommand");
const TypeUtil_1 = require("../../../Utility/TypeUtil");
const RaftIdGenerator_1 = require("../../../Utility/RaftIdGenerator");
class ToggleOngoingTaskStateOperation {
    constructor(taskNameOrTaskId, type, disable) {
        if (TypeUtil_1.TypeUtil.isString(taskNameOrTaskId)) {
            this._taskId = 0;
            this._taskName = taskNameOrTaskId;
        }
        else {
            this._taskId = taskNameOrTaskId;
            this._taskName = null;
        }
        this._type = type;
        this._disable = disable;
    }
    get resultType() {
        return "CommandResult";
    }
    getCommand(conventions) {
        return new ToggleTaskStateCommand(this._taskId, this._taskName, this._type, this._disable);
    }
}
exports.ToggleOngoingTaskStateOperation = ToggleOngoingTaskStateOperation;
class ToggleTaskStateCommand extends RavenCommand_1.RavenCommand {
    constructor(taskId, taskName, type, disable) {
        super();
        this._taskId = taskId;
        this._taskName = taskName;
        this._type = type;
        this._disable = disable;
    }
    createRequest(node) {
        let uri = node.url + "/databases/"
            + node.database + "/admin/tasks/state?key="
            + this._taskId + "&type=" + this._type
            + "&disable=" + (this._disable ? "true" : "false");
        if (this._taskName) {
            uri += "&taskName=" + encodeURIComponent(this._taskName);
        }
        return {
            uri,
            method: "POST"
        };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (bodyStream) {
                return this._parseResponseDefaultAsync(bodyStream);
            }
            return null;
        });
    }
    get isReadRequest() {
        return false;
    }
    getRaftUniqueRequestId() {
        return RaftIdGenerator_1.RaftIdGenerator.newId();
    }
}
