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
exports.UpdateSubscriptionCommand = void 0;
const RaftIdGenerator_1 = require("../../Utility/RaftIdGenerator");
const RavenCommand_1 = require("../../Http/RavenCommand");
class UpdateSubscriptionCommand extends RavenCommand_1.RavenCommand {
    constructor(options) {
        super();
        this._options = options;
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + node.database + "/subscriptions/update";
        const body = this._serializer.serialize(this._options);
        return {
            uri,
            body,
            headers: this._headers().typeAppJson().build(),
            method: "POST"
        };
    }
    setResponseFromCache(cachedValue) {
        return __awaiter(this, void 0, void 0, function* () {
            this.result = {
                name: this._options.name
            };
        });
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (fromCache) {
                this.result = {
                    name: this._options.name
                };
                return;
            }
            if (!bodyStream) {
                this._throwInvalidResponse();
            }
            return this._parseResponseDefaultAsync(bodyStream);
        });
    }
    get isReadRequest() {
        return false;
    }
    getRaftUniqueRequestId() {
        return RaftIdGenerator_1.RaftIdGenerator.newId();
    }
}
exports.UpdateSubscriptionCommand = UpdateSubscriptionCommand;
