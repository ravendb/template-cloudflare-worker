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
exports.GetRevisionsCountOperation = void 0;
const RavenCommand_1 = require("../../../Http/RavenCommand");
const Exceptions_1 = require("../../../Exceptions");
class GetRevisionsCountOperation {
    constructor(docId) {
        this._docId = docId;
    }
    createRequest() {
        return new GetRevisionsCountCommand(this._docId);
    }
}
exports.GetRevisionsCountOperation = GetRevisionsCountOperation;
class GetRevisionsCountCommand extends RavenCommand_1.RavenCommand {
    constructor(id) {
        super();
        if (!id) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Id cannot be null");
        }
        this._id = id;
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + node.database + "/revisions/count?&id=" + this._urlEncode(this._id);
        return {
            method: "GET",
            uri
        };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            let body = null;
            const result = yield this._defaultPipeline(_ => body = _).process(bodyStream);
            this.result = result.revisionsCount;
            return body;
        });
    }
    get isReadRequest() {
        return true;
    }
}
