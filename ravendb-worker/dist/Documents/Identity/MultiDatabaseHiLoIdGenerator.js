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
exports.MultiDatabaseHiLoIdGenerator = void 0;
const MultiTypeHiLoIdGenerator_1 = require("./MultiTypeHiLoIdGenerator");
const DocumentStoreBase_1 = require("../DocumentStoreBase");
const TypeUtil_1 = require("../../Utility/TypeUtil");
class MultiDatabaseHiLoIdGenerator {
    constructor(store) {
        this._generators = {};
        this._store = store;
    }
    generateDocumentId(database, entity) {
        return this._getGeneratorForDatabase(DocumentStoreBase_1.DocumentStoreBase.getEffectiveDatabase(this._store, database))
            .generateDocumentId(entity);
    }
    _getGeneratorForDatabase(database) {
        if (!(database in this._generators)) {
            this._generators[database] = new MultiTypeHiLoIdGenerator_1.MultiTypeHiLoIdGenerator(this._store, database);
        }
        return this._generators[database];
    }
    returnUnusedRange() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const [key, generator] of Object.entries(this._generators)) {
                yield generator.returnUnusedRange();
            }
        });
    }
    generateNextIdFor(database, target) {
        if (TypeUtil_1.TypeUtil.isString(target)) {
            return this._generateNextIdFor(database, target);
        }
        if (TypeUtil_1.TypeUtil.isObjectTypeDescriptor(target)) {
            const collectionName = this._store.conventions.getCollectionNameForType(target);
            return this._generateNextIdFor(database, collectionName);
        }
        const collectionName = this._store.conventions.getCollectionNameForEntity(target);
        return this._generateNextIdFor(database, collectionName);
    }
    _generateNextIdFor(database, collectionName) {
        return __awaiter(this, void 0, void 0, function* () {
            database = this._store.getEffectiveDatabase(database);
            if (!(database in this._generators)) {
                this._generators[database] = new MultiTypeHiLoIdGenerator_1.MultiTypeHiLoIdGenerator(this._store, database);
            }
            return this._generators[database].generateNextIdFor(collectionName);
        });
    }
}
exports.MultiDatabaseHiLoIdGenerator = MultiDatabaseHiLoIdGenerator;
