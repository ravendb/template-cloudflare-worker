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
exports.SeedIdentityForCommand = void 0;
const RavenCommand_1 = require("../../Http/RavenCommand");
const Exceptions_1 = require("../../Exceptions");
const TypeUtil_1 = require("../../Utility/TypeUtil");
const RaftIdGenerator_1 = require("../../Utility/RaftIdGenerator");
class SeedIdentityForCommand extends RavenCommand_1.RavenCommand {
    constructor(id, value, forced) {
        super();
        if (!id) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Id cannot be null");
        }
        this._id = id;
        this._value = value;
        this._forced = forced;
    }
    get isReadRequest() {
        return false;
    }
    createRequest(node) {
        RavenCommand_1.RavenCommand.ensureIsNotNullOrEmpty(this._id, "id");
        let uri = node.url + "/databases/" + node.database
            + "/identity/seed?name=" + encodeURIComponent(this._id) + "&value=" + this._value;
        if (this._forced) {
            uri += "&force=true";
        }
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
            const result = yield this._defaultPipeline(_ => body = _).process(bodyStream);
            const newSeedValue = result["newSeedValue"];
            if (TypeUtil_1.TypeUtil.isNullOrUndefined(newSeedValue)) {
                this._throwInvalidResponse();
            }
            this.result = newSeedValue;
            return body;
        });
    }
    getRaftUniqueRequestId() {
        return RaftIdGenerator_1.RaftIdGenerator.newId();
    }
}
exports.SeedIdentityForCommand = SeedIdentityForCommand;
