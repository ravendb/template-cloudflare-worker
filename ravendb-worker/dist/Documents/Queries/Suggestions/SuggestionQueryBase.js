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
exports.SuggestionQueryBase = void 0;
const Stopwatch_1 = require("../../../Utility/Stopwatch");
const QueryCommand_1 = require("../../Commands/QueryCommand");
const LazySuggestionQueryOperation_1 = require("../../Session/Operations/Lazy/LazySuggestionQueryOperation");
const QueryOperation_1 = require("../../Session/Operations/QueryOperation");
const ObjectUtil_1 = require("../../../Utility/ObjectUtil");
class SuggestionQueryBase {
    constructor(session) {
        this._session = session;
    }
    execute() {
        return __awaiter(this, void 0, void 0, function* () {
            const command = this._getCommand();
            this._duration = Stopwatch_1.Stopwatch.createStarted();
            this._session.incrementRequestCount();
            yield this._session.requestExecutor.execute(command);
            return this._processResults(command.result);
        });
    }
    _processResults(queryResult) {
        this._invokeAfterQueryExecuted(queryResult);
        const results = {};
        for (const result of queryResult.results) {
            const transformedResult = ObjectUtil_1.ObjectUtil.transformObjectKeys(result, {
                defaultTransform: "camel"
            });
            results[transformedResult.name] = transformedResult;
        }
        QueryOperation_1.QueryOperation.ensureIsAcceptable(queryResult, this._query.waitForNonStaleResults, this._duration, this._session);
        return results;
    }
    executeLazy() {
        this._query = this._getIndexQuery();
        return this._session.addLazyOperation(new LazySuggestionQueryOperation_1.LazySuggestionQueryOperation(this._session, this._query, result => this._invokeAfterQueryExecuted(result), (result) => this._processResults(result)));
    }
    _getCommand() {
        this._query = this._getIndexQuery();
        return new QueryCommand_1.QueryCommand(this._session, this._query, {
            indexEntriesOnly: false,
            metadataOnly: false
        });
    }
    toString() {
        return this._getIndexQuery(false).toString();
    }
}
exports.SuggestionQueryBase = SuggestionQueryBase;
