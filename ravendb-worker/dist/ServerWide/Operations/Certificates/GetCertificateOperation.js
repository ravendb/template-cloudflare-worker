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
exports.GetCertificateOperation = void 0;
const Exceptions_1 = require("../../../Exceptions");
const RavenCommand_1 = require("../../../Http/RavenCommand");
class GetCertificateOperation {
    constructor(thumbprint) {
        if (!thumbprint) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Thumbprint cannot be null.");
        }
        this._thumbprint = thumbprint;
    }
    get resultType() {
        return "CommandResult";
    }
    getCommand(conventions) {
        return new GetCertificateCommand(this._thumbprint, conventions);
    }
}
exports.GetCertificateOperation = GetCertificateOperation;
class GetCertificateCommand extends RavenCommand_1.RavenCommand {
    constructor(thumbprint, conventions) {
        super();
        if (!thumbprint) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Thumbprint cannot be null.");
        }
        this._thumbprint = thumbprint;
        this._conventions = conventions;
    }
    get isReadRequest() {
        return false;
    }
    createRequest(node) {
        const uri = node.url + "/admin/certificates?thumbprint=" + encodeURIComponent(this._thumbprint);
        return {
            method: "GET",
            uri
        };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!bodyStream) {
                return;
            }
            let body = null;
            const results = yield this._defaultPipeline(_ => body = _).process(bodyStream);
            const mapped = this._conventions.objectMapper.fromObjectLiteral(results, {
                nestedTypes: {
                    "results[].notAfter": "date",
                    "results[].notBefore": "date"
                }
            }).results;
            if (mapped.length !== 1) {
                this._throwInvalidResponse();
            }
            this.result = mapped[0];
            return body;
        });
    }
}
