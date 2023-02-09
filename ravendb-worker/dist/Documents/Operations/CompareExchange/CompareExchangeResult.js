"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompareExchangeResult = void 0;
const Exceptions_1 = require("../../../Exceptions");
const TypeUtil_1 = require("../../../Utility/TypeUtil");
const Constants_1 = require("../../../Constants");
class CompareExchangeResult {
    static parseFromObject({ index, value, successful }, conventions, clazz) {
        if (!index) {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Response is invalid. Index is missing");
        }
        const val = value.object || null;
        return CompareExchangeResult._create(val, index, successful, conventions, clazz);
    }
    static parseFromString(responseString, conventions, clazz) {
        const response = JSON.parse(responseString);
        const index = response["Index"];
        if (!index) {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Response is invalid. Index is missing");
        }
        const successful = response["Successful"];
        const raw = response["Value"];
        let val = null;
        if (raw) {
            val = raw[Constants_1.COMPARE_EXCHANGE.OBJECT_FIELD_NAME];
        }
        return CompareExchangeResult._create(val, index, successful, conventions, clazz);
    }
    static _create(val, index, successful, conventions, clazz) {
        if (clazz) {
            conventions.tryRegisterJsType(clazz);
        }
        if (!val) {
            const emptyExchangeResult = new CompareExchangeResult();
            emptyExchangeResult.index = index;
            emptyExchangeResult.value = null;
            emptyExchangeResult.successful = successful;
            return emptyExchangeResult;
        }
        let result;
        if (TypeUtil_1.TypeUtil.isPrimitive(val)) {
            result = val;
        }
        else {
            const entityType = conventions.getJsTypeByDocumentType(clazz);
            result = conventions.deserializeEntityFromJson(entityType, val);
        }
        const exchangeResult = new CompareExchangeResult();
        exchangeResult.index = index;
        exchangeResult.value = result;
        exchangeResult.successful = successful;
        return exchangeResult;
    }
}
exports.CompareExchangeResult = CompareExchangeResult;
