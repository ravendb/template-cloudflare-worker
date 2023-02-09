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
exports.PutAttachmentCommand = exports.PutAttachmentOperation = void 0;
const StringUtil_1 = require("../../../Utility/StringUtil");
const Exceptions_1 = require("../../../Exceptions");
const RavenCommand_1 = require("../../../Http/RavenCommand");
class PutAttachmentOperation {
    constructor(documentId, name, stream, contentType, changeVector) {
        this._documentId = documentId;
        this._name = name;
        this._stream = stream;
        this._contentType = contentType;
        this._changeVector = changeVector;
    }
    getCommand(store, conventions, httpCache) {
        return new PutAttachmentCommand(this._documentId, this._name, this._stream, this._contentType, this._changeVector);
    }
    get resultType() {
        return "CommandResult";
    }
}
exports.PutAttachmentOperation = PutAttachmentOperation;
class PutAttachmentCommand extends RavenCommand_1.RavenCommand {
    constructor(documentId, name, stream, contentType, changeVector) {
        super();
        if (StringUtil_1.StringUtil.isNullOrWhitespace(documentId)) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "DocumentId cannot be null or empty");
        }
        if (StringUtil_1.StringUtil.isNullOrWhitespace(name)) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Name cannot be null or empty");
        }
        this._documentId = documentId;
        this._name = name;
        this._stream = stream;
        this._contentType = contentType;
        this._changeVector = changeVector;
    }
    createRequest(node) {
        let uri = node.url + "/databases/" + node.database
            + "/attachments?id=" + encodeURIComponent(this._documentId)
            + "&name=" + encodeURIComponent(this._name);
        if (!StringUtil_1.StringUtil.isNullOrEmpty(this._contentType)) {
            uri += "&contentType=" + encodeURIComponent(this._contentType);
        }
        const req = {
            uri,
            method: "PUT",
            body: this._stream
        };
        this._addChangeVectorIfNotNull(this._changeVector, req);
        return req;
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            let body = null;
            this.result = yield this._defaultPipeline(_ => body = _)
                .process(bodyStream);
            return body;
        });
    }
    get isReadRequest() {
        return false;
    }
}
exports.PutAttachmentCommand = PutAttachmentCommand;
