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
exports.UpdateEtlOperation = void 0;
const RavenCommand_1 = require("../../../Http/RavenCommand");
const RaftIdGenerator_1 = require("../../../Utility/RaftIdGenerator");
class UpdateEtlOperation {
    constructor(taskId, configuration) {
        this._taskId = taskId;
        this._configuration = configuration;
    }
    getCommand(conventions) {
        return new UpdateEtlCommand(conventions, this._taskId, this._configuration);
    }
    get resultType() {
        return "CommandResult";
    }
}
exports.UpdateEtlOperation = UpdateEtlOperation;
class UpdateEtlCommand extends RavenCommand_1.RavenCommand {
    constructor(conventions, taskId, configuration) {
        super();
        this._conventions = conventions;
        this._taskId = taskId;
        this._configuration = configuration;
    }
    get isReadRequest() {
        return false;
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + node.database + "/admin/etl?id=" + this._taskId;
        const body = this._serializer.serialize(this._configuration.serialize(this._conventions));
        const headers = this._headers().typeAppJson().build();
        return {
            uri,
            method: "PUT",
            headers,
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
