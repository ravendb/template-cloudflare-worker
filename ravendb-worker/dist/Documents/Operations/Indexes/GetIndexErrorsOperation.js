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
exports.GetIndexErrorsCommand = exports.GetIndexErrorsOperation = void 0;
const RavenCommand_1 = require("../../../Http/RavenCommand");
class GetIndexErrorsOperation {
    constructor(indexNames = null) {
        this._indexNames = indexNames;
    }
    getCommand(conventions) {
        return new GetIndexErrorsCommand(this._indexNames, conventions);
    }
    get resultType() {
        return "CommandResult";
    }
}
exports.GetIndexErrorsOperation = GetIndexErrorsOperation;
class GetIndexErrorsCommand extends RavenCommand_1.RavenCommand {
    constructor(indexNames, conventions) {
        super();
        this._indexNames = indexNames;
        this._conventions = conventions;
    }
    createRequest(node) {
        let uri = node.url + "/databases/" + node.database + "/indexes/errors";
        if (this._indexNames && this._indexNames.length) {
            uri += "?";
            for (const indexName of this._indexNames) {
                uri += "&name=" + this._urlEncode(indexName);
            }
        }
        return { uri };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!bodyStream) {
                this._throwInvalidResponse();
            }
            const typeInfo = {
                nestedTypes: {
                    "results[].errors[].timestamp": "date"
                }
            };
            let body = null;
            const results = yield this._defaultPipeline(_ => body = _).process(bodyStream);
            this.result = this._reviveResultTypes(results, this._conventions, typeInfo)["results"];
            return body;
        });
    }
    get isReadRequest() {
        return true;
    }
}
exports.GetIndexErrorsCommand = GetIndexErrorsCommand;
