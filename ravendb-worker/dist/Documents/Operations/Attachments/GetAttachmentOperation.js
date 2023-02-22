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
exports.GetAttachmentCommand = exports.GetAttachmentOperation = void 0;
const HttpUtil_1 = require("./../../../Utility/HttpUtil");
const Attachments_1 = require("../../Attachments");
const RavenCommand_1 = require("../../../Http/RavenCommand");
const Exceptions_1 = require("../../../Exceptions");
const StringUtil_1 = require("../../../Utility/StringUtil");
class GetAttachmentOperation {
    constructor(documentId, name, type, changeVector) {
        this._documentId = documentId;
        this._name = name;
        this._type = type;
        this._changeVector = changeVector;
    }
    get resultType() {
        return "CommandResult";
    }
    getCommand(store, conventions, cache) {
        return new GetAttachmentCommand(this._documentId, this._name, this._type, this._changeVector);
    }
}
exports.GetAttachmentOperation = GetAttachmentOperation;
class GetAttachmentCommand extends RavenCommand_1.RavenCommand {
    constructor(documentId, name, type, changeVector) {
        super();
        this.result = null;
        if (StringUtil_1.StringUtil.isNullOrWhitespace(documentId)) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "DocumentId cannot be null or empty");
        }
        if (StringUtil_1.StringUtil.isNullOrWhitespace(name)) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Name cannot be null or empty");
        }
        if (type !== "Document" && !changeVector) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Change vector cannot be null for attachment type " + type);
        }
        this._documentId = documentId;
        this._name = name;
        this._type = type;
        this._changeVector = changeVector;
        this._responseType = "Empty";
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + node.database + "/attachments?id="
            + encodeURIComponent(this._documentId) + "&name=" + encodeURIComponent(this._name);
        if (this._type !== "Document") {
            const body = this._serializer.serialize({ Type: this._type, ChangeVector: this._changeVector });
            return {
                uri,
                method: "POST",
                body
            };
        }
        return { uri };
    }
    processResponse(cache, response, bodyStream, url) {
        return __awaiter(this, void 0, void 0, function* () {
            const contentType = response.headers.get("content-type");
            const changeVector = (0, HttpUtil_1.getEtagHeader)(response);
            const hash = response.headers.get("attachment-hash");
            let size = 0;
            const sizeHeader = response.headers.get("attachment-size");
            if (sizeHeader) {
                size = parseInt(sizeHeader, 10);
            }
            const details = {
                name: this._name,
                documentId: this._documentId,
                contentType,
                hash,
                changeVector,
                size
            };
            this.result = new Attachments_1.AttachmentResult(bodyStream, details, response);
            return "Manually";
        });
    }
    get isReadRequest() {
        return true;
    }
}
exports.GetAttachmentCommand = GetAttachmentCommand;