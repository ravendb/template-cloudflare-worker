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
exports.CompactDatabaseCommand = exports.CompactDatabaseOperation = void 0;
const Exceptions_1 = require("../../Exceptions");
const RavenCommand_1 = require("../../Http/RavenCommand");
class CompactDatabaseOperation {
    constructor(compactSettings) {
        if (!compactSettings) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "CompactSettings cannot be null");
        }
        this._compactSettings = compactSettings;
    }
    getCommand(conventions) {
        return new CompactDatabaseCommand(conventions, this._compactSettings);
    }
    get resultType() {
        return "OperationId";
    }
}
exports.CompactDatabaseOperation = CompactDatabaseOperation;
class CompactDatabaseCommand extends RavenCommand_1.RavenCommand {
    constructor(conventions, compactSettings) {
        super();
        if (!conventions) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Conventions cannot be null");
        }
        if (!compactSettings) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "CompactSettings cannot be null");
        }
        this._compactSettings = compactSettings;
    }
    createRequest(node) {
        const uri = node.url + "/admin/compact";
        const body = this._serializer.serialize(this._compactSettings);
        return {
            method: "POST",
            body,
            uri,
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
    get isReadRequest() {
        return false;
    }
}
exports.CompactDatabaseCommand = CompactDatabaseCommand;
