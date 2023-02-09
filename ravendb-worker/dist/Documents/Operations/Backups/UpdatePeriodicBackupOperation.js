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
exports.UpdatePeriodicBackupOperation = void 0;
const RavenCommand_1 = require("../../../Http/RavenCommand");
const RaftIdGenerator_1 = require("../../../Utility/RaftIdGenerator");
class UpdatePeriodicBackupOperation {
    constructor(configuration) {
        this._configuration = configuration;
    }
    get resultType() {
        return "CommandResult";
    }
    getCommand(conventions) {
        return new UpdatePeriodicBackupCommand(this._configuration);
    }
}
exports.UpdatePeriodicBackupOperation = UpdatePeriodicBackupOperation;
class UpdatePeriodicBackupCommand extends RavenCommand_1.RavenCommand {
    constructor(configuration) {
        super();
        this._configuration = configuration;
    }
    get isReadRequest() {
        return false;
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + node.database + "/admin/periodic-backup";
        const body = this._serializer.serialize(this._configuration);
        return {
            uri,
            method: "POST",
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
    getRaftUniqueRequestId() {
        return RaftIdGenerator_1.RaftIdGenerator.newId();
    }
}
