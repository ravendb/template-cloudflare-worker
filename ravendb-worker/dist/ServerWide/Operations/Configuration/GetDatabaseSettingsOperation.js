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
exports.GetDatabaseSettingsOperation = void 0;
const Exceptions_1 = require("../../../Exceptions");
const RavenCommand_1 = require("../../../Http/RavenCommand");
class GetDatabaseSettingsOperation {
    constructor(databaseName) {
        if (!databaseName) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "DatabaseName cannot be null");
        }
        this._databaseName = databaseName;
    }
    get resultType() {
        return "CommandResult";
    }
    getCommand(conventions) {
        return new GetDatabaseSettingsCommand(this._databaseName);
    }
}
exports.GetDatabaseSettingsOperation = GetDatabaseSettingsOperation;
class GetDatabaseSettingsCommand extends RavenCommand_1.RavenCommand {
    constructor(databaseName) {
        super();
        if (!databaseName) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "DatabaseName cannot be null");
        }
        this._databaseName = databaseName;
    }
    get isReadRequest() {
        return false;
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + this._databaseName + "/admin/record";
        return {
            method: "GET",
            uri
        };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!bodyStream) {
                this._throwInvalidResponse();
            }
            let body;
            const result = yield this._pipeline()
                .parseJsonSync()
                .collectBody(_ => body = _)
                .process(bodyStream);
            this.result = {
                settings: result.Settings
            };
            return body;
        });
    }
}
