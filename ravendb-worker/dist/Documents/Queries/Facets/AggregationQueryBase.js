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
exports.AggregationQueryBase = void 0;
const Stopwatch_1 = require("../../../Utility/Stopwatch");
const _1 = require(".");
const FacetQueryCommand_1 = require("../../Commands/FacetQueryCommand");
const ObjectMapper_1 = require("../../../Mapping/ObjectMapper");
const QueryOperation_1 = require("../../Session/Operations/QueryOperation");
const LazyAggregationQueryOperation_1 = require("../../Session/Operations/Lazy/LazyAggregationQueryOperation");
class AggregationQueryBase {
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
    executeLazy() {
        this._query = this._getIndexQuery();
        return this._session
            .addLazyOperation(new LazyAggregationQueryOperation_1.LazyAggregationQueryOperation(this._session, this._query, this, (queryResult) => this._processResults(queryResult)));
    }
    _processResults(queryResult) {
        this.emit("afterQueryExecuted", queryResult);
        const results = {};
        const mapper = new ObjectMapper_1.TypesAwareObjectMapper();
        for (const result of queryResult.results) {
            const facetResult = Object.assign(new _1.FacetResult(), result);
            results[facetResult.name] = facetResult;
        }
        this._session.registerIncludes(queryResult.includes);
        QueryOperation_1.QueryOperation.ensureIsAcceptable(queryResult, this._query.waitForNonStaleResults, this._duration, this._session);
        return results;
    }
    _getCommand() {
        this._query = this._getIndexQuery();
        return new FacetQueryCommand_1.FacetQueryCommand(this._session, this._query, {
            metadataOnly: false,
            indexEntriesOnly: false
        });
    }
    toString() {
        return this._getIndexQuery(false).toString();
    }
}
exports.AggregationQueryBase = AggregationQueryBase;
