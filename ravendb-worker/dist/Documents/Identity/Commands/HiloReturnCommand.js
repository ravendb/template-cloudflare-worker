"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HiloReturnCommand = void 0;
const Exceptions_1 = require("../../../Exceptions");
const RavenCommand_1 = require("../../../Http/RavenCommand");
class HiloReturnCommand extends RavenCommand_1.RavenCommand {
    constructor(tag, last, end) {
        super();
        if (last < 0) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "last is < 0");
        }
        if (end < 0) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "end is < 0");
        }
        if (!tag) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "tag cannot be null");
        }
        this._tag = tag;
        this._last = last;
        this._end = end;
        this._responseType = "Empty";
    }
    get isReadRequest() {
        return false;
    }
    createRequest(node) {
        const uri = `${node.url}/databases/${node.database}/hilo/return?`
            + `tag=${this._tag}&end=${this._end}&last=${this._last}`;
        return {
            method: "PUT",
            uri
        };
    }
}
exports.HiloReturnCommand = HiloReturnCommand;
