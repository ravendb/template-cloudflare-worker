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
exports.GetIndexesStatisticsCommand = exports.GetIndexesStatisticsOperation = void 0;
const IndexStats_1 = require("../../Indexes/IndexStats");
const RavenCommand_1 = require("../../../Http/RavenCommand");
class GetIndexesStatisticsOperation {
    get resultType() {
        return "CommandResult";
    }
    getCommand(conventions) {
        return new GetIndexesStatisticsCommand(conventions);
    }
}
exports.GetIndexesStatisticsOperation = GetIndexesStatisticsOperation;
const typeInfo = {
    nestedTypes: {
        "results[].collections": "Map",
        "results[].collections$MAP": "CollectionStats"
    }
};
const knownTypes = new Map([[IndexStats_1.CollectionStats.name, IndexStats_1.CollectionStats]]);
class GetIndexesStatisticsCommand extends RavenCommand_1.RavenCommand {
    constructor(conventions) {
        super();
        this._conventions = conventions;
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + node.database + "/indexes/stats";
        return { uri };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!bodyStream) {
                this._throwInvalidResponse();
            }
            let body = null;
            const results = yield this._defaultPipeline(_ => body = _).process(bodyStream);
            for (const r of results["results"]) {
                r.collections = Object.keys(r.collections)
                    .reduce((result, next) => [...result, [next, result[next]]], []);
            }
            const obj = this._reviveResultTypes(results, this._conventions, typeInfo, knownTypes);
            this.result = obj["results"];
            return body;
        });
    }
    get isReadRequest() {
        return true;
    }
}
exports.GetIndexesStatisticsCommand = GetIndexesStatisticsCommand;
