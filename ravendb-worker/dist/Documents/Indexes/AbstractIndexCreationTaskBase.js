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
exports.AbstractIndexCreationTaskBase = void 0;
const PutIndexesOperation_1 = require("../Operations/Indexes/PutIndexesOperation");
const AbstractCommonApiForIndexes_1 = require("./AbstractCommonApiForIndexes");
const DocumentStoreBase_1 = require("../DocumentStoreBase");
class AbstractIndexCreationTaskBase extends AbstractCommonApiForIndexes_1.AbstractCommonApiForIndexes {
    execute(store, conventions, database) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!conventions && !database) {
                return store.executeIndex(this);
            }
            return this._putIndex(store, conventions, database);
        });
    }
    _putIndex(store, conventions, database) {
        return __awaiter(this, void 0, void 0, function* () {
            const oldConventions = this.conventions;
            try {
                database = DocumentStoreBase_1.DocumentStoreBase.getEffectiveDatabase(store, database);
                this.conventions = conventions || this.conventions || store.getRequestExecutor(database).conventions;
                const indexDefinition = this.createIndexDefinition();
                indexDefinition.name = this.getIndexName();
                if (this.lockMode) {
                    indexDefinition.lockMode = this.lockMode;
                }
                if (this.priority) {
                    indexDefinition.priority = this.priority;
                }
                if (this.state) {
                    indexDefinition.state = this.state;
                }
                if (this.deploymentMode) {
                    indexDefinition.deploymentMode = this.deploymentMode;
                }
                yield store.maintenance.forDatabase(database)
                    .send(new PutIndexesOperation_1.PutIndexesOperation(indexDefinition));
            }
            finally {
                this.conventions = oldConventions;
            }
        });
    }
}
exports.AbstractIndexCreationTaskBase = AbstractIndexCreationTaskBase;
