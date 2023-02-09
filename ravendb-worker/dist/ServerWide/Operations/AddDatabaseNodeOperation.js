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
exports.AddDatabaseNodeOperation = void 0;
const Exceptions_1 = require("../../Exceptions");
const RavenCommand_1 = require("../../Http/RavenCommand");
const RaftIdGenerator_1 = require("../../Utility/RaftIdGenerator");
class AddDatabaseNodeOperation {
    constructor(databaseName, node) {
        this._databaseName = databaseName;
        this._node = node;
    }
    get resultType() {
        return "CommandResult";
    }
    getCommand(conventions) {
        return new AddDatabaseNodeCommand(this._databaseName, this._node);
    }
}
exports.AddDatabaseNodeOperation = AddDatabaseNodeOperation;
class AddDatabaseNodeCommand extends RavenCommand_1.RavenCommand {
    constructor(databaseName, node) {
        super();
        if (!databaseName) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "DatabaseName cannot be null");
        }
        this._databaseName = databaseName;
        this._node = node;
    }
    createRequest(node) {
        let uri = node.url + "/admin/databases/node?name=" + this._databaseName;
        if (node) {
            uri += "&node=" + this._node;
        }
        return {
            uri,
            method: "PUT"
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
    get isReadRequest() {
        return false;
    }
    getRaftUniqueRequestId() {
        return RaftIdGenerator_1.RaftIdGenerator.newId();
    }
}
