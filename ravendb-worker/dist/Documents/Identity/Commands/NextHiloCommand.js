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
exports.NextHiloCommand = void 0;
const qs = require("qs");
const DateUtil_1 = require("../../../Utility/DateUtil");
const RavenCommand_1 = require("../../../Http/RavenCommand");
const Exceptions_1 = require("../../../Exceptions");
class NextHiloCommand extends RavenCommand_1.RavenCommand {
    constructor(tag, lastBatchSize, lastRangeAt, identityPartsSeparator, lastRangeMax, conventions) {
        super();
        if (!tag) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "tag cannot be null.");
        }
        if (!identityPartsSeparator) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "identityPartsSeparator cannot be null.");
        }
        this._tag = tag;
        this._lastBatchSize = lastBatchSize;
        this._lastRangeAt = lastRangeAt;
        this._identityPartsSeparator = identityPartsSeparator;
        this._lastRangeMax = lastRangeMax;
        this._conventions = conventions;
    }
    createRequest(node) {
        const lastRangeAt = this._lastRangeAt
            ? DateUtil_1.DateUtil.default.stringify(this._lastRangeAt)
            : "";
        const queryString = qs.stringify({
            tag: this._tag,
            lastBatchSize: this._lastBatchSize,
            lastRangeAt,
            identityPartsSeparator: this._identityPartsSeparator,
            lastMax: this._lastRangeMax
        });
        const uri = `${node.url}/databases/${node.database}/hilo/next?${queryString}`;
        return { uri };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            let body = null;
            const results = yield this._defaultPipeline(_ => body = _).process(bodyStream);
            this.result = this._reviveResultTypes(results, this._conventions, {
                nestedTypes: {
                    lastRangeAt: "date"
                }
            });
            return body;
        });
    }
    get isReadRequest() {
        return true;
    }
}
exports.NextHiloCommand = NextHiloCommand;
