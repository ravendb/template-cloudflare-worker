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
exports.GetPeriodicBackupStatusOperation = void 0;
const RavenCommand_1 = require("../../../Http/RavenCommand");
class GetPeriodicBackupStatusOperation {
    constructor(taskId) {
        this._taskId = taskId;
    }
    get resultType() {
        return "CommandResult";
    }
    getCommand(conventions) {
        return new GetPeriodicBackupStatusCommand(this._taskId, conventions);
    }
}
exports.GetPeriodicBackupStatusOperation = GetPeriodicBackupStatusOperation;
class GetPeriodicBackupStatusCommand extends RavenCommand_1.RavenCommand {
    constructor(taskId, conventions) {
        super();
        this._taskId = taskId;
        this._conventions = conventions;
    }
    createRequest(node) {
        const uri = node.url + "/periodic-backup/status?name=" + node.database + "&taskId=" + this._taskId;
        return {
            method: "GET",
            uri
        };
    }
    get isReadRequest() {
        return true;
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!bodyStream) {
                this._throwInvalidResponse();
            }
            let body = null;
            const results = yield this._defaultPipeline(_ => body = _)
                .process(bodyStream);
            this.result = this._reviveResultTypes(results, this._conventions, {
                nestedTypes: {
                    "status.lastFullBackup": "date",
                    "status.lastIncrementalBackup": "date",
                    "status.lastFullBackupInternal": "date",
                    "status.lastIncrementalBackupInternal": "date",
                    "status.localBackup.lastIncrementalBackup": "date",
                    "status.localBackup.lastFullBackup": "date",
                    "status.nextBackup.dateTime": "date",
                    "status.onGoingBackup.startTime": "date",
                    "status.error.at": "date"
                }
            });
            return body;
        });
    }
}
