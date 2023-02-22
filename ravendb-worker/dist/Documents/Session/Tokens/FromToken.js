"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FromToken = void 0;
const QueryToken_1 = require("./QueryToken");
const Exceptions_1 = require("../../../Exceptions");
const StringUtil_1 = require("../../../Utility/StringUtil");
class FromToken extends QueryToken_1.QueryToken {
    constructor(indexName, collectionName, alias = null) {
        super();
        this._collectionName = collectionName;
        this._indexName = indexName;
        this._dynamic = !!collectionName;
        this._alias = alias;
    }
    get collection() {
        return this._collectionName;
    }
    get indexName() {
        return this._indexName;
    }
    get isDynamic() {
        return this._dynamic;
    }
    alias() {
        return this._alias;
    }
    static create(indexName, collectionName, alias) {
        return new FromToken(indexName, collectionName, alias);
    }
    writeTo(writer) {
        if (!this._indexName && !this._collectionName) {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Either indexName or collectionName must be specified");
        }
        if (this._dynamic) {
            writer.append("from '");
            StringUtil_1.StringUtil.escapeString(writer, this._collectionName);
            writer.append("'");
        }
        else {
            writer
                .append("from index '")
                .append(this._indexName)
                .append("'");
        }
        if (this._alias) {
            writer.append(" as ").append(this._alias);
        }
    }
}
exports.FromToken = FromToken;
FromToken.WHITE_SPACE_CHARS = [" ", "\t", "\r", "\n"];