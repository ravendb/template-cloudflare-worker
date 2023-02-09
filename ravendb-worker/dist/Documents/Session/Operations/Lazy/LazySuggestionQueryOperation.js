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
exports.LazySuggestionQueryOperation = void 0;
const GetRequest_1 = require("../../../Commands/MultiGet/GetRequest");
const QueryCommand_1 = require("../../../Commands/QueryCommand");
const StreamUtil_1 = require("../../../../Utility/StreamUtil");
const IndexQuery_1 = require("../../../Queries/IndexQuery");
class LazySuggestionQueryOperation {
    constructor(session, indexQuery, invokeAfterQueryExecuted, processResults) {
        this._session = session;
        this._indexQuery = indexQuery;
        this._invokeAfterQueryExecuted = invokeAfterQueryExecuted;
        this._processResults = processResults;
    }
    createRequest() {
        const request = new GetRequest_1.GetRequest();
        request.url = "/queries";
        request.method = "POST";
        request.query = "?queryHash=" + this._indexQuery.getQueryHash(this._session.conventions.objectMapper);
        request.body = (0, IndexQuery_1.writeIndexQuery)(this._session.conventions, this._indexQuery);
        return request;
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
    handleResponseAsync(response) {
        return __awaiter(this, void 0, void 0, function* () {
            if (response.forceRetry) {
                this._result = null;
                this._requiresRetry = true;
                return;
            }
            const result = yield QueryCommand_1.QueryCommand.parseQueryResultResponseAsync((0, StreamUtil_1.stringToReadable)(response.result), this._session.conventions, false);
            this._handleResponse(result);
        });
    }
    _handleResponse(queryResult) {
        this._result = this._processResults(queryResult);
        this._queryResult = queryResult;
    }
}
exports.LazySuggestionQueryOperation = LazySuggestionQueryOperation;
