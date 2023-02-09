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
exports.MultiLoaderWithInclude = void 0;
const TypeUtil_1 = require("../../../Utility/TypeUtil");
class MultiLoaderWithInclude {
    constructor(session) {
        this._includes = [];
        this._session = session;
    }
    include(path) {
        this._includes.push(path);
        return this;
    }
    load(ids, documentType) {
        return __awaiter(this, void 0, void 0, function* () {
            let singleResult = false;
            if (TypeUtil_1.TypeUtil.isString(ids)) {
                ids = [ids];
                singleResult = true;
            }
            const entityType = this._session.conventions.getJsTypeByDocumentType(documentType);
            const results = yield this._session.loadInternal(ids, {
                includes: this._includes,
                documentType: entityType
            });
            return singleResult ?
                Object.keys(results).map(x => results[x]).filter(x => x)[0] :
                results;
        });
    }
}
exports.MultiLoaderWithInclude = MultiLoaderWithInclude;
