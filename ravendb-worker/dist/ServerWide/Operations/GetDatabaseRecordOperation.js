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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetDatabaseRecordCommand = exports.GetDatabaseRecordOperation = void 0;
const RavenCommand_1 = require("../../Http/RavenCommand");
const TimeSeriesConfiguration_1 = require("../../Documents/Operations/TimeSeries/TimeSeriesConfiguration");
class GetDatabaseRecordOperation {
    constructor(database) {
        this._database = database;
    }
    getCommand(conventions) {
        return new GetDatabaseRecordCommand(conventions, this._database);
    }
    get resultType() {
        return "CommandResult";
    }
}
exports.GetDatabaseRecordOperation = GetDatabaseRecordOperation;
class GetDatabaseRecordCommand extends RavenCommand_1.RavenCommand {
    constructor(conventions, database) {
        super();
        this._conventions = conventions;
        this._database = database;
    }
    get isReadRequest() {
        return false;
    }
    createRequest(node) {
        const uri = node.url + "/admin/databases?name=" + this._database;
        return {
            method: "GET",
            uri
        };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!bodyStream) {
                this._throwInvalidResponse();
            }
            let body = null;
            this.result = yield this._defaultPipeline(_ => body = _)
                .collectBody()
                .objectKeysTransform({
                defaultTransform: "camel",
                ignorePaths: [
                    /^(indexes|sorters|autoIndexes|settings|indexesHistory|ravenConnectionStrings|sqlConnectionStrings|rollingIndexes)\.[^.]+$/i,
                    /^rollingIndexes\.[^.]+\.activeDeployments\.[^.]+$/i,
                    /^indexesHistory\.[^.]+\.[^.]+\.rollingDeployment\.[^.]+$/i,
                    /^timeSeries\./i
                ]
            })
                .process(bodyStream);
            const dateUtil = this._conventions.dateUtil;
            if (this.result.rollingIndexes) {
                Object.values(this.result.rollingIndexes).forEach(index => {
                    if (index.activeDeployments) {
                        index.activeDeployments = GetDatabaseRecordCommand.mapRollingDeployment(dateUtil, index.activeDeployments);
                    }
                });
            }
            const history = this.result.indexesHistory;
            if (history) {
                for (const indexName of Object.keys(history)) {
                    const indexHistory = history[indexName];
                    history[indexName] = indexHistory.map(item => {
                        const _a = item, { createdAt, rollingDeployment } = _a, otherHistoryProps = __rest(_a, ["createdAt", "rollingDeployment"]);
                        return Object.assign(Object.assign({}, otherHistoryProps), { createdAt: dateUtil.parse(createdAt), rollingDeployment: GetDatabaseRecordCommand.mapRollingDeployment(dateUtil, rollingDeployment) });
                    });
                }
            }
            if (this.result.timeSeries) {
                this.result.timeSeries = TimeSeriesConfiguration_1.TimeSeriesConfiguration.parse(this.result.timeSeries);
            }
            return body;
        });
    }
    static mapRollingDeployment(dateUtil, input) {
        if (!input) {
            return null;
        }
        const result = {};
        for (const tag of Object.keys(input)) {
            const deployment = input[tag];
            result[tag] = {
                state: deployment.state,
                createdAt: dateUtil.parse(deployment.createdAt),
                startedAt: dateUtil.parse(deployment.startedAt),
                finishedAt: dateUtil.parse(deployment.finishedAt),
            };
        }
        return result;
    }
}
exports.GetDatabaseRecordCommand = GetDatabaseRecordCommand;
