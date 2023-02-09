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
exports.MultiTypeHiLoIdGenerator = void 0;
const HiloIdGenerator_1 = require("./HiloIdGenerator");
const semaphore = require("semaphore");
const SemaphoreUtil_1 = require("../../Utility/SemaphoreUtil");
class MultiTypeHiLoIdGenerator {
    constructor(store, dbName) {
        this._idGeneratorsByTag = {};
        this._store = store;
        this._dbName = dbName;
        this._sem = semaphore();
        this._conventions = store.getRequestExecutor(dbName).conventions;
        this._identityPartsSeparator = this._conventions.identityPartsSeparator;
    }
    generateDocumentId(entity, documentType) {
        return __awaiter(this, void 0, void 0, function* () {
            const identityPartsSeparator = this._conventions.identityPartsSeparator;
            if (this._identityPartsSeparator !== identityPartsSeparator) {
                yield this._maybeRefresh(identityPartsSeparator);
            }
            const entityType = this._conventions.getJsTypeByDocumentType(documentType);
            const typeTagName = entityType
                ? this._conventions.getCollectionNameForType(entityType)
                : this._conventions.getCollectionNameForEntity(entity);
            if (!typeTagName) {
                return Promise.resolve(null);
            }
            const tag = yield this._conventions.transformClassCollectionNameToDocumentIdPrefix(typeTagName);
            let value = this._idGeneratorsByTag[tag];
            if (value) {
                return yield value.generateDocumentId(entity);
            }
            const acquiredSem = (0, SemaphoreUtil_1.acquireSemaphore)(this._sem);
            yield acquiredSem.promise;
            try {
                value = this._idGeneratorsByTag[tag];
                if (value) {
                    return value.generateDocumentId(entity);
                }
                value = this._createGeneratorFor(tag);
                this._idGeneratorsByTag[tag] = value;
            }
            finally {
                acquiredSem.dispose();
            }
            return value.generateDocumentId(entity);
        });
    }
    _maybeRefresh(identityPartsSeparator) {
        return __awaiter(this, void 0, void 0, function* () {
            let idGenerators;
            const acquiredSem = (0, SemaphoreUtil_1.acquireSemaphore)(this._sem);
            try {
                yield acquiredSem.promise;
                if (this._identityPartsSeparator === identityPartsSeparator) {
                    return;
                }
                idGenerators = Object.entries(this._idGeneratorsByTag).map(x => x[1]);
                this._idGeneratorsByTag = {};
                this._identityPartsSeparator = identityPartsSeparator;
            }
            finally {
                acquiredSem.dispose();
            }
            if (idGenerators) {
                try {
                    yield MultiTypeHiLoIdGenerator._returnUnusedRange(idGenerators);
                }
                catch (_a) {
                }
            }
        });
    }
    generateNextIdFor(collectionName) {
        return __awaiter(this, void 0, void 0, function* () {
            let value = this._idGeneratorsByTag[collectionName];
            if (value) {
                return value.nextId();
            }
            const acquiredSem = (0, SemaphoreUtil_1.acquireSemaphore)(this._sem);
            try {
                yield acquiredSem.promise;
                value = this._idGeneratorsByTag[collectionName];
                if (value) {
                    return value.nextId();
                }
                value = this._createGeneratorFor(collectionName);
                this._idGeneratorsByTag[collectionName] = value;
            }
            finally {
                acquiredSem.dispose();
            }
            return value.nextId();
        });
    }
    _createGeneratorFor(tag) {
        return new HiloIdGenerator_1.HiloIdGenerator(tag, this._store, this._dbName, this._identityPartsSeparator);
    }
    returnUnusedRange() {
        return __awaiter(this, void 0, void 0, function* () {
            yield MultiTypeHiLoIdGenerator._returnUnusedRange(Object.values(this._idGeneratorsByTag));
        });
    }
    static _returnUnusedRange(generators) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const generator of generators) {
                yield generator.returnUnusedRange();
            }
        });
    }
}
exports.MultiTypeHiLoIdGenerator = MultiTypeHiLoIdGenerator;
