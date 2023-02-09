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
exports.FacetQueryCommand = void 0;
const QueryResult_1 = require("../Queries/QueryResult");
const QueryCommand_1 = require("./QueryCommand");
const RavenCommandResponsePipeline_1 = require("../../Http/RavenCommandResponsePipeline");
class FacetQueryCommand extends QueryCommand_1.QueryCommand {
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!bodyStream) {
                this.result = null;
                return;
            }
            let body = null;
            this.result = yield FacetQueryCommand.parseQueryResultResponseAsync(bodyStream, this._session.conventions, fromCache, b => body = b);
            return body;
        });
    }
    static parseQueryResultResponseAsync(bodyStream, conventions, fromCache, bodyCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            const rawResult = yield RavenCommandResponsePipeline_1.RavenCommandResponsePipeline.create()
                .collectBody(bodyCallback)
                .parseJsonAsync()
                .jsonKeysTransform("FacetQuery")
                .process(bodyStream);
            const overrides = {
                indexTimestamp: conventions.dateUtil.parse(rawResult.indexTimestamp),
                lastQueryTime: conventions.dateUtil.parse(rawResult.lastQueryTime)
            };
            const queryResult = Object.assign(new QueryResult_1.QueryResult(), rawResult, overrides);
            if (fromCache) {
                queryResult.durationInMs = -1;
            }
            return queryResult;
        });
    }
}
exports.FacetQueryCommand = FacetQueryCommand;
