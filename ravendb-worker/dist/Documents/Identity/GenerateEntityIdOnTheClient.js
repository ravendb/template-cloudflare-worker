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
exports.GenerateEntityIdOnTheClient = void 0;
const Exceptions_1 = require("../../Exceptions");
const TypeUtil_1 = require("../../Utility/TypeUtil");
class GenerateEntityIdOnTheClient {
    constructor(conventions, generateId) {
        this._conventions = conventions;
        this._generateId = generateId;
    }
    _getIdentityProperty(entityType) {
        return this._conventions.getIdentityProperty(entityType);
    }
    tryGetIdFromInstance(entity, idCallback) {
        if (!entity) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Entity cannot be null or undefined.");
        }
        const resultCallback = (result) => {
            if (idCallback) {
                idCallback(result);
            }
        };
        try {
            const docType = TypeUtil_1.TypeUtil.findType(entity, this._conventions.knownEntityTypes);
            const identityProperty = this._getIdentityProperty(docType);
            if (identityProperty) {
                const value = entity[identityProperty];
                if (typeof (value) === "string") {
                    resultCallback(value);
                    return true;
                }
            }
            resultCallback(null);
            return false;
        }
        catch (e) {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Error trying to get ID from instance.");
        }
    }
    getOrGenerateDocumentId(entity) {
        return __awaiter(this, void 0, void 0, function* () {
            let id;
            this.tryGetIdFromInstance(entity, (idVal) => id = idVal);
            if (!id) {
                id = yield this._generateId(entity);
            }
            if (id && id.startsWith("/")) {
                (0, Exceptions_1.throwError)("InvalidOperationException", "Cannot use value '" + id + "' as a document id because it begins with a '/'");
            }
            return id;
        });
    }
    generateDocumentKeyForStorage(entity) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = yield this.getOrGenerateDocumentId(entity);
            this.trySetIdentity(entity, id);
            return id;
        });
    }
    trySetIdentity(entity, id, isProjection = false) {
        const docType = TypeUtil_1.TypeUtil.findType(entity, this._conventions.knownEntityTypes);
        const identityProperty = this._conventions.getIdentityProperty(docType);
        if (!identityProperty) {
            return;
        }
        if (isProjection && entity[identityProperty]) {
            return;
        }
        entity[identityProperty] = id;
    }
}
exports.GenerateEntityIdOnTheClient = GenerateEntityIdOnTheClient;
