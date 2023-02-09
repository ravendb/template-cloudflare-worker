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
exports.UpdateDocumentsCompressionConfigurationOperation = void 0;
const Exceptions_1 = require("../../../Exceptions");
const RavenCommand_1 = require("../../../Http/RavenCommand");
const RaftIdGenerator_1 = require("../../../Utility/RaftIdGenerator");
class UpdateDocumentsCompressionConfigurationOperation {
    constructor(configuration) {
        if (!configuration) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Configuration cannot be null");
        }
        this._documentsCompressionConfiguration = configuration;
    }
    get resultType() {
        return "CommandResult";
    }
    getCommand(conventions) {
        return new UpdateDocumentCompressionConfigurationCommand(this._documentsCompressionConfiguration);
    }
}
exports.UpdateDocumentsCompressionConfigurationOperation = UpdateDocumentsCompressionConfigurationOperation;
class UpdateDocumentCompressionConfigurationCommand extends RavenCommand_1.RavenCommand {
    constructor(configuration) {
        super();
        if (!configuration) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Configuration cannot be null");
        }
        this._documentsCompressionConfiguration = configuration;
    }
    get isReadRequest() {
        return false;
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + node.database + "/admin/documents-compression/config";
        const headers = this._headers()
            .typeAppJson().build();
        const body = this._serializer.serialize(this._documentsCompressionConfiguration);
        return {
            uri,
            method: "POST",
            headers,
            body
        };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!bodyStream) {
                return;
            }
            return yield this._parseResponseDefaultAsync(bodyStream);
        });
    }
    getRaftUniqueRequestId() {
        return RaftIdGenerator_1.RaftIdGenerator.newId();
    }
}
