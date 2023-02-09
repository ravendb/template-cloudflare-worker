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
exports.LazyGetCompareExchangeValuesOperation = void 0;
const Exceptions_1 = require("../../../../Exceptions");
const TypeUtil_1 = require("../../../../Utility/TypeUtil");
const GetRequest_1 = require("../../../Commands/MultiGet/GetRequest");
const StringUtil_1 = require("../../../../Utility/StringUtil");
const RavenCommandResponsePipeline_1 = require("../../../../Http/RavenCommandResponsePipeline");
const CompareExchangeValueResultParser_1 = require("../../../Operations/CompareExchange/CompareExchangeValueResultParser");
const StreamUtil_1 = require("../../../../Utility/StreamUtil");
const StringBuilder_1 = require("../../../../Utility/StringBuilder");
class LazyGetCompareExchangeValuesOperation {
    constructor(clusterSession, clazz, conventions, keysOrStartsWith, start, pageSize) {
        if (!clusterSession) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "ClusterSession cannot be null");
        }
        if (!conventions) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Conventions cannot be null");
        }
        this._clusterSession = clusterSession;
        this._clazz = clazz;
        this._conventions = conventions;
        if (TypeUtil_1.TypeUtil.isArray(keysOrStartsWith)) {
            this._keys = keysOrStartsWith;
            this._start = 0;
            this._pageSize = 0;
            this._startsWith = null;
        }
        else {
            this._startsWith = keysOrStartsWith;
            this._start = start;
            this._pageSize = pageSize;
            this._keys = null;
        }
    }
    get result() {
        return this._result;
    }
    get queryResult() {
        (0, Exceptions_1.throwError)("NotImplementedException");
        return null;
    }
    get requiresRetry() {
        return this._requiresRetry;
    }
    createRequest() {
        let pathBuilder;
        if (this._keys) {
            for (const key of this._keys) {
                if (this._clusterSession.isTracked(key)) {
                    continue;
                }
                if (!pathBuilder) {
                    pathBuilder = new StringBuilder_1.StringBuilder("?");
                }
                pathBuilder.append("&key=").append(encodeURIComponent(key));
            }
        }
        else {
            pathBuilder = new StringBuilder_1.StringBuilder("?");
            if (StringUtil_1.StringUtil.isNullOrEmpty(this._startsWith)) {
                pathBuilder.append("&startsWith=").append(encodeURIComponent(this._startsWith));
            }
            pathBuilder.append("&start=").append((this._start || 0).toString());
            pathBuilder.append("&pageSize=").append((this._pageSize || 0).toString());
        }
        if (!pathBuilder) {
            this._result = this._clusterSession.getCompareExchangeValuesFromSessionInternal(this._keys, TypeUtil_1.TypeUtil.NOOP, this._clazz);
            return null;
        }
        const request = new GetRequest_1.GetRequest();
        request.url = "/cmpxchg";
        request.method = "GET";
        request.query = pathBuilder.toString();
        return request;
    }
    handleResponseAsync(response) {
        return __awaiter(this, void 0, void 0, function* () {
            if (response.forceRetry) {
                this._result = null;
                this._requiresRetry = true;
                return;
            }
            if (response.result) {
                const results = yield RavenCommandResponsePipeline_1.RavenCommandResponsePipeline.create()
                    .parseJsonAsync()
                    .jsonKeysTransform("GetCompareExchangeValue", this._conventions)
                    .process((0, StreamUtil_1.stringToReadable)(response.result));
                if (this._clusterSession.session.noTracking) {
                    const result = {};
                    for (const kvp of Object.entries(CompareExchangeValueResultParser_1.CompareExchangeValueResultParser.getValues(results, false, this._conventions))) {
                        if (!kvp[1].value) {
                            result[kvp[0]] = this._clusterSession.registerMissingCompareExchangeValue(kvp[0]).getValue(this._clazz, this._conventions);
                            continue;
                        }
                        result[kvp[0]] = this._clusterSession.registerCompareExchangeValue(kvp[1]).getValue(this._clazz, this._conventions);
                    }
                    this._result = result;
                    return;
                }
                for (const kvp of Object.entries(CompareExchangeValueResultParser_1.CompareExchangeValueResultParser.getValues(results, false, this._conventions))) {
                    if (!kvp[1]) {
                        continue;
                    }
                    this._clusterSession.registerCompareExchangeValue(kvp[1]);
                }
            }
            if (this._keys) {
                for (const key of this._keys) {
                    if (this._clusterSession.isTracked(key)) {
                        continue;
                    }
                    this._clusterSession.registerMissingCompareExchangeValue(key);
                }
            }
            this._result = this._clusterSession.getCompareExchangeValuesFromSessionInternal(this._keys, TypeUtil_1.TypeUtil.NOOP, this._clazz);
        });
    }
}
exports.LazyGetCompareExchangeValuesOperation = LazyGetCompareExchangeValuesOperation;
