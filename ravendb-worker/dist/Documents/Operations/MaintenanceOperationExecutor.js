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
exports.MaintenanceOperationExecutor = void 0;
const OperationCompletionAwaiter_1 = require("./OperationCompletionAwaiter");
const ServerOperationExecutor_1 = require("./ServerOperationExecutor");
const Exceptions_1 = require("../../Exceptions");
class MaintenanceOperationExecutor {
    constructor(store, databaseName) {
        this._store = store;
        this._databaseName = databaseName || store.database;
    }
    get requestExecutor() {
        if (this._requestExecutor) {
            return this._requestExecutor;
        }
        this._requestExecutor = this._databaseName ? this._store.getRequestExecutor(this._databaseName) : null;
        return this.requestExecutor;
    }
    get server() {
        if (!this._serverOperationExecutor) {
            this._serverOperationExecutor = new ServerOperationExecutor_1.ServerOperationExecutor(this._store);
        }
        return this._serverOperationExecutor;
    }
    forDatabase(databaseName) {
        if (this._databaseName
            && this._databaseName.toLowerCase() === (databaseName || "").toLowerCase()) {
            return this;
        }
        return new MaintenanceOperationExecutor(this._store, databaseName);
    }
    send(operation) {
        return __awaiter(this, void 0, void 0, function* () {
            this._assertDatabaseNameSet();
            const command = operation.getCommand(this.requestExecutor.conventions);
            yield this.requestExecutor.execute(command);
            if (operation.resultType === "OperationId") {
                const idResult = command.result;
                return new OperationCompletionAwaiter_1.OperationCompletionAwaiter(this.requestExecutor, this.requestExecutor.conventions, idResult.operationId, command.selectedNodeTag || idResult.operationNodeTag);
            }
            return command.result;
        });
    }
    _assertDatabaseNameSet() {
        if (!this._databaseName) {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Cannot use maintenance without a database defined, did you forget to call forDatabase?");
        }
    }
}
exports.MaintenanceOperationExecutor = MaintenanceOperationExecutor;
