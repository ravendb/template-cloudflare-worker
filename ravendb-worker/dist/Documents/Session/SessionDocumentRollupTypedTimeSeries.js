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
exports.SessionDocumentRollupTypedTimeSeries = void 0;
const SessionTimeSeriesBase_1 = require("./SessionTimeSeriesBase");
const TypedTimeSeriesRollupEntry_1 = require("./TimeSeries/TypedTimeSeriesRollupEntry");
const TypeUtil_1 = require("../../Utility/TypeUtil");
class SessionDocumentRollupTypedTimeSeries extends SessionTimeSeriesBase_1.SessionTimeSeriesBase {
    constructor(session, documentIdOrEntity, name, clazz) {
        super(session, documentIdOrEntity, name);
        this._clazz = clazz;
    }
    get(from, to, start = 0, pageSize = TypeUtil_1.TypeUtil.MAX_INT32) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._notInCache(from, to)) {
                const results = yield this.getTimeSeriesAndIncludes(from, to, null, start, pageSize);
                return results.map(x => TypedTimeSeriesRollupEntry_1.TypedTimeSeriesRollupEntry.fromEntry(x, this._clazz));
            }
            const results = yield this._getFromCache(from, to, null, start, pageSize);
            return results
                .map(x => TypedTimeSeriesRollupEntry_1.TypedTimeSeriesRollupEntry.fromEntry(x, this._clazz));
        });
    }
    append(entry) {
        const values = entry.getValuesFromMembers();
        this._appendInternal(entry.timestamp, values, entry.tag);
    }
}
exports.SessionDocumentRollupTypedTimeSeries = SessionDocumentRollupTypedTimeSeries;
