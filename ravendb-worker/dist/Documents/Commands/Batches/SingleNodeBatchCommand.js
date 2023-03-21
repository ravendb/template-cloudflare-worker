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
exports.SingleNodeBatchCommand = void 0;
const RavenCommand_1 = require("../../../Http/RavenCommand");
const index_1 = require("../../../Exceptions/index");
const PutAttachmentCommandData_1 = require("./PutAttachmentCommandData");
const HttpUtil_1 = require("../../../Utility/HttpUtil");
const Serializer_1 = require("../../../Mapping/Json/Serializer");
const LengthUnawareFormData_1 = require("../../../Utility/LengthUnawareFormData");
const RavenCommandResponsePipeline_1 = require("../../../Http/RavenCommandResponsePipeline");
const TimeUtil_1 = require("../../../Utility/TimeUtil");
const PutAttachmentCommandHelper_1 = require("./PutAttachmentCommandHelper");
const TypeUtil_1 = require("../../../Utility/TypeUtil");
class SingleNodeBatchCommand extends RavenCommand_1.RavenCommand {
    constructor(conventions, commands, options = null, mode = null) {
        super();
        this._commands = commands;
        this._conventions = conventions;
        this._options = options;
        this._mode = mode;
        if (!conventions) {
            (0, index_1.throwError)("InvalidArgumentException", "conventions cannot be null");
        }
        if (!commands) {
            (0, index_1.throwError)("InvalidArgumentException", "commands cannot be null");
        }
        for (const command of this._commands) {
            if (command instanceof PutAttachmentCommandData_1.PutAttachmentCommandData) {
                const putAttachmentCommandData = command;
                if (!this._attachmentStreams) {
                    this._attachmentStreams = new Set();
                }
                const { attStream } = putAttachmentCommandData;
                if (this._attachmentStreams.has(attStream)) {
                    PutAttachmentCommandHelper_1.PutAttachmentCommandHelper.throwStreamWasAlreadyUsed();
                }
                else {
                    this._attachmentStreams.add(attStream);
                }
            }
        }
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + node.database + "/bulk_docs?";
        const headers = HttpUtil_1.HeadersBuilder.create().typeAppJson().build();
        if (TypeUtil_1.TypeUtil.isNullOrUndefined(this._supportsAtomicWrites) || node.supportsAtomicClusterWrites !== this._supportsAtomicWrites) {
            this._supportsAtomicWrites = node.supportsAtomicClusterWrites;
        }
        const commandsArray = this._commands.map(x => {
            const serialized = x.serialize(this._conventions);
            if (!this._supportsAtomicWrites) {
                delete serialized["OriginalChangeVector"];
            }
            return serialized;
        });
        const body = Serializer_1.JsonSerializer.getDefault().serialize({
            Commands: commandsArray,
            TransactionMode: this._mode === "ClusterWide" ? "ClusterWide" : undefined
        });
        const queryString = this._appendOptions();
        const request = {
            method: "POST",
            uri: uri + queryString,
        };
        if (this._attachmentStreams && this._attachmentStreams.size > 0) {
            const attachments = [...this._attachmentStreams]
                .map(attStream => {
                return {
                    body: attStream,
                    headers: {
                        "Command-Type": "AttachmentStream"
                    }
                };
            });
            if (request.headers && "Content-Type" in request.headers) {
                const _a = request.headers, { "Content-Type": contentType } = _a, restHeaders = __rest(_a, ["Content-Type"]);
                request.headers = restHeaders;
            }
            const multipart = new LengthUnawareFormData_1.LengthUnawareFormData();
            multipart.append("main", body, { header: Object.assign(Object.assign({}, headers), { "Content-Type": "multipart/form-data" }) });
            for (let i = 0; i < attachments.length; i++) {
                multipart.append("attachment_" + i, attachments[i].body, { header: attachments[i].headers });
            }
            request.body = multipart;
        }
        else {
            request.body = body;
            request.headers = headers;
        }
        return request;
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!bodyStream) {
                (0, index_1.throwError)("InvalidOperationException", "Got null response from the server after doing a batch,"
                    + " something is very wrong. Probably a garbled response.");
            }
            let body = null;
            this.result = yield RavenCommandResponsePipeline_1.RavenCommandResponsePipeline.create()
                .collectBody(_ => body = _)
                .parseJsonSync()
                .objectKeysTransform({
                defaultTransform: "camel",
                ignoreKeys: [/^@/],
                ignorePaths: [/results\.\[\]\.modifiedDocument\./i],
            })
                .process(bodyStream);
            return body;
        });
    }
    _appendOptions() {
        if (!this._options) {
            return "";
        }
        let result = "";
        const replicationOptions = this._options.replicationOptions;
        if (replicationOptions) {
            result += `&waitForReplicasTimeout=${TimeUtil_1.TimeUtil.millisToTimeSpan(replicationOptions.timeout)}`;
            result += "&throwOnTimeoutInWaitForReplicas=" + (replicationOptions.throwOnTimeout ? "true" : "false");
            result += "&numberOfReplicasToWaitFor=";
            result += replicationOptions.majority ? "majority" : replicationOptions.replicas;
        }
        const indexOptions = this._options.indexOptions;
        if (indexOptions) {
            result += "&waitForIndexesTimeout=";
            result += TimeUtil_1.TimeUtil.millisToTimeSpan(indexOptions.timeout);
            if (indexOptions.throwOnTimeout) {
                result += "&waitForIndexThrow=true";
            }
            else {
                result += "&waitForIndexThrow=false";
            }
            if (indexOptions.indexes) {
                for (const specificIndex of indexOptions.indexes) {
                    result += "&waitForSpecificIndex=" + encodeURIComponent(specificIndex);
                }
            }
        }
        return result;
    }
    get isReadRequest() {
        return false;
    }
    dispose() {
    }
}
exports.SingleNodeBatchCommand = SingleNodeBatchCommand;
