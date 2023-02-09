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
exports.SessionDocumentTimeSeries = void 0;
const SessionTimeSeriesBase_1 = require("./SessionTimeSeriesBase");
const TypeUtil_1 = require("../../Utility/TypeUtil");
class SessionDocumentTimeSeries extends SessionTimeSeriesBase_1.SessionTimeSeriesBase {
    constructor(session, documentIdOrEntity, name) {
        super(session, documentIdOrEntity, name);
    }
    get(startOrFrom, toOrPageSize, startOrIncludes, startOrPageSize, pageSize) {
        if (TypeUtil_1.TypeUtil.isNullOrUndefined(startOrFrom)) {
            return this._getInternal(null, null, null, 0, TypeUtil_1.TypeUtil.MAX_INT32);
        }
        else if (TypeUtil_1.TypeUtil.isNumber(startOrFrom)) {
            return this._getInternal(null, null, null, startOrFrom, toOrPageSize);
        }
        else if (TypeUtil_1.TypeUtil.isFunction(startOrIncludes)) {
            return this._getInternal(startOrFrom, toOrPageSize, startOrIncludes, startOrPageSize, pageSize);
        }
        else if (TypeUtil_1.TypeUtil.isNumber(startOrIncludes)) {
            return this._getInternal(startOrFrom, toOrPageSize, null, startOrPageSize, pageSize);
        }
        else {
            return this._getInternal(startOrFrom, toOrPageSize, null, 0, TypeUtil_1.TypeUtil.MAX_INT32);
        }
    }
    _getInternal(from, to, includes, start, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._notInCache(from, to)) {
                return this.getTimeSeriesAndIncludes(from, to, includes, start, pageSize);
            }
            const resultsToUser = yield this._serveFromCache(from, to, start, pageSize, includes);
            if (!resultsToUser) {
                return null;
            }
            return resultsToUser.slice(0, pageSize);
        });
    }
    append(timestamp, valueOrValues, tag) {
        return this._appendInternal(timestamp, valueOrValues, tag);
    }
}
exports.SessionDocumentTimeSeries = SessionDocumentTimeSeries;
