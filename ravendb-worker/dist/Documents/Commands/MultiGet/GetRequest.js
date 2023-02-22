"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetRequest = void 0;
class GetRequest {
    constructor() {
        this._canCacheAggressively = true;
        this._headers = {};
    }
    get urlAndQuery() {
        if (!this._query) {
            return this._url;
        }
        if (this._query[0] === "?") {
            return this._url + this._query;
        }
        return this._url + "?" + this._query;
    }
    get url() {
        return this._url;
    }
    set url(url) {
        this._url = url;
    }
    get headers() {
        return this._headers;
    }
    set headers(headers) {
        this._headers = headers;
    }
    get query() {
        return this._query;
    }
    set query(query) {
        this._query = query;
    }
    get method() {
        return this._method;
    }
    set method(method) {
        this._method = method;
    }
    get body() {
        return this._content;
    }
    set body(content) {
        this._content = content;
    }
    get canCacheAggressively() {
        return this._canCacheAggressively;
    }
    set canCacheAggressively(value) {
        this._canCacheAggressively = value;
    }
}
exports.GetRequest = GetRequest;