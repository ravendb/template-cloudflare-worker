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
exports.LazyMultiLoaderWithInclude = void 0;
const Lazy_1 = require("../../Lazy");
class LazyMultiLoaderWithInclude {
    constructor(session) {
        this._includes = [];
        this._session = session;
    }
    include(path) {
        this._includes.push(path);
        return this;
    }
    load(ids, clazz) {
        const isMultiple = Array.isArray(ids);
        const result = this._session.lazyLoadInternal(isMultiple ? ids : [ids], this._includes, clazz);
        if (isMultiple) {
            return result;
        }
        return new Lazy_1.Lazy(() => __awaiter(this, void 0, void 0, function* () {
            const x = yield result.getValue();
            return x[Object.keys(x)[0]];
        }));
    }
}
exports.LazyMultiLoaderWithInclude = LazyMultiLoaderWithInclude;
