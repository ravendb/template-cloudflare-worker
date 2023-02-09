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
exports.HeadDocumentCommand = void 0;
const StatusCode_1 = require("../../Http/StatusCode");
const RavenCommand_1 = require("../../Http/RavenCommand");
const Exceptions_1 = require("../../Exceptions");
const HttpUtil_1 = require("../../Utility/HttpUtil");
const Constants_1 = require("../../Constants");
class HeadDocumentCommand extends RavenCommand_1.RavenCommand {
    constructor(id, changeVector) {
        super();
        if (!id) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Id cannot be null.");
        }
        this._id = id;
        this._changeVector = changeVector;
        this._responseType = "Empty";
    }
    get isReadRequest() {
        return false;
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + node.database + "/docs?id=" + encodeURIComponent(this._id);
        const headers = this._headers()
            .typeAppJson();
        if (this._changeVector) {
            headers.with(Constants_1.HEADERS.IF_NONE_MATCH, this._changeVector);
        }
        return {
            method: "HEAD",
            uri,
            headers: headers.build()
        };
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
exports.HeadDocumentCommand = HeadDocumentCommand;
