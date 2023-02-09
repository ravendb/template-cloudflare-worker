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
exports.StartTransactionsRecordingOperation = void 0;
const RavenCommand_1 = require("../../../Http/RavenCommand");
const Exceptions_1 = require("../../../Exceptions");
class StartTransactionsRecordingOperation {
    constructor(filePath) {
        if (!filePath) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "FilePath cannot be null");
        }
        this._filePath = filePath;
    }
    getCommand(conventions) {
        return new StartTransactionsRecordingCommand(this._filePath);
    }
    get resultType() {
        return "CommandResult";
    }
}
exports.StartTransactionsRecordingOperation = StartTransactionsRecordingOperation;
class StartTransactionsRecordingCommand extends RavenCommand_1.RavenCommand {
    constructor(filePath) {
        super();
        this._filePath = filePath;
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + node.database + "/admin/transactions/start-recording";
        const body = this._serializer.serialize({
            File: this._filePath
        });
        return {
            uri,
            method: "POST",
            headers: this._headers().typeAppJson().build(),
            body
        };
    }
    get isReadRequest() {
        return false;
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._parseResponseDefaultAsync(bodyStream);
        });
    }
}
