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
exports.StartBackupOperation = void 0;
const RavenCommand_1 = require("../../../Http/RavenCommand");
class StartBackupOperation {
    constructor(isFullBackup, taskId) {
        this._isFullBackup = isFullBackup;
        this._taskId = taskId;
    }
    get resultType() {
        return "CommandResult";
    }
    getCommand(conventions) {
        return new StartBackupCommand(this._isFullBackup, this._taskId);
    }
}
exports.StartBackupOperation = StartBackupOperation;
class StartBackupCommand extends RavenCommand_1.RavenCommand {
    constructor(isFullBackup, taskId) {
        super();
        this._isFullBackup = isFullBackup;
        this._taskId = taskId;
    }
    get isReadRequest() {
        return true;
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + node.database
            + "/admin/backup/database?isFullBackup=" + (this._isFullBackup ? "true" : "false")
            + "&taskId=" + this._taskId;
        return {
            uri,
            method: "POST"
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
}
