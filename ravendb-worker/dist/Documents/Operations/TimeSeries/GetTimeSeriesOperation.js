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
exports.reviveTimeSeriesRangeResult = exports.GetTimeSeriesCommand = exports.GetTimeSeriesOperation = void 0;
const TimeSeriesRangeResult_1 = require("./TimeSeriesRangeResult");
const TypeUtil_1 = require("../../../Utility/TypeUtil");
const StringUtil_1 = require("../../../Utility/StringUtil");
const Exceptions_1 = require("../../../Exceptions");
const DateUtil_1 = require("../../../Utility/DateUtil");
const TimeSeriesEntry_1 = require("../../Session/TimeSeries/TimeSeriesEntry");
const DocumentConventions_1 = require("../../Conventions/DocumentConventions");
const RavenCommand_1 = require("../../../Http/RavenCommand");
const StringBuilder_1 = require("../../../Utility/StringBuilder");
const TimeSeriesIncludeBuilder_1 = require("../../Session/Loaders/TimeSeriesIncludeBuilder");
class GetTimeSeriesOperation {
    constructor(docId, timeseries, from, to, start = 0, pageSize = TypeUtil_1.TypeUtil.MAX_INT32, includes) {
        if (StringUtil_1.StringUtil.isNullOrEmpty(docId)) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "DocId cannot be null or empty");
        }
        if (StringUtil_1.StringUtil.isNullOrEmpty(timeseries)) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Timeseries cannot be null or empty");
        }
        this._docId = docId;
        this._start = start;
        this._pageSize = pageSize;
        this._name = timeseries;
        this._from = from;
        this._to = to;
        this._includes = includes;
    }
    get resultType() {
        return "CommandResult";
    }
    getCommand(store, conventions, httpCache) {
        return new GetTimeSeriesCommand(conventions, this._docId, this._name, this._from, this._to, this._start, this._pageSize, this._includes);
    }
}
exports.GetTimeSeriesOperation = GetTimeSeriesOperation;
class GetTimeSeriesCommand extends RavenCommand_1.RavenCommand {
    constructor(conventions, docId, name, from, to, start, pageSize, includes) {
        super();
        this._conventions = conventions;
        this._docId = docId;
        this._name = name;
        this._start = start;
        this._pageSize = pageSize;
        this._from = from;
        this._to = to;
        this._includes = includes;
    }
    createRequest(node) {
        const pathBuilder = new StringBuilder_1.StringBuilder(node.url);
        pathBuilder
            .append("/databases/")
            .append(node.database)
            .append("/timeseries")
            .append("?docId=")
            .append(this._urlEncode(this._docId));
        if (this._start > 0) {
            pathBuilder
                .append("&start=")
                .append(this._start.toString());
        }
        if (this._pageSize < TypeUtil_1.TypeUtil.MAX_INT32) {
            pathBuilder
                .append("&pageSize=")
                .append(this._pageSize.toString());
        }
        pathBuilder
            .append("&name=")
            .append(this._urlEncode(this._name));
        if (this._from) {
            pathBuilder
                .append("&from=")
                .append(encodeURIComponent(DateUtil_1.DateUtil.utc.stringify(this._from)));
        }
        if (this._to) {
            pathBuilder
                .append("&to=")
                .append(encodeURIComponent(DateUtil_1.DateUtil.utc.stringify(this._to)));
        }
        if (this._includes) {
            GetTimeSeriesCommand.addIncludesToRequest(pathBuilder, this._includes);
        }
        const uri = pathBuilder.toString();
        return {
            method: "GET",
            uri
        };
    }
    static addIncludesToRequest(pathBuilder, includes) {
        const includeBuilder = new TimeSeriesIncludeBuilder_1.TimeSeriesIncludeBuilder(DocumentConventions_1.DocumentConventions.defaultConventions);
        includes(includeBuilder);
        if (includeBuilder.includeTimeSeriesDocument) {
            pathBuilder
                .append("&includeDocument=true");
        }
        if (includeBuilder.includeTimeSeriesTags) {
            pathBuilder
                .append("&includeTags=true");
        }
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!bodyStream) {
                return;
            }
            let body = null;
            const results = yield this._pipeline()
                .parseJsonSync()
                .collectBody(b => body = b)
                .process(bodyStream);
            const transformedResults = GetTimeSeriesCommand.mapToLocalObject(results, this._conventions);
            this.result = reviveTimeSeriesRangeResult(transformedResults, this._conventions);
            return body;
        });
    }
    get isReadRequest() {
        return true;
    }
    static mapToLocalObject(json, conventions) {
        const result = {
            to: json.To,
            from: json.From,
            includes: json.Includes,
            totalResults: json.TotalResults,
            entries: json.Entries.map(entry => ({
                timestamp: entry.Timestamp,
                tag: entry.Tag,
                values: entry.Values,
                isRollup: entry.IsRollup
            }))
        };
        return result;
    }
}
exports.GetTimeSeriesCommand = GetTimeSeriesCommand;
function reviveTimeSeriesRangeResult(json, conventions) {
    const result = new TimeSeriesRangeResult_1.TimeSeriesRangeResult();
    const { to, from, entries } = json, restProps = __rest(json, ["to", "from", "entries"]);
    const entryMapper = (rawEntry) => {
        const result = new TimeSeriesEntry_1.TimeSeriesEntry();
        result.timestamp = conventions.dateUtil.parse(rawEntry.timestamp);
        result.isRollup = rawEntry.isRollup;
        result.tag = rawEntry.tag;
        result.values = rawEntry.values;
        return result;
    };
    const overrides = Object.assign(Object.assign({}, restProps), { to: conventions.dateUtil.parse(to), from: conventions.dateUtil.parse(from), entries: entries.map(entryMapper) });
    return Object.assign(result, overrides);
}
exports.reviveTimeSeriesRangeResult = reviveTimeSeriesRangeResult;
