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
exports.GetTcpInfoCommand = exports.TcpConnectionInfo = void 0;
const RavenCommand_1 = require("../../Http/RavenCommand");
class TcpConnectionInfo {
}
exports.TcpConnectionInfo = TcpConnectionInfo;
class GetTcpInfoCommand extends RavenCommand_1.RavenCommand {
    constructor(tag, dbName) {
        super();
        this._tag = tag;
        this._dbName = dbName;
        this.timeout = 15000;
    }
    createRequest(node) {
        let uri;
        if (!this._dbName) {
            uri = `${node.url}/info/tcp?tcp=${this._tag}`;
        }
        else {
            uri = `${node.url}/databases/${this._dbName}/info/tcp?tcp=${this._tag}`;
        }
        this.requestedNode = node;
        return {
            uri,
            method: "GET"
        };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!bodyStream) {
                this._throwInvalidResponse();
            }
            return this._parseResponseDefaultAsync(bodyStream);
        });
    }
    get isReadRequest() {
        return true;
    }
}
exports.GetTcpInfoCommand = GetTcpInfoCommand;
