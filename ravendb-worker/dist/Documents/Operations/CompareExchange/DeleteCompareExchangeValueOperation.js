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
exports.RemoveCompareExchangeCommand = exports.DeleteCompareExchangeValueOperation = void 0;
const CompareExchangeResult_1 = require("./CompareExchangeResult");
const RavenCommand_1 = require("../../../Http/RavenCommand");
const Exceptions_1 = require("../../../Exceptions");
const RaftIdGenerator_1 = require("../../../Utility/RaftIdGenerator");
class DeleteCompareExchangeValueOperation {
    constructor(key, index, clazz) {
        this._key = key;
        this._index = index;
        this._clazz = clazz;
    }
    getCommand(store, conventions, cache) {
        return new RemoveCompareExchangeCommand(this._key, this._index, conventions, this._clazz);
    }
    get resultType() {
        return "CommandResult";
    }
}
exports.DeleteCompareExchangeValueOperation = DeleteCompareExchangeValueOperation;
class RemoveCompareExchangeCommand extends RavenCommand_1.RavenCommand {
    constructor(key, index, conventions, clazz) {
        super();
        if (!key) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "The key argument must have value.");
        }
        this._clazz = clazz;
        this._key = key;
        this._index = index;
        this._conventions = conventions;
    }
    get isReadRequest() {
        return true;
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + node.database + "/cmpxchg?key=" + encodeURIComponent(this._key)
            + "&index=" + this._index;
        return {
            method: "DELETE",
            uri
        };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            let body = null;
            const resObj = yield this._pipeline()
                .collectBody(_ => body = _)
                .parseJsonAsync()
                .jsonKeysTransform("CompareExchangeValue", this._conventions)
                .process(bodyStream);
            this.result = CompareExchangeResult_1.CompareExchangeResult.parseFromObject(resObj, this._conventions, this._clazz);
            return body;
        });
    }
    getRaftUniqueRequestId() {
        return RaftIdGenerator_1.RaftIdGenerator.newId();
    }
}
exports.RemoveCompareExchangeCommand = RemoveCompareExchangeCommand;
