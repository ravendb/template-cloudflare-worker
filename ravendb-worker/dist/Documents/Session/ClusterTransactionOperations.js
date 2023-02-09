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
exports.ClusterTransactionOperations = void 0;
const ClusterTransactionOperationsBase_1 = require("./ClusterTransactionOperationsBase");
const TypeUtil_1 = require("../../Utility/TypeUtil");
const LazyClusterTransactionOperations_1 = require("./Operations/Lazy/LazyClusterTransactionOperations");
class ClusterTransactionOperations extends ClusterTransactionOperationsBase_1.ClusterTransactionOperationsBase {
    constructor(session) {
        super(session);
    }
    get lazily() {
        return new LazyClusterTransactionOperations_1.LazyClusterTransactionOperations(this._session);
    }
    getCompareExchangeValue(key, type) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._getCompareExchangeValueInternal(key, type);
        });
    }
    getCompareExchangeValues(keysOrStartsWith, type, start, pageSize) {
        if (TypeUtil_1.TypeUtil.isArray(keysOrStartsWith)) {
            return this._getCompareExchangeValuesInternal(keysOrStartsWith, type);
        }
        else {
            return this._getCompareExchangeValuesInternal(keysOrStartsWith, type, start !== null && start !== void 0 ? start : 0, pageSize !== null && pageSize !== void 0 ? pageSize : 25);
        }
    }
}
exports.ClusterTransactionOperations = ClusterTransactionOperations;
