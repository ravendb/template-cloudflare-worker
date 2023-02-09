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
exports.IndexHasChangedCommand = exports.IndexHasChangedOperation = void 0;
const Exceptions_1 = require("../../../Exceptions");
const RavenCommand_1 = require("../../../Http/RavenCommand");
const HttpUtil_1 = require("../../../Utility/HttpUtil");
class IndexHasChangedOperation {
    constructor(definition) {
        if (!definition) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "IndexDefinition cannot be null");
        }
        this._definition = definition;
    }
    getCommand(conventions) {
        return new IndexHasChangedCommand(conventions, this._definition);
    }
    get resultType() {
        return "CommandResult";
    }
}
exports.IndexHasChangedOperation = IndexHasChangedOperation;
class IndexHasChangedCommand extends RavenCommand_1.RavenCommand {
    constructor(conventions, definition) {
        super();
        this._definition = conventions.objectMapper.toObjectLiteral(definition);
    }
    get isReadRequest() {
        return false;
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + node.database + "/indexes/has-changed";
        const body = this._serializer.serialize(this._definition);
        const headers = HttpUtil_1.HeadersBuilder.create()
            .typeAppJson().build();
        return {
            method: "POST",
            uri,
            body,
            headers
        };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!bodyStream) {
                this._throwInvalidResponse();
            }
            let body = null;
            const results = yield this._defaultPipeline(_ => body = _)
                .process(bodyStream);
            this.result = results["changed"];
            return body;
        });
    }
}
exports.IndexHasChangedCommand = IndexHasChangedCommand;
