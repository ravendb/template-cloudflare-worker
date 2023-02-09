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
exports.GetIdentitiesCommand = exports.GetIdentitiesOperation = void 0;
const RavenCommand_1 = require("../../../Http/RavenCommand");
class GetIdentitiesOperation {
    get resultType() {
        return "CommandResult";
    }
    getCommand(conventions) {
        return new GetIdentitiesCommand();
    }
}
exports.GetIdentitiesOperation = GetIdentitiesOperation;
class GetIdentitiesCommand extends RavenCommand_1.RavenCommand {
    constructor() {
        super();
    }
    get isReadRequest() {
        return true;
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + node.database + "/debug/identities";
        return { uri };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            let body = null;
            this.result = yield this._pipeline()
                .parseJsonSync()
                .collectBody(b => body = b)
                .process(bodyStream);
            return body;
        });
    }
}
exports.GetIdentitiesCommand = GetIdentitiesCommand;
