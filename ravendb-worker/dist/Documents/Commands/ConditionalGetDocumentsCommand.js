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
exports.ConditionalGetDocumentsCommand = void 0;
const RavenCommand_1 = require("../../Http/RavenCommand");
const StatusCode_1 = require("../../Http/StatusCode");
const StreamUtil_1 = require("../../Utility/StreamUtil");
const RavenCommandResponsePipeline_1 = require("../../Http/RavenCommandResponsePipeline");
const ObjectUtil_1 = require("../../Utility/ObjectUtil");
const Constants_1 = require("../../Constants");
class ConditionalGetDocumentsCommand extends RavenCommand_1.RavenCommand {
    constructor(id, changeVector, conventions) {
        super();
        this._changeVector = changeVector;
        this._id = id;
        this._conventions = conventions;
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + node.database + "/docs?id=" + this._urlEncode(this._id);
        return {
            uri,
            method: "GET",
            headers: {
                [Constants_1.HEADERS.IF_NONE_MATCH]: `"${this._changeVector}"`
            }
        };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!bodyStream) {
                this.result = null;
                return;
            }
            let body = null;
            this.result =
                yield ConditionalGetDocumentsCommand.parseDocumentsResultResponseAsync(bodyStream, this._conventions, b => body = b);
            return body;
        });
    }
    static parseDocumentsResultResponseAsync(bodyStream, conventions, bodyCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            const body = yield (0, StreamUtil_1.readToEnd)(bodyStream);
            bodyCallback === null || bodyCallback === void 0 ? void 0 : bodyCallback(body);
            let parsedJson;
            if (body.length > conventions.syncJsonParseLimit) {
                const bodyStreamCopy = (0, StreamUtil_1.stringToReadable)(body);
                parsedJson = yield RavenCommandResponsePipeline_1.RavenCommandResponsePipeline.create()
                    .parseJsonAsync()
                    .process(bodyStreamCopy);
            }
            else {
                parsedJson = JSON.parse(body);
            }
            return ConditionalGetDocumentsCommand._mapToLocalObject(parsedJson, conventions);
        });
    }
    static _mapToLocalObject(json, conventions) {
        return {
            results: json.Results.map(x => ObjectUtil_1.ObjectUtil.transformDocumentKeys(x, conventions)),
            changeVector: json.ChangeVector
        };
    }
    processResponse(cache, response, bodyStream, url) {
        const _super = Object.create(null, {
            processResponse: { get: () => super.processResponse }
        });
        return __awaiter(this, void 0, void 0, function* () {
            if (response.status === StatusCode_1.StatusCodes.NotModified) {
                return "Automatic";
            }
            const result = yield _super.processResponse.call(this, cache, response, bodyStream, url);
            this.result.changeVector = response.headers.get("ETag");
            return result;
        });
    }
    get isReadRequest() {
        return false;
    }
}
exports.ConditionalGetDocumentsCommand = ConditionalGetDocumentsCommand;
