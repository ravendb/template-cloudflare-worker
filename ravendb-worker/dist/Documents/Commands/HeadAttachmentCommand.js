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
exports.HeadAttachmentCommand = void 0;
const RavenCommand_1 = require("./../../Http/RavenCommand");
const StringUtil_1 = require("../../Utility/StringUtil");
const Exceptions_1 = require("../../Exceptions");
const StatusCode_1 = require("./../../Http/StatusCode");
const HttpUtil_1 = require("../../Utility/HttpUtil");
const Constants_1 = require("../../Constants");
class HeadAttachmentCommand extends RavenCommand_1.RavenCommand {
    constructor(documentId, name, changeVector) {
        super();
        if (StringUtil_1.StringUtil.isNullOrWhitespace(documentId)) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "DocumentId cannot be null or empty");
        }
        if (StringUtil_1.StringUtil.isNullOrWhitespace(name)) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Name cannot be null or empty");
        }
        this._documentId = documentId;
        this._name = name;
        this._changeVector = changeVector;
        this._responseType = "Empty";
    }
    get isReadRequest() {
        return false;
    }
    createRequest(node) {
        const uri = node.url
            + "/databases/" + node.database
            + "/attachments?id=" + encodeURIComponent(this._documentId)
            + "&name=" + encodeURIComponent(this._name);
        const req = {
            method: "HEAD",
            uri
        };
        if (this._changeVector) {
            req.headers[Constants_1.HEADERS.IF_NONE_MATCH] = `"${this._changeVector}"`;
        }
        return req;
    }
    processResponse(cache, response, bodyStream, url) {
        return __awaiter(this, void 0, void 0, function* () {
            if (response.status === StatusCode_1.StatusCodes.NotModified) {
                this.result = this._changeVector;
                return "Automatic";
            }
            if (response.status === StatusCode_1.StatusCodes.NotFound) {
                this.result = null;
                return "Automatic";
            }
            this.result = (0, HttpUtil_1.getRequiredEtagHeader)(response);
            return "Automatic";
        });
    }
}
exports.HeadAttachmentCommand = HeadAttachmentCommand;
