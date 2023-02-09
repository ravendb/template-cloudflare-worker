"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamOperation = void 0;
const QueryStreamCommand_1 = require("../../Commands/QueryStreamCommand");
const Exceptions_1 = require("../../../Exceptions");
const StreamCommand_1 = require("../../Commands/StreamCommand");
const TypeUtil_1 = require("../../../Utility/TypeUtil");
const StreamValues_1 = require("stream-json/streamers/StreamValues");
const Ignore_1 = require("stream-json/filters/Ignore");
const RavenCommandResponsePipeline_1 = require("../../../Http/RavenCommandResponsePipeline");
const Pipelines_1 = require("../../../Mapping/Json/Streams/Pipelines");
const TransformKeysJsonStream_1 = require("../../../Mapping/Json/Streams/TransformKeysJsonStream");
const TransformJsonKeysProfiles_1 = require("../../../Mapping/Json/Streams/TransformJsonKeysProfiles");
const StringBuilder_1 = require("../../../Utility/StringBuilder");
class StreamOperation {
    constructor(session) {
        this._session = session;
    }
    createRequest(idPrefixOrQuery, opts) {
        if (TypeUtil_1.TypeUtil.isString(idPrefixOrQuery)) {
            return this._createRequestForIdPrefix(idPrefixOrQuery, opts);
        }
        return this._createRequestForQuery(idPrefixOrQuery);
    }
    _createRequestForQuery(query) {
        if (!query) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Query cannot be null.");
        }
        this._isQueryStream = true;
        if (query.waitForNonStaleResults) {
            (0, Exceptions_1.throwError)("NotSupportedException", "Since stream() does not wait for indexing (by design), "
                + " streaming query with waitForNonStaleResults is not supported");
        }
        this._session.incrementRequestCount();
        return new QueryStreamCommand_1.QueryStreamCommand(this._session.conventions, query);
    }
    _createRequestForIdPrefix(idPrefix, opts) {
        const sb = new StringBuilder_1.StringBuilder("streams/docs?");
        if (idPrefix) {
            sb.append("startsWith=")
                .append(encodeURIComponent(idPrefix)).append("&");
        }
        if (opts) {
            if ("matches" in opts) {
                sb.append("matches=")
                    .append(encodeURIComponent(opts.matches)).append("&");
            }
            if ("exclude" in opts) {
                sb.append("exclude=")
                    .append(encodeURIComponent(opts.exclude)).append("&");
            }
            if ("startAfter" in opts) {
                sb.append("startAfter=")
                    .append(encodeURIComponent(opts.startAfter)).append("&");
            }
            if ("start" in opts) {
                sb.append("start=").append(opts.start).append("&");
            }
            if ("pageSize" in opts && opts.pageSize !== Number.MAX_VALUE) {
                sb.append("pageSize=").append(opts.pageSize).append("&");
            }
        }
        return new StreamCommand_1.StreamCommand(sb.toString());
    }
    setResult(response) {
        if (!response) {
            (0, Exceptions_1.throwError)("IndexDoesNotExistException", "The index does not exists, failed to stream results.");
        }
        const result = (0, Pipelines_1.getDocumentResultsAsObjects)(this._session.conventions).stream(response.stream);
        if (this._isQueryStream) {
            RavenCommandResponsePipeline_1.RavenCommandResponsePipeline.create()
                .parseJsonAsync([
                (0, Ignore_1.ignore)({ filter: /^Results|Includes$/ }),
                new TransformKeysJsonStream_1.TransformKeysJsonStream((0, TransformJsonKeysProfiles_1.getTransformJsonKeysProfile)("CommandResponsePayload")),
                (0, StreamValues_1.streamValues)()
            ])
                .stream(response.stream)
                .on("error", err => result.emit("error", err))
                .on("data", data => {
                const statsResult = this._session.conventions.objectMapper
                    .fromObjectLiteral(data["value"], {
                    nestedTypes: {
                        indexTimestamp: "date"
                    }
                });
                result.emit("stats", statsResult);
            });
        }
        result.on("newListener", (event, listener) => {
            if (event === "data") {
                response.stream.resume();
            }
        });
        return result;
    }
}
exports.StreamOperation = StreamOperation;
