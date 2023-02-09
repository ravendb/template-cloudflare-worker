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
exports.CounterBatchCommand = exports.CounterBatchOperation = void 0;
const RavenCommand_1 = require("../../../Http/RavenCommand");
const Exceptions_1 = require("../../../Exceptions");
class CounterBatchOperation {
    constructor(counterBatch) {
        this._counterBatch = counterBatch;
    }
    get resultType() {
        return "CommandResult";
    }
    getCommand(store, conventions, cache) {
        return new CounterBatchCommand(this._counterBatch);
    }
}
exports.CounterBatchOperation = CounterBatchOperation;
class CounterBatchCommand extends RavenCommand_1.RavenCommand {
    constructor(counterBatch) {
        super();
        if (!counterBatch) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "CounterBatch cannot be null.");
        }
        this._counterBatch = counterBatch;
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + node.database + "/counters";
        const body = JSON.stringify(this._counterBatch.serialize());
        return {
            method: "POST",
            uri,
            body,
            headers: this._headers().typeAppJson().build()
        };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!bodyStream) {
                return;
            }
            return yield this._parseResponseDefaultAsync(bodyStream);
        });
    }
    get isReadRequest() {
        return false;
    }
}
exports.CounterBatchCommand = CounterBatchCommand;
