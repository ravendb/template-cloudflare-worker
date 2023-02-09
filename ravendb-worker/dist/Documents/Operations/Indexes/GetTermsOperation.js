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
exports.GetTermsCommand = exports.GetTermsOperation = void 0;
const Exceptions_1 = require("../../../Exceptions");
const RavenCommand_1 = require("../../../Http/RavenCommand");
class GetTermsOperation {
    constructor(indexName, field, fromValue, pageSize = null) {
        if (!indexName) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "IndexName cannot be null");
        }
        if (!field) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Field cannot be null");
        }
        this._indexName = indexName;
        this._field = field;
        this._fromValue = fromValue;
        this._pageSize = pageSize;
    }
    getCommand(conventions) {
        return new GetTermsCommand(this._indexName, this._field, this._fromValue, this._pageSize);
    }
    get resultType() {
        return "CommandResult";
    }
}
exports.GetTermsOperation = GetTermsOperation;
class GetTermsCommand extends RavenCommand_1.RavenCommand {
    constructor(indexName, field, fromValue, pageSize = null) {
        super();
        if (!indexName) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "IndexName cannot be null");
        }
        if (!field) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Field cannot be null");
        }
        this._indexName = indexName;
        this._field = field;
        this._fromValue = fromValue;
        this._pageSize = pageSize;
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + node.database
            + "/indexes/terms?name=" + encodeURIComponent(this._indexName)
            + "&field=" + encodeURIComponent(this._field)
            + "&fromValue=" + (this._fromValue || "")
            + "&pageSize=" + (this._pageSize || "");
        return { uri };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!bodyStream) {
                this._throwInvalidResponse();
            }
            let body = null;
            const results = yield this._defaultPipeline(_ => body = _).process(bodyStream);
            this.result = results["terms"];
            return body;
        });
    }
    get isReadRequest() {
        return true;
    }
}
exports.GetTermsCommand = GetTermsCommand;
