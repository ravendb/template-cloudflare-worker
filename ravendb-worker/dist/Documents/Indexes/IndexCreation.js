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
exports.IndexCreation = void 0;
const LogUtil_1 = require("../../Utility/LogUtil");
const PutIndexesOperation_1 = require("../Operations/Indexes/PutIndexesOperation");
const log = (0, LogUtil_1.getLogger)({ module: "DocumentStore" });
class IndexCreation {
    static createIndexes(indexes, store, conventions) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!conventions) {
                conventions = store.conventions;
            }
            try {
                const indexesToAdd = this.createIndexesToAdd(indexes, conventions);
                yield store.maintenance.send(new PutIndexesOperation_1.PutIndexesOperation(...indexesToAdd));
            }
            catch (err) {
                log.warn(err, "Could not create indexes in one shot (maybe using older version of RavenDB ?)");
                for (const index of indexes) {
                    yield index.execute(store, conventions);
                }
            }
        });
    }
    static createIndexesToAdd(indexCreationTasks, conventions) {
        return indexCreationTasks
            .map(x => {
            const oldConventions = x.conventions;
            try {
                x.conventions = conventions;
                const definition = x.createIndexDefinition();
                definition.name = x.getIndexName();
                definition.priority = x.priority || "Normal";
                definition.state = x.state || "Normal";
                return definition;
            }
            finally {
                x.conventions = oldConventions;
            }
        });
    }
}
exports.IndexCreation = IndexCreation;
