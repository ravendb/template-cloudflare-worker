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
exports.ConfigureTimeSeriesPolicyOperation = void 0;
const Exceptions_1 = require("../../../Exceptions");
const RaftIdGenerator_1 = require("../../../Utility/RaftIdGenerator");
const RavenCommand_1 = require("../../../Http/RavenCommand");
class ConfigureTimeSeriesPolicyOperation {
    constructor(collection, config) {
        this._collection = collection;
        this._config = config;
    }
    getCommand(conventions) {
        return new ConfigureTimeSeriesPolicyCommand(this._collection, this._config);
    }
    get resultType() {
        return "CommandResult";
    }
}
exports.ConfigureTimeSeriesPolicyOperation = ConfigureTimeSeriesPolicyOperation;
class ConfigureTimeSeriesPolicyCommand extends RavenCommand_1.RavenCommand {
    constructor(collection, configuration) {
        super();
        if (!configuration) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Configuration cannot be null");
        }
        if (!collection) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Collection cannot be null");
        }
        this._configuration = configuration;
        this._collection = collection;
    }
    get isReadRequest() {
        return false;
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + node.database + "/admin/timeseries/policy?collection=" + this._urlEncode(this._collection);
        const body = this._serializer.serialize(this._configuration.serialize());
        return {
            method: "PUT",
            uri,
            body,
            headers: this._headers().typeAppJson().build()
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
    getRaftUniqueRequestId() {
        return RaftIdGenerator_1.RaftIdGenerator.newId();
    }
}
