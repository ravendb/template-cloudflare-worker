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
exports.PromoteDatabaseNodeOperation = void 0;
const Exceptions_1 = require("../../Exceptions");
const RavenCommand_1 = require("../../Http/RavenCommand");
const RaftIdGenerator_1 = require("../../Utility/RaftIdGenerator");
class PromoteDatabaseNodeOperation {
    constructor(databaseName, node) {
        this._databaseName = databaseName;
        this._node = node;
    }
    get resultType() {
        return "CommandResult";
    }
    getCommand(conventions) {
        return new PromoteDatabaseNodeCommand(this._databaseName, this._node);
    }
}
exports.PromoteDatabaseNodeOperation = PromoteDatabaseNodeOperation;
class PromoteDatabaseNodeCommand extends RavenCommand_1.RavenCommand {
    constructor(databaseName, node) {
        super();
        if (!databaseName) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "DatabaseName cannot be null");
        }
        if (!node) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Node cannot be null");
        }
        this._databaseName = databaseName;
        this._node = node;
    }
    createRequest(node) {
        const uri = node.url + "/admin/databases/promote?name=" + this._databaseName + "&node=" + this._node;
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
    get isReadRequest() {
        return false;
    }
    getRaftUniqueRequestId() {
        return RaftIdGenerator_1.RaftIdGenerator.newId();
    }
}
