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
exports.ConfigureRevisionsOperationResult = exports.ConfigureRevisionsCommand = exports.ConfigureRevisionsOperation = void 0;
const RavenCommand_1 = require("../../../Http/RavenCommand");
const RaftIdGenerator_1 = require("../../../Utility/RaftIdGenerator");
const Exceptions_1 = require("../../../Exceptions");
class ConfigureRevisionsOperation {
    constructor(configuration) {
        if (!configuration) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Configuration cannot be null");
        }
        this._configuration = configuration;
    }
    get resultType() {
        return "CommandResult";
    }
    getCommand(conventions) {
        return new ConfigureRevisionsCommand(this._configuration);
    }
}
exports.ConfigureRevisionsOperation = ConfigureRevisionsOperation;
class ConfigureRevisionsCommand extends RavenCommand_1.RavenCommand {
    constructor(configuration) {
        super();
        this._configuration = configuration;
    }
    get isReadRequest() {
        return false;
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + node.database + "/admin/revisions/config";
        const body = JSON.stringify(this._configuration.toRemoteFieldNames(), null, 0);
        return {
            uri,
            method: "POST",
            body
        };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!bodyStream) {
                this._throwInvalidResponse();
            }
            let body = null;
            const results = yield this._defaultPipeline(_ => body = _)
                .process(bodyStream);
            this.result = Object.assign(new ConfigureRevisionsOperationResult(), results);
            return body;
        });
    }
    getRaftUniqueRequestId() {
        return RaftIdGenerator_1.RaftIdGenerator.newId();
    }
}
exports.ConfigureRevisionsCommand = ConfigureRevisionsCommand;
class ConfigureRevisionsOperationResult {
}
exports.ConfigureRevisionsOperationResult = ConfigureRevisionsOperationResult;
