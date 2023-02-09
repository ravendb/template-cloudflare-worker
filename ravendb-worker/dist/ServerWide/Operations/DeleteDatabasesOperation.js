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
exports.DeleteDatabaseCommand = exports.DeleteDatabasesOperation = void 0;
const Exceptions_1 = require("../../Exceptions");
const RavenCommand_1 = require("../../Http/RavenCommand");
const HttpUtil_1 = require("../../Utility/HttpUtil");
const RaftIdGenerator_1 = require("../../Utility/RaftIdGenerator");
class DeleteDatabasesOperation {
    constructor(parameters) {
        if (!parameters) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Parameters must be provided.");
        }
        if (!parameters.databaseNames || !parameters.databaseNames.length) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Database names must be provided.");
        }
        this._parameters = parameters;
    }
    get resultType() {
        return "CommandResult";
    }
    getCommand(conventions) {
        return new DeleteDatabaseCommand(conventions, this._parameters);
    }
}
exports.DeleteDatabasesOperation = DeleteDatabasesOperation;
class DeleteDatabaseCommand extends RavenCommand_1.RavenCommand {
    constructor(conventions, parameters) {
        super();
        if (!conventions) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Conventions cannot be null");
        }
        if (!parameters) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Parameters cannot be null.");
        }
        this._parameters = this._serializer.serialize(parameters);
    }
    createRequest(node) {
        const uri = node.url + "/admin/databases";
        return {
            uri,
            method: "DELETE",
            headers: HttpUtil_1.HeadersBuilder.create()
                .typeAppJson()
                .build(),
            body: this._parameters,
        };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!bodyStream) {
                this._throwInvalidResponse();
            }
            let body = null;
            this.result = yield this._defaultPipeline(x => body = x).process(bodyStream);
            return body;
        });
    }
    get isReadRequest() {
        return false;
    }
    getRaftUniqueRequestId() {
        return RaftIdGenerator_1.RaftIdGenerator.newId();
    }
}
exports.DeleteDatabaseCommand = DeleteDatabaseCommand;
