"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RavenCommandResponsePipeline = void 0;
const events_1 = require("events");
const Parser = require("stream-json/Parser");
const ObjectKeyCaseTransformStream_1 = require("../Mapping/Json/Streams/ObjectKeyCaseTransformStream");
const Conventions_1 = require("../Mapping/Json/Conventions");
const StreamUtil = require("../Utility/StreamUtil");
const stream = require("readable-stream");
const CollectResultStream_1 = require("../Mapping/Json/Streams/CollectResultStream");
const Exceptions_1 = require("../Exceptions");
const TransformKeysJsonStream_1 = require("../Mapping/Json/Streams/TransformKeysJsonStream");
const TransformJsonKeysProfiles_1 = require("../Mapping/Json/Streams/TransformJsonKeysProfiles");
const TypeUtil_1 = require("../Utility/TypeUtil");
const Asm = require("stream-json/Assembler");
const StringBuilder_1 = require("../Utility/StringBuilder");
class RavenCommandResponsePipeline extends events_1.EventEmitter {
    constructor() {
        super();
        this._body = new StringBuilder_1.StringBuilder();
        this._opts = {};
    }
    static create() {
        return new RavenCommandResponsePipeline();
    }
    parseJsonAsync(filters) {
        this._opts.jsonAsync = { filters };
        return this;
    }
    parseJsonSync() {
        this._opts.jsonSync = true;
        return this;
    }
    collectBody(callback) {
        this._opts.collectBody = callback || true;
        return this;
    }
    jsonKeysTransform(optsOrProfile, conventions) {
        if (!this._opts.jsonAsync) {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Cannot use transformKeys without doing parseJsonAsync() first.");
        }
        if (!optsOrProfile) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Must provide transform opts or profile name.");
        }
        if (TypeUtil_1.TypeUtil.isString(optsOrProfile)) {
            this._opts.transformKeys = (0, TransformJsonKeysProfiles_1.getTransformJsonKeysProfile)(optsOrProfile, conventions);
        }
        else {
            this._opts.transformKeys = optsOrProfile;
        }
        return this;
    }
    objectKeysTransform(optsOrTransform, profile) {
        if (!this._opts.jsonAsync && !this._opts.jsonSync) {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Cannot use key case transform without doing parseJson() or parseJsonAsync() first.");
        }
        if (!optsOrTransform || typeof optsOrTransform === "string") {
            this._opts.streamKeyCaseTransform =
                (0, Conventions_1.getObjectKeyCaseTransformProfile)(optsOrTransform, profile);
        }
        else {
            this._opts.streamKeyCaseTransform = optsOrTransform;
        }
        if (this._opts.jsonAsync) {
            this._opts.streamKeyCaseTransform.handleKeyValue = true;
        }
        return this;
    }
    collectResult(optsOrReduce, init) {
        if (typeof optsOrReduce === "function") {
            this._opts.collectResult = { reduceResults: optsOrReduce, initResult: init };
        }
        else {
            this._opts.collectResult = optsOrReduce;
        }
        return this;
    }
    stream(src, dst, callback) {
        const streams = this._buildUp(src);
        if (dst) {
            streams.push(dst);
        }
        return stream.pipeline(...streams, TypeUtil_1.TypeUtil.NOOP);
    }
    _appendBody(s) {
        this._body.append(s.toString());
    }
    _buildUp(src) {
        if (!src) {
            (0, Exceptions_1.throwError)("MappingError", "Body stream cannot be null.");
        }
        const opts = this._opts;
        const streams = [src];
        if (opts.collectBody) {
        }
        if (opts.jsonAsync) {
            const parser = new Parser({ streamValues: false });
            streams.push(parser);
            if (opts.jsonAsync.filters && opts.jsonAsync.filters.length) {
                streams.push(...opts.jsonAsync.filters);
            }
        }
        else if (opts.jsonSync) {
            const bytesChunks = [];
            const parseJsonSyncTransform = new stream.Transform({
                readableObjectMode: true,
                transform(chunk, enc, callback) {
                    bytesChunks.push(chunk);
                    callback();
                },
                flush(callback) {
                    let str = null;
                    try {
                        str = Buffer.concat(bytesChunks).toString('utf-8');
                    }
                    catch (err) {
                        callback((0, Exceptions_1.getError)("InvalidDataException", `Failed to concat / decode server response`, err));
                        return;
                    }
                    try {
                        callback(null, JSON.parse(str));
                    }
                    catch (err) {
                        callback((0, Exceptions_1.getError)("InvalidOperationException", `Error parsing response: '${str}'.`, err));
                    }
                }
            });
            streams.push(parseJsonSyncTransform);
        }
        if (opts.streamKeyCaseTransform) {
            const handlePath = !!opts.jsonAsync;
            const keyCaseOpts = Object.assign({}, opts.streamKeyCaseTransform, { handlePath });
            streams.push(new ObjectKeyCaseTransformStream_1.ObjectKeyCaseTransformStream(keyCaseOpts));
        }
        if (opts.transformKeys) {
            streams.push(new TransformKeysJsonStream_1.TransformKeysJsonStream(opts.transformKeys));
        }
        return streams;
    }
    process(src) {
        const streams = this._buildUp(src);
        const opts = this._opts;
        let resultPromise;
        if (opts.jsonAsync) {
            const asm = Asm.connectTo(streams[streams.length - 1]);
            resultPromise = new Promise(resolve => {
                asm.on("done", asm => resolve(asm.current));
            });
        }
        else {
            const collectResultOpts = !opts.collectResult || !opts.collectResult.reduceResults
                ? { reduceResults: CollectResultStream_1.lastChunk } : opts.collectResult;
            const collectResult = new CollectResultStream_1.CollectResultStream(collectResultOpts);
            streams.push(collectResult);
            resultPromise = collectResult.promise;
        }
        if (opts.collectBody) {
        }
        return StreamUtil.pipelineAsync(...streams)
            .then(() => resultPromise);
    }
}
exports.RavenCommandResponsePipeline = RavenCommandResponsePipeline;
