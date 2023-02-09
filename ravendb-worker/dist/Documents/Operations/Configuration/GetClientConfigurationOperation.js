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
exports.GetClientConfigurationCommand = exports.GetClientConfigurationOperation = void 0;
const RavenCommand_1 = require("../../../Http/RavenCommand");
class GetClientConfigurationOperation {
    get resultType() {
        return "CommandResult";
    }
    getCommand(conventions) {
        return new GetClientConfigurationCommand();
    }
}
exports.GetClientConfigurationOperation = GetClientConfigurationOperation;
class GetClientConfigurationCommand extends RavenCommand_1.RavenCommand {
    constructor() {
        super();
    }
    get isReadRequest() {
        return false;
    }
    createRequest(node) {
        const uri = `${node.url}/databases/${node.database}/configuration/client`;
        return { uri };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!bodyStream) {
                this._throwInvalidResponse();
            }
            const body = yield this._parseResponseDefaultAsync(bodyStream);
            const match = body.match("\"Etag\":(-?[0-9]+)");
            if (match) {
                this.result.etag = match[1];
            }
            return body;
        });
    }
}
exports.GetClientConfigurationCommand = GetClientConfigurationCommand;
