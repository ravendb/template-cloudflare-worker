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
exports.OperationCompletionAwaiter = void 0;
const BluebirdPromise = require("bluebird");
const GetOperationStateOperation_1 = require("./GetOperationStateOperation");
const Exceptions_1 = require("../../Exceptions");
const Exceptions_2 = require("../../Exceptions");
class OperationCompletionAwaiter {
    constructor(requestExecutor, conventions, id, nodeTag) {
        this._requestExecutor = requestExecutor;
        this._conventions = conventions;
        this._id = id;
        this._nodeTag = nodeTag;
    }
    get id() {
        return this._id;
    }
    _fetchOperationStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            const command = this._getOperationStateCommand(this._conventions, this._id, this._nodeTag);
            yield this._requestExecutor.execute(command);
            return command.result;
        });
    }
    _getOperationStateCommand(conventions, id, nodeTag) {
        return new GetOperationStateOperation_1.GetOperationStateCommand(this._id, nodeTag);
    }
    get nodeTag() {
        return this._nodeTag;
    }
    set nodeTag(nodeTag) {
        this._nodeTag = nodeTag;
    }
    waitForCompletion() {
        const operationStatusPolling = () => {
            return BluebirdPromise.resolve()
                .then(() => this._fetchOperationStatus())
                .then((operationStatusResult) => {
                const operationStatus = operationStatusResult.status;
                switch (operationStatus) {
                    case "Completed":
                        return;
                    case "Canceled":
                        (0, Exceptions_1.throwError)("OperationCanceledException", `Operation of ID ${this._id} has been canceled.`);
                        break;
                    case "Faulted": {
                        const faultResult = operationStatusResult.result;
                        const errorSchema = Object.assign({}, faultResult, { url: this._requestExecutor.getUrl() });
                        throw Exceptions_2.ExceptionDispatcher.get(errorSchema, faultResult.statusCode);
                    }
                }
                return BluebirdPromise.delay(500)
                    .then(() => operationStatusPolling());
            });
        };
        return Promise.resolve(operationStatusPolling());
    }
}
exports.OperationCompletionAwaiter = OperationCompletionAwaiter;
