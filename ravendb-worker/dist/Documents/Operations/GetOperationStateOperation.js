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
exports.GetOperationStateCommand = exports.GetOperationStateOperation = void 0;
const RavenCommand_1 = require("../../Http/RavenCommand");
class GetOperationStateOperation {
    constructor(id, nodeTag) {
        this._id = id;
        this._nodeTag = nodeTag;
    }
    getCommand(conventions) {
        return new GetOperationStateCommand(this._id, this._nodeTag);
    }
    get resultType() {
        return "CommandResult";
    }
}
exports.GetOperationStateOperation = GetOperationStateOperation;
class GetOperationStateCommand extends RavenCommand_1.RavenCommand {
    constructor(id, nodeTag) {
        super();
        this._id = id;
        this._selectedNodeTag = nodeTag;
        this.timeout = 15000;
    }
    get isReadRequest() {
        return true;
    }
    createRequest(node) {
        const uri = `${node.url}/databases/${node.database}/operations/state?id=${this._id}`;
        return { uri };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!bodyStream) {
                return;
            }
            return this._parseResponseDefaultAsync(bodyStream);
        });
    }
}
exports.GetOperationStateCommand = GetOperationStateCommand;
