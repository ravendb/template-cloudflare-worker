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
exports.LazyGetCompareExchangeValueOperation = void 0;
const Exceptions_1 = require("../../../../Exceptions");
const GetRequest_1 = require("../../../Commands/MultiGet/GetRequest");
const TypeUtil_1 = require("../../../../Utility/TypeUtil");
const RavenCommandResponsePipeline_1 = require("../../../../Http/RavenCommandResponsePipeline");
const StreamUtil_1 = require("../../../../Utility/StreamUtil");
const CompareExchangeValueResultParser_1 = require("../../../Operations/CompareExchange/CompareExchangeValueResultParser");
class LazyGetCompareExchangeValueOperation {
    constructor(clusterSession, clazz, conventions, key) {
        if (!clusterSession) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Cluster Session cannot be null");
        }
        if (!conventions) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Conventions cannot be null");
        }
        if (!key) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Key cannot be null");
        }
        this._clusterSession = clusterSession;
        this._clazz = clazz;
        this._conventions = conventions;
        this._key = key;
    }
    get result() {
        return this._result;
    }
    get queryResult() {
        (0, Exceptions_1.throwError)("NotImplementedException", "Not implemented");
        return null;
    }
    get requiresRetry() {
        return this._requiresRetry;
    }
    createRequest() {
        if (this._clusterSession.isTracked(this._key)) {
            this._result = this._clusterSession.getCompareExchangeValueFromSessionInternal(this._key, TypeUtil_1.TypeUtil.NOOP, this._clazz);
            return null;
        }
        const request = new GetRequest_1.GetRequest();
        request.url = "/cmpxchg";
        request.method = "GET";
        request.query = "?key=" + encodeURIComponent(this._key);
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
                const value = CompareExchangeValueResultParser_1.CompareExchangeValueResultParser.getValue(results, false, this._conventions, null);
                if (this._clusterSession.session.noTracking) {
                    if (!value) {
                        this._result = this._clusterSession.registerMissingCompareExchangeValue(this._key).getValue(this._clazz, this._conventions);
                        return;
                    }
                    this._result = this._clusterSession.registerCompareExchangeValue(value).getValue(this._clazz, this._conventions);
                    return;
                }
                if (value) {
                    this._clusterSession.registerCompareExchangeValue(value);
                }
            }
            if (!this._clusterSession.isTracked(this._key)) {
                this._clusterSession.registerMissingCompareExchangeValue(this._key);
            }
            this._result = this._clusterSession.getCompareExchangeValueFromSessionInternal(this._key, TypeUtil_1.TypeUtil.NOOP, this._clazz);
        });
    }
}
exports.LazyGetCompareExchangeValueOperation = LazyGetCompareExchangeValueOperation;
