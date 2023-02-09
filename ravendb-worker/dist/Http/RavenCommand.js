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
exports.RavenCommand = void 0;
const StatusCode_1 = require("../Http/StatusCode");
const stream = require("readable-stream");
const node_fetch_1 = require("node-fetch");
const LogUtil_1 = require("../Utility/LogUtil");
const Exceptions_1 = require("../Exceptions");
const HttpUtil_1 = require("../Utility/HttpUtil");
const Serializer_1 = require("../Mapping/Json/Serializer");
const RavenCommandResponsePipeline_1 = require("./RavenCommandResponsePipeline");
const StreamUtil_1 = require("../Utility/StreamUtil");
const log = (0, LogUtil_1.getLogger)({ module: "RavenCommand" });
class RavenCommand {
    constructor(copy) {
        this.failoverTopologyEtag = -2;
        if (copy instanceof RavenCommand) {
            this._canCache = copy._canCache;
            this._canCacheAggressively = copy._canCacheAggressively;
            this._selectedNodeTag = copy._selectedNodeTag;
            this._responseType = copy._responseType;
        }
        else {
            this._responseType = "Object";
            this._canCache = true;
            this._canCacheAggressively = true;
        }
    }
    get responseType() {
        return this._responseType;
    }
    get canCache() {
        return this._canCache;
    }
    get canCacheAggressively() {
        return this._canCacheAggressively;
    }
    get selectedNodeTag() {
        return this._selectedNodeTag;
    }
    get numberOfAttempts() {
        return this._numberOfAttempts;
    }
    set numberOfAttempts(value) {
        this._numberOfAttempts = value;
    }
    get _serializer() {
        return Serializer_1.JsonSerializer.getDefaultForCommandPayload();
    }
    setResponseFromCache(cachedValue) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!cachedValue) {
                this.result = null;
                return;
            }
            const readable = new stream.Readable();
            readable.push(cachedValue);
            readable.push(null);
            yield this.setResponseAsync(readable, true);
        });
    }
    _defaultPipeline(bodyCallback) {
        return this._pipeline()
            .parseJsonSync()
            .collectBody(bodyCallback)
            .objectKeysTransform("camel");
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._responseType === "Empty" || this._responseType === "Raw") {
                this._throwInvalidResponse();
            }
            return (0, Exceptions_1.throwError)("NotSupportedException", this.constructor.name +
                " command must override the setResponseAsync()" +
                " method which expects response with the following type: " +
                this._responseType);
        });
    }
    send(agent, requestOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            const { body, uri, fetcher } = requestOptions, restOptions = __rest(requestOptions, ["body", "uri", "fetcher"]);
            log.info(`Send command ${this.constructor.name} to ${uri}${body ? " with body " + body : ""}.`);
            if (requestOptions.agent) {
                agent = requestOptions.agent;
            }
            const optionsToUse = Object.assign(Object.assign({ body }, restOptions), { agent });
            const fetchFn = fetcher !== null && fetcher !== void 0 ? fetcher : node_fetch_1.default;
            const response = yield fetchFn(uri, optionsToUse);
            const text = yield response.text();
            return {
                response,
                bodyStream: (0, StreamUtil_1.stringToReadable)(text),
            };
        });
    }
    setResponseRaw(response, body) {
        (0, Exceptions_1.throwError)("NotSupportedException", "When _responseType is set to RAW then please override this method to handle the response.");
    }
    _urlEncode(value) {
        return encodeURIComponent(value);
    }
    static ensureIsNotNullOrEmpty(value, name) {
        if (!value) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", name + " cannot be null or empty");
        }
    }
    isFailedWithNode(node) {
        return this.failedNodes && !!this.failedNodes.get(node);
    }
    processResponse(cache, response, bodyStream, url) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!response) {
                return "Automatic";
            }
            if (this._responseType === "Empty" ||
                response.status === StatusCode_1.StatusCodes.NoContent) {
                return "Automatic";
            }
            try {
                if (this._responseType === "Object") {
                    const contentLength = parseInt(response.headers.get("content-length"), 10);
                    if (contentLength === 0) {
                        (0, HttpUtil_1.closeHttpResponse)(response);
                        return "Automatic";
                    }
                    const bodyPromise = this.setResponseAsync(bodyStream, false);
                    const body = yield bodyPromise;
                    if (cache) {
                    }
                    return "Automatic";
                }
                else {
                    const bodyPromise = this.setResponseAsync(bodyStream, false);
                    yield bodyPromise;
                }
                return "Automatic";
            }
            catch (err) {
                log.error(err, `Error processing command ${this.constructor.name} response.`);
                (0, Exceptions_1.throwError)("RavenException", `Error processing command ${this.constructor.name} response: ${err.stack}`, err);
            }
            finally {
                (0, HttpUtil_1.closeHttpResponse)(response);
            }
            return "Automatic";
        });
    }
    _cacheResponse(cache, url, response, responseJson) {
        return;
    }
    _addChangeVectorIfNotNull(changeVector, req) {
        if (changeVector) {
            req.headers["If-Match"] = `"${changeVector}"`;
        }
    }
    _reviveResultTypes(raw, conventions, typeInfo, knownTypes) {
        return conventions.objectMapper.fromObjectLiteral(raw, typeInfo, knownTypes);
    }
    _parseResponseDefaultAsync(bodyStream) {
        return __awaiter(this, void 0, void 0, function* () {
            let body = null;
            this.result = yield this._defaultPipeline((_) => (body = _)).process(bodyStream);
            return body;
        });
    }
    _headers() {
        return HttpUtil_1.HeadersBuilder.create();
    }
    _throwInvalidResponse() {
        (0, Exceptions_1.throwError)("InvalidOperationException", "Response is invalid");
    }
    static _throwInvalidResponse(cause) {
        (0, Exceptions_1.throwError)("InvalidOperationException", "Response is invalid: " + cause.message, cause);
    }
    onResponseFailure(response) { }
    _pipeline() {
        return RavenCommandResponsePipeline_1.RavenCommandResponsePipeline.create();
    }
}
exports.RavenCommand = RavenCommand;
