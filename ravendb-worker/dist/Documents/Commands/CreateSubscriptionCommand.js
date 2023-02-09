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
exports.CreateSubscriptionCommand = void 0;
const RavenCommand_1 = require("../../Http/RavenCommand");
const RaftIdGenerator_1 = require("../../Utility/RaftIdGenerator");
const Exceptions_1 = require("../../Exceptions");
class CreateSubscriptionCommand extends RavenCommand_1.RavenCommand {
    constructor(options, id) {
        super();
        if (!options) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Options cannot be null");
        }
        this._options = options;
        this._id = id;
    }
    createRequest(node) {
        let uri = node.url + "/databases/" + node.database + "/subscriptions";
        if (this._id) {
            uri += "?id=" + this._urlEncode(this._id);
        }
        const body = this._serializer.serialize(this._options);
        return {
            uri,
            method: "PUT",
            body
        };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
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
exports.CreateSubscriptionCommand = CreateSubscriptionCommand;
