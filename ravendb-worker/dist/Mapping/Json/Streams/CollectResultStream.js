"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollectResultStream = exports.lastChunk = exports.lastValue = void 0;
const stream = require("readable-stream");
function lastValue(_, chunk) {
    return chunk["value"];
}
exports.lastValue = lastValue;
function lastChunk(_, chunk) {
    return chunk;
}
exports.lastChunk = lastChunk;
class CollectResultStream extends stream.Writable {
    constructor(opts) {
        super({ objectMode: true });
        this._resultIndex = 0;
        this._resultPromise = new Promise((resolve, reject) => {
            this._resolver = { resolve, reject };
        });
        super.once("finish", () => {
            this._resolver.resolve(this._result);
        });
        this._reduceResults = opts.reduceResults;
        this._result = opts.initResult || null;
    }
    get promise() {
        return this._resultPromise;
    }
    static collectArray(handleEmitPath) {
        return {
            initResult: [],
            reduceResults: (result, n) => [...result, handleEmitPath ? n.value : n]
        };
    }
    _write(chunk, enc, callback) {
        this._result = this._reduceResults(this._result, chunk, this._resultIndex);
        this._resultIndex++;
        callback();
    }
}
exports.CollectResultStream = CollectResultStream;