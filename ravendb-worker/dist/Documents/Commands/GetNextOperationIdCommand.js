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
exports.GetNextOperationIdCommand = void 0;
const RavenCommand_1 = require("../../Http/RavenCommand");
class GetNextOperationIdCommand extends RavenCommand_1.RavenCommand {
    get nodeTag() {
        return this._nodeTag;
    }
    get isReadRequest() {
        return false;
    }
    createRequest(node) {
        const uri = `${node.url}/databases/${node.database}/operations/next-operation-id`;
        return { uri };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            let body = null;
            const results = yield this._defaultPipeline(_ => body = _).process(bodyStream);
            const id = results["id"];
            if (typeof id !== "undefined") {
                this.result = id;
            }
            const nodeTag = results["nodeTag"];
            if (nodeTag) {
                this._nodeTag = nodeTag;
            }
            return body;
        });
    }
}
exports.GetNextOperationIdCommand = GetNextOperationIdCommand;
