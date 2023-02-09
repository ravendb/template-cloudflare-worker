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
exports.NextIdentityForCommand = void 0;
const RavenCommand_1 = require("../../Http/RavenCommand");
const Exceptions_1 = require("../../Exceptions");
const RaftIdGenerator_1 = require("../../Utility/RaftIdGenerator");
class NextIdentityForCommand extends RavenCommand_1.RavenCommand {
    constructor(id) {
        super();
        this._raftUniqueRequestId = RaftIdGenerator_1.RaftIdGenerator.newId();
        if (!id) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Id cannot be null");
        }
        this._id = id;
    }
    get isReadRequest() {
        return false;
    }
    createRequest(node) {
        RavenCommand_1.RavenCommand.ensureIsNotNullOrEmpty(this._id, "id");
        const uri = node.url + "/databases/" + node.database + "/identity/next?name=" + encodeURIComponent(this._id);
        return {
            method: "POST",
            uri
        };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!bodyStream) {
                this._throwInvalidResponse();
            }
            let body = null;
            const results = yield this._defaultPipeline(_ => body = _).process(bodyStream);
            if (!results["newIdentityValue"]) {
                this._throwInvalidResponse();
            }
            this.result = results["newIdentityValue"];
            return body;
        });
    }
    getRaftUniqueRequestId() {
        return this._raftUniqueRequestId;
    }
    prepareToBroadcast(conventions) {
        const copy = new NextIdentityForCommand(this._id);
        copy._raftUniqueRequestId = this._raftUniqueRequestId;
        return copy;
    }
}
exports.NextIdentityForCommand = NextIdentityForCommand;
