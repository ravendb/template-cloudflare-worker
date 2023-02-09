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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetConflictsCommand = void 0;
const RavenCommand_1 = require("../../Http/RavenCommand");
class GetConflictsCommand extends RavenCommand_1.RavenCommand {
    constructor(id, conventions) {
        super();
        this._id = id;
        this._conventions = conventions;
    }
    get isReadRequest() {
        return true;
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + node.database
            + "/replication/conflicts?docId=" + encodeURIComponent(this._id);
        return {
            method: "GET",
            uri
        };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!bodyStream) {
                this._throwInvalidResponse();
            }
            let body = null;
            const payload = yield this._defaultPipeline(_ => body = _).process(bodyStream);
            const dateUtil = this._conventions.dateUtil;
            const { results } = payload, otherProps = __rest(payload, ["results"]);
            this.result = Object.assign(Object.assign({}, otherProps), { results: results.map(r => (Object.assign(Object.assign({}, r), { lastModified: dateUtil.parse(r.lastModified) }))) });
            return body;
        });
    }
}
exports.GetConflictsCommand = GetConflictsCommand;
