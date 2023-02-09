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
exports.ConfigureTimeSeriesValueNamesOperation = void 0;
const Exceptions_1 = require("../../../Exceptions");
const RaftIdGenerator_1 = require("../../../Utility/RaftIdGenerator");
const StringUtil_1 = require("../../../Utility/StringUtil");
const RavenCommand_1 = require("../../../Http/RavenCommand");
class ConfigureTimeSeriesValueNamesOperation {
    constructor(parameters) {
        if (!parameters) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Parameters cannot be null");
        }
        this._parameters = parameters;
        if (StringUtil_1.StringUtil.isNullOrEmpty(parameters.collection)) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Collection cannot be null or empty");
        }
        if (StringUtil_1.StringUtil.isNullOrEmpty(parameters.timeSeries)) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "TimeSeries cannot be null or empty");
        }
        if (!parameters.valueNames || !parameters.valueNames.length) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "ValueNames cannot be null or empty");
        }
    }
    get resultType() {
        return "CommandResult";
    }
    getCommand(conventions) {
        return new ConfigureTimeSeriesValueNamesCommand(this._parameters);
    }
}
exports.ConfigureTimeSeriesValueNamesOperation = ConfigureTimeSeriesValueNamesOperation;
class ConfigureTimeSeriesValueNamesCommand extends RavenCommand_1.RavenCommand {
    constructor(parameters) {
        super();
        this._parameters = parameters;
    }
    get isReadRequest() {
        return false;
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + node.database + "/timeseries/names/config";
        const body = this._serializer.serialize(this._parameters);
        return {
            uri,
            method: "POST",
            headers: this._headers().typeAppJson().build(),
            body
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
