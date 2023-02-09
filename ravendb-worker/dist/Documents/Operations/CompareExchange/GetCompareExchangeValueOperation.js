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
exports.GetCompareExchangeValueCommand = exports.GetCompareExchangeValueOperation = void 0;
const RavenCommand_1 = require("../../../Http/RavenCommand");
const Exceptions_1 = require("../../../Exceptions");
const CompareExchangeValueResultParser_1 = require("./CompareExchangeValueResultParser");
class GetCompareExchangeValueOperation {
    constructor(key, clazz, materializeMetadata = true) {
        this._key = key;
        this._clazz = clazz;
        this._materializeMetadata = materializeMetadata;
    }
    getCommand(store, conventions, cache) {
        return new GetCompareExchangeValueCommand(this._key, this._materializeMetadata, conventions, this._clazz);
    }
    get resultType() {
        return "CommandResult";
    }
}
exports.GetCompareExchangeValueOperation = GetCompareExchangeValueOperation;
class GetCompareExchangeValueCommand extends RavenCommand_1.RavenCommand {
    constructor(key, materializeMetadata, conventions, clazz) {
        super();
        if (!key) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "The key argument must have value");
        }
        this._key = key;
        this._clazz = clazz;
        this._materializeMetadata = materializeMetadata;
        this._conventions = conventions;
    }
    get isReadRequest() {
        return true;
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + node.database + "/cmpxchg?key=" + encodeURIComponent(this._key);
        return { uri };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!bodyStream) {
                return null;
            }
            let body = null;
            const results = yield this._pipeline()
                .collectBody(x => body = x)
                .parseJsonAsync()
                .jsonKeysTransform("GetCompareExchangeValue", this._conventions)
                .process(bodyStream);
            this.result = CompareExchangeValueResultParser_1.CompareExchangeValueResultParser.getValue(results, this._materializeMetadata, this._conventions, this._clazz);
            return body;
        });
    }
}
exports.GetCompareExchangeValueCommand = GetCompareExchangeValueCommand;
