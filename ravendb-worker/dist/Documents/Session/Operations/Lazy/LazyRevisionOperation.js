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
exports.LazyRevisionOperation = void 0;
const GetRequest_1 = require("../../../Commands/MultiGet/GetRequest");
const Exceptions_1 = require("../../../../Exceptions");
class LazyRevisionOperation {
    constructor(clazz, getRevisionOperation, mode) {
        this._clazz = clazz;
        this._getRevisionOperation = getRevisionOperation;
        this._mode = mode;
    }
    get result() {
        return this._result;
    }
    set result(result) {
        this._result = result;
    }
    get queryResult() {
        return this._queryResult;
    }
    set queryResult(queryResult) {
        this._queryResult = queryResult;
    }
    get requiresRetry() {
        return this._requiresRetry;
    }
    set requiresRetry(result) {
        this._requiresRetry = result;
    }
    createRequest() {
        const getRevisionsCommand = this._getRevisionOperation.command;
        const getRequest = new GetRequest_1.GetRequest();
        getRequest.method = "GET";
        getRequest.url = "/revisions";
        getRequest.query = "?" + getRevisionsCommand.getRequestQueryString();
        return getRequest;
    }
    handleResponseAsync(response) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!response.result) {
                return;
            }
            const responseAsNode = JSON.parse(response.result);
            const jsonArrayResult = {
                results: responseAsNode.Results
            };
            this._getRevisionOperation.result = jsonArrayResult;
            switch (this._mode) {
                case "Single":
                    this._result = this._getRevisionOperation.getRevision(this._clazz);
                    break;
                case "Multi":
                    this._result = this._getRevisionOperation.getRevisionsFor(this._clazz);
                    break;
                case "Map":
                    this._result = this._getRevisionOperation.getRevisions(this._clazz);
                    break;
                case "ListOfMetadata":
                    this._result = this._getRevisionOperation.getRevisionsMetadataFor();
                    break;
                default:
                    (0, Exceptions_1.throwError)("InvalidArgumentException", "Invalid mode: " + this._mode);
            }
        });
    }
}
exports.LazyRevisionOperation = LazyRevisionOperation;
