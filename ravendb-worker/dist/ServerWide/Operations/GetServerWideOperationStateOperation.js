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
exports.GetServerWideOperationStateCommand = exports.GetServerWideOperationStateOperation = void 0;
const RavenCommand_1 = require("../../Http/RavenCommand");
class GetServerWideOperationStateOperation {
    constructor(id) {
        this._id = id;
    }
    get resultType() {
        return "CommandResult";
    }
    getCommand(conventions) {
        return new GetServerWideOperationStateCommand(this._id);
    }
}
exports.GetServerWideOperationStateOperation = GetServerWideOperationStateOperation;
class GetServerWideOperationStateCommand extends RavenCommand_1.RavenCommand {
    constructor(id, nodeTag) {
        super();
        this._id = id;
        this._selectedNodeTag = nodeTag;
    }
    createRequest(node) {
        const uri = node.url + "/operations/state?id=" + this._id;
        return {
            uri,
            method: "GET"
        };
    }
    get isReadRequest() {
        return true;
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
exports.GetServerWideOperationStateCommand = GetServerWideOperationStateCommand;
