"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransformKeysJsonStream = void 0;
const FilterBase = require("stream-json/filters/FilterBase");
const ObjectUtil_1 = require("../../../Utility/ObjectUtil");
const Exceptions_1 = require("../../../Exceptions");
class TransformKeysJsonStream extends FilterBase {
    constructor(opts) {
        super(null);
        opts = opts || { getCurrentTransform: (key, stack) => null };
        if (!opts.getCurrentTransform) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "getCurrentTransform() must not be empty.");
        }
        this._getTransform = opts.getCurrentTransform;
    }
    _transformKey(key) {
        const transformName = this._getTransform(key, this._stack);
        if (!transformName) {
            return key;
        }
        return ObjectUtil_1.ObjectUtil[transformName](key);
    }
    _checkChunk(chunk) {
        switch (chunk.name) {
            case "keyValue":
                this.push({ name: "keyValue", value: this._transformKey(chunk.value) });
                break;
            default:
                this.push(chunk);
        }
        return false;
    }
}
exports.TransformKeysJsonStream = TransformKeysJsonStream;
