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
exports.GetIndexesCommand = exports.GetIndexesOperation = void 0;
const RavenCommand_1 = require("../../../Http/RavenCommand");
const IndexDefinition_1 = require("../../Indexes/IndexDefinition");
class GetIndexesOperation {
    constructor(start, pageSize) {
        this._start = start;
        this._pageSize = pageSize;
    }
    getCommand(conventions) {
        return new GetIndexesCommand(this._start, this._pageSize, conventions);
    }
    get resultType() {
        return "CommandResult";
    }
}
exports.GetIndexesOperation = GetIndexesOperation;
const indexDefTypeInfo = {
    nestedTypes: {
        "results[]": "IndexDefinition",
        "results[].maps": "Set"
    },
};
const knownTypes = new Map([[IndexDefinition_1.IndexDefinition.name, IndexDefinition_1.IndexDefinition]]);
class GetIndexesCommand extends RavenCommand_1.RavenCommand {
    constructor(start, pageSize, conventions) {
        super();
        this._start = start;
        this._pageSize = pageSize;
        this._conventions = conventions;
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + node.database
            + "/indexes?start=" + this._start + "&pageSize=" + this._pageSize;
        return { uri };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!bodyStream) {
                this._throwInvalidResponse();
            }
            let body = null;
            const result = yield this._pipeline()
                .collectBody(b => body = b)
                .parseJsonSync()
                .objectKeysTransform({
                defaultTransform: "camel",
                ignorePaths: [/fields\.[^.]+$/i, /results\.\[]\.configuration\./i]
            })
                .process(bodyStream);
            this.result = this._reviveResultTypes(result, this._conventions, indexDefTypeInfo, knownTypes)["results"];
            return body;
        });
    }
    get isReadRequest() {
        return true;
    }
}
exports.GetIndexesCommand = GetIndexesCommand;
