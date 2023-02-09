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
exports.GetCompareExchangeValuesCommand = exports.GetCompareExchangeValuesOperation = void 0;
const Exceptions_1 = require("../../../Exceptions");
const RavenCommand_1 = require("../../../Http/RavenCommand");
const CompareExchangeValueResultParser_1 = require("./CompareExchangeValueResultParser");
const StringBuilder_1 = require("../../../Utility/StringBuilder");
const TypeUtil_1 = require("../../../Utility/TypeUtil");
class GetCompareExchangeValuesOperation {
    constructor(parameters) {
        this._clazz = parameters.clazz;
        this._materializeMetadata = parameters.materializeMetadata || true;
        if (parameters.keys) {
            if (!parameters.keys.length) {
                (0, Exceptions_1.throwError)("InvalidArgumentException", "Keys cannot be an empty array.");
            }
            this._keys = parameters.keys;
        }
        else if (!TypeUtil_1.TypeUtil.isNullOrUndefined(parameters.startWith)) {
            this._startWith = parameters.startWith;
            this._start = parameters.start;
            this._pageSize = parameters.pageSize;
        }
        else {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Please specify at least keys or startWith parameter");
        }
    }
    get keys() {
        return this._keys;
    }
    get startWith() {
        return this._startWith;
    }
    get start() {
        return this._start;
    }
    get pageSize() {
        return this._pageSize;
    }
    get clazz() {
        return this._clazz;
    }
    getCommand(store, conventions, cache) {
        return new GetCompareExchangeValuesCommand(this, this._materializeMetadata, conventions);
    }
    get resultType() {
        return "CommandResult";
    }
}
exports.GetCompareExchangeValuesOperation = GetCompareExchangeValuesOperation;
class GetCompareExchangeValuesCommand extends RavenCommand_1.RavenCommand {
    constructor(operation, materializeMetadata, conventions) {
        super();
        this._operation = operation;
        this._materializeMetadata = materializeMetadata;
        this._conventions = conventions;
    }
    get isReadRequest() {
        return true;
    }
    createRequest(node) {
        const pathBuilder = new StringBuilder_1.StringBuilder(node.url);
        pathBuilder.append("/databases/")
            .append(node.database)
            .append("/cmpxchg?");
        if (this._operation.keys) {
            for (const key of this._operation.keys) {
                pathBuilder.append("&key=").append(encodeURIComponent(key));
            }
        }
        else {
            if (this._operation.startWith) {
                pathBuilder.append("&startsWith=")
                    .append(encodeURIComponent(this._operation.startWith));
            }
            if (this._operation.start) {
                pathBuilder.append("&start=")
                    .append(this._operation.start);
            }
            if (this._operation.pageSize) {
                pathBuilder.append("&pageSize=")
                    .append(this._operation.pageSize);
            }
        }
        const uri = pathBuilder.toString();
        return { uri };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            let body = null;
            if (!bodyStream) {
                this.result = {};
                return body;
            }
            const results = yield this._pipeline()
                .collectBody(b => body = b)
                .parseJsonAsync()
                .jsonKeysTransform("GetCompareExchangeValue", this._conventions)
                .process(bodyStream);
            this.result = CompareExchangeValueResultParser_1.CompareExchangeValueResultParser.getValues(results, this._materializeMetadata, this._conventions, this._operation.clazz);
            return body;
        });
    }
}
exports.GetCompareExchangeValuesCommand = GetCompareExchangeValuesCommand;
