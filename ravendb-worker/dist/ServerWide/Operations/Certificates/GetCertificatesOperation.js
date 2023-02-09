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
exports.GetCertificatesOperation = void 0;
const RavenCommand_1 = require("../../../Http/RavenCommand");
class GetCertificatesOperation {
    constructor(start, pageSize) {
        this._start = start;
        this._pageSize = pageSize;
    }
    get resultType() {
        return "CommandResult";
    }
    getCommand(conventions) {
        return new GetCertificatesCommand(this._start, this._pageSize, conventions);
    }
}
exports.GetCertificatesOperation = GetCertificatesOperation;
class GetCertificatesCommand extends RavenCommand_1.RavenCommand {
    constructor(start, pageSize, conventions) {
        super();
        this._start = start;
        this._pageSize = pageSize;
        this._conventions = conventions;
    }
    get isReadRequest() {
        return false;
    }
    createRequest(node) {
        const uri = node.url + "/admin/certificates?start=" + this._start + "&pageSize=" + this._pageSize;
        return {
            uri,
            method: "GET"
        };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!bodyStream) {
                return null;
            }
            let body = null;
            const results = yield this._defaultPipeline(_ => body = _).process(bodyStream);
            this.result = this._conventions.objectMapper.fromObjectLiteral(results, {
                nestedTypes: {
                    "results[].notAfter": "date",
                    "results[].notBefore": "date"
                }
            }).results;
            return body;
        });
    }
}
