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
exports.PutIndexesCommand = exports.PutIndexesOperation = void 0;
const Exceptions_1 = require("../../../Exceptions");
const RavenCommand_1 = require("../../../Http/RavenCommand");
const HttpUtil_1 = require("../../../Utility/HttpUtil");
const IndexTypeExtensions_1 = require("../../Indexes/IndexTypeExtensions");
const RaftIdGenerator_1 = require("../../../Utility/RaftIdGenerator");
class PutIndexesOperation {
    constructor(...indexToAdd) {
        if (!indexToAdd || !indexToAdd.length) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "indexToAdd cannot be null");
        }
        this._indexToAdd = indexToAdd;
    }
    get resultType() {
        return "CommandResult";
    }
    getCommand(conventions) {
        return new PutIndexesCommand(conventions, this._indexToAdd);
    }
}
exports.PutIndexesOperation = PutIndexesOperation;
class PutIndexesCommand extends RavenCommand_1.RavenCommand {
    constructor(conventions, indexesToAdd) {
        super();
        if (!conventions) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "conventions cannot be null or undefined.");
        }
        if (!indexesToAdd) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "indexesToAdd cannot be null or undefined.");
        }
        this._conventions = conventions;
        this._allJavaScriptIndexes = true;
        this._indexToAdd = indexesToAdd.reduce((result, next) => {
            if (!IndexTypeExtensions_1.IndexTypeExtensions.isJavaScript(next.type)) {
                this._allJavaScriptIndexes = false;
            }
            if (!next.name) {
                (0, Exceptions_1.throwError)("InvalidArgumentException", "Index name cannot be null.");
            }
            result.push(this._conventions.objectMapper.toObjectLiteral(next));
            return result;
        }, []);
    }
    get _serializer() {
        const INDEX_DEF_FIELDS_REGEX = /^Indexes\.(\d+)\.Fields$/;
        const serializer = super._serializer;
        serializer.replacerRules[0].contextMatcher = (context) => {
            const m = context.currentPath.match(INDEX_DEF_FIELDS_REGEX);
            return !m;
        };
        return serializer;
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + node.database
            + (this._allJavaScriptIndexes ? "/indexes" : "/admin/indexes");
        const body = this._serializer
            .serialize({ Indexes: this._indexToAdd });
        const headers = HttpUtil_1.HeadersBuilder
            .create()
            .typeAppJson()
            .build();
        return {
            method: "PUT",
            uri,
            body,
            headers
        };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            let body = null;
            const results = yield this._defaultPipeline(x => body = x)
                .process(bodyStream);
            this.result = results["results"];
            return body;
        });
    }
    get isReadRequest() {
        return false;
    }
    getRaftUniqueRequestId() {
        return RaftIdGenerator_1.RaftIdGenerator.newId();
    }
}
exports.PutIndexesCommand = PutIndexesCommand;
