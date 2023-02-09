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
exports.ExplainQueryCommand = void 0;
const RavenCommand_1 = require("../../Http/RavenCommand");
const IndexQuery_1 = require("../Queries/IndexQuery");
const Exceptions_1 = require("../../Exceptions");
class ExplainQueryCommand extends RavenCommand_1.RavenCommand {
    constructor(conventions, indexQuery) {
        super();
        if (!conventions) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Conventions cannot be null");
        }
        if (!indexQuery) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "IndexQuery cannot be null");
        }
        this._conventions = conventions;
        this._indexQuery = indexQuery;
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + node.database + "/queries?debug=explain";
        const headers = this._headers().typeAppJson().build();
        return {
            method: "POST",
            uri,
            body: (0, IndexQuery_1.writeIndexQuery)(this._conventions, this._indexQuery),
            headers
        };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!bodyStream) {
                this.result = null;
                return;
            }
            let body = null;
            const data = yield this._defaultPipeline(_ => body = _)
                .process(bodyStream);
            const explainResults = data["results"];
            if (!explainResults) {
                this._throwInvalidResponse();
                return;
            }
            this.result = explainResults;
            return body;
        });
    }
    get isReadRequest() {
        return true;
    }
}
exports.ExplainQueryCommand = ExplainQueryCommand;
