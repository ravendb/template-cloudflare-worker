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
exports.GetServerWideExternalReplicationOperation = void 0;
const Exceptions_1 = require("../../../Exceptions");
const RavenCommand_1 = require("../../../Http/RavenCommand");
class GetServerWideExternalReplicationOperation {
    constructor(name) {
        if (!name) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Name cannot be null");
        }
        this._name = name;
    }
    get resultType() {
        return "CommandResult";
    }
    getCommand(conventions) {
        return new GetServerWideExternalReplicationCommand(this._name);
    }
}
exports.GetServerWideExternalReplicationOperation = GetServerWideExternalReplicationOperation;
class GetServerWideExternalReplicationCommand extends RavenCommand_1.RavenCommand {
    constructor(name) {
        super();
        if (!name) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Name cannot be null");
        }
        this._name = name;
    }
    get isReadRequest() {
        return true;
    }
    createRequest(node) {
        const uri = node.url + "/admin/configuration/server-wide/tasks?type=" + "Replication" + "&name=" + this._urlEncode(this._name);
        return {
            uri,
            method: "GET"
        };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!bodyStream) {
                return;
            }
            let body = null;
            const results = yield this._defaultPipeline(_ => body = _)
                .process(bodyStream);
            if (results.results.length > 1) {
                this._throwInvalidResponse();
            }
            this.result = results.results[0];
            return body;
        });
    }
}
