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
exports.GetServerWideBackupConfigurationsOperation = void 0;
const RavenCommand_1 = require("../../../Http/RavenCommand");
class GetServerWideBackupConfigurationsOperation {
    getCommand(conventions) {
        return new GetServerWideBackupConfigurationsCommand();
    }
    get resultType() {
        return "CommandResult";
    }
}
exports.GetServerWideBackupConfigurationsOperation = GetServerWideBackupConfigurationsOperation;
class GetServerWideBackupConfigurationsCommand extends RavenCommand_1.RavenCommand {
    get isReadRequest() {
        return true;
    }
    createRequest(node) {
        const uri = node.url + "/admin/configuration/server-wide/tasks?type=Backup";
        return {
            method: "GET",
            uri
        };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            let body = null;
            const result = yield this._defaultPipeline(_ => body = _).process(bodyStream);
            this.result = result["results"];
            return body;
        });
    }
}
