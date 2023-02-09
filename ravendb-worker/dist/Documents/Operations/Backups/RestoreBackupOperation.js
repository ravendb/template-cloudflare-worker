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
exports.RestoreBackupOperation = void 0;
const RavenCommand_1 = require("../../../Http/RavenCommand");
const Exceptions_1 = require("../../../Exceptions");
class RestoreBackupOperation {
    constructor(restoreConfiguration, nodeTag) {
        this._restoreConfiguration = restoreConfiguration;
        this._nodeTag = nodeTag;
    }
    getCommand(conventions) {
        return new RestoreBackupCommand(this._restoreConfiguration, this._nodeTag);
    }
    get resultType() {
        return "OperationId";
    }
    get nodeTag() {
        return this._nodeTag;
    }
}
exports.RestoreBackupOperation = RestoreBackupOperation;
class RestoreBackupCommand extends RavenCommand_1.RavenCommand {
    constructor(restoreConfiguration, nodeTag) {
        super();
        if (!restoreConfiguration) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "RestoreConfiguration cannot be null");
        }
        this._restoreConfiguration = restoreConfiguration;
        this._selectedNodeTag = nodeTag;
    }
    get isReadRequest() {
        return false;
    }
    createRequest(node) {
        const uri = node.url + "/admin/restore/database";
        const body = this._serializer.serialize(this._restoreConfiguration);
        return {
            uri,
            method: "POST",
            body,
            headers: this._headers().typeAppJson().build()
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
}
