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
exports.SessionDocumentTypedTimeSeries = void 0;
const SessionTimeSeriesBase_1 = require("./SessionTimeSeriesBase");
const TypedTimeSeriesEntry_1 = require("./TimeSeries/TypedTimeSeriesEntry");
const TypeUtil_1 = require("../../Utility/TypeUtil");
const TimeSeriesValuesHelper_1 = require("./TimeSeries/TimeSeriesValuesHelper");
class SessionDocumentTypedTimeSeries extends SessionTimeSeriesBase_1.SessionTimeSeriesBase {
    constructor(session, documentIdOrEntity, name, clazz) {
        super(session, documentIdOrEntity, name);
        this._clazz = clazz;
    }
    get(startOrFrom, toOrPageSize, start, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            if (TypeUtil_1.TypeUtil.isNullOrUndefined(startOrFrom)) {
                return this._getTyped(null, null, 0, TypeUtil_1.TypeUtil.MAX_INT32);
            }
            else if (TypeUtil_1.TypeUtil.isNumber(startOrFrom)) {
                return this._getTyped(null, null, startOrFrom, toOrPageSize);
            }
            else {
                return this._getTyped(startOrFrom, toOrPageSize, start !== null && start !== void 0 ? start : 0, pageSize !== null && pageSize !== void 0 ? pageSize : TypeUtil_1.TypeUtil.MAX_INT32);
            }
        });
    }
    _getTyped(from, to, start, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._notInCache(from, to)) {
                const entries = yield this.getTimeSeriesAndIncludes(from, to, null, start, pageSize);
                if (!entries) {
                    return null;
                }
                return entries.map(x => x.asTypedEntry(this._clazz));
            }
            const results = yield this._getFromCache(from, to, null, start, pageSize);
            return results.map(x => x.asTypedEntry(this._clazz));
        });
    }
    append(entryOrTimestamp, entry, tag) {
        if (entryOrTimestamp instanceof TypedTimeSeriesEntry_1.TypedTimeSeriesEntry) {
            this.append(entryOrTimestamp.timestamp, entryOrTimestamp.value, entryOrTimestamp.tag);
        }
        else {
            const values = TimeSeriesValuesHelper_1.TimeSeriesValuesHelper.getValues(this._clazz, entry);
            this._appendInternal(entryOrTimestamp, values, tag);
        }
    }
}
exports.SessionDocumentTypedTimeSeries = SessionDocumentTypedTimeSeries;
