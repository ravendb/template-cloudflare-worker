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
exports.LazyConditionalLoadOperation = void 0;
const GetRequest_1 = require("../../../Commands/MultiGet/GetRequest");
const Exceptions_1 = require("../../../../Exceptions");
const StatusCode_1 = require("../../../../Http/StatusCode");
const Constants_1 = require("../../../../Constants");
const QueryCommand_1 = require("../../../Commands/QueryCommand");
const StreamUtil_1 = require("../../../../Utility/StreamUtil");
const DocumentInfo_1 = require("../../DocumentInfo");
class LazyConditionalLoadOperation {
    constructor(session, id, changeVector, clazz) {
        this._clazz = clazz;
        this._session = session;
        this._id = id;
        this._changeVector = changeVector;
    }
    createRequest() {
        const request = new GetRequest_1.GetRequest();
        request.url = "/docs";
        request.method = "GET";
        request.query = "?id=" + encodeURIComponent(this._id);
        request.headers[Constants_1.HEADERS.IF_NONE_MATCH] = `"${this._changeVector}"`;
        return request;
    }
    get queryResult() {
        (0, Exceptions_1.throwError)("NotImplementedException");
        return null;
    }
    get result() {
        return this._result;
    }
    get requiresRetry() {
        return this._requiresRetry;
    }
    handleResponseAsync(response) {
        return __awaiter(this, void 0, void 0, function* () {
            if (response.forceRetry) {
                this._result = null;
                this._requiresRetry = true;
                return;
            }
            switch (response.statusCode) {
                case StatusCode_1.StatusCodes.NotModified:
                    this._result = {
                        entity: null,
                        changeVector: this._changeVector
                    };
                    return;
                case StatusCode_1.StatusCodes.NotFound:
                    this._session.registerMissing(this._id);
                    this._result = {
                        entity: null,
                        changeVector: null
                    };
                    return;
            }
            if (response.result) {
                const etag = response.headers[Constants_1.HEADERS.ETAG];
                const res = yield QueryCommand_1.QueryCommand.parseQueryResultResponseAsync((0, StreamUtil_1.stringToReadable)(response.result), this._session.conventions, false);
                const documentInfo = DocumentInfo_1.DocumentInfo.getNewDocumentInfo(res.results[0]);
                const r = this._session.trackEntity(this._clazz, documentInfo);
                this._result = {
                    entity: r,
                    changeVector: etag
                };
                return;
            }
            this._result = null;
            this._session.registerMissing(this._id);
        });
    }
}
exports.LazyConditionalLoadOperation = LazyConditionalLoadOperation;
