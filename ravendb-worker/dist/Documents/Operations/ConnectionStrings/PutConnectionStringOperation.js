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
exports.PutConnectionStringCommand = exports.PutConnectionStringOperation = void 0;
const RavenCommand_1 = require("../../../Http/RavenCommand");
const RaftIdGenerator_1 = require("../../../Utility/RaftIdGenerator");
const Exceptions_1 = require("../../../Exceptions");
class PutConnectionStringOperation {
    constructor(connectionString) {
        this._connectionString = connectionString;
    }
    getCommand(conventions) {
        return new PutConnectionStringCommand(this._connectionString);
    }
    get resultType() {
        return "CommandResult";
    }
}
exports.PutConnectionStringOperation = PutConnectionStringOperation;
class PutConnectionStringCommand extends RavenCommand_1.RavenCommand {
    constructor(connectionString) {
        super();
        if (!connectionString) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "ConnectionString cannot be null");
        }
        this._connectionString = connectionString;
    }
    get isReadRequest() {
        return false;
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + node.database + "/admin/connection-strings";
        const headers = this._headers()
            .typeAppJson()
            .build();
        const body = this._serializer.serialize(this._connectionString);
        return {
            method: "PUT",
            uri,
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
exports.PutConnectionStringCommand = PutConnectionStringCommand;
