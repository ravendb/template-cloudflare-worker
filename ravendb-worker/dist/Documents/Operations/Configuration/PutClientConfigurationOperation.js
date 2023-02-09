"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PutClientConfigurationCommand = exports.PutClientConfigurationOperation = void 0;
const Exceptions_1 = require("../../../Exceptions");
const RavenCommand_1 = require("../../../Http/RavenCommand");
const HttpUtil_1 = require("../../../Utility/HttpUtil");
const RaftIdGenerator_1 = require("../../../Utility/RaftIdGenerator");
class PutClientConfigurationOperation {
    constructor(configuration) {
        if (!configuration) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Configuration cannot be null or undefined.");
        }
        this._configuration = configuration;
    }
    get resultType() {
        return "CommandResult";
    }
    getCommand(conventions) {
        return new PutClientConfigurationCommand(conventions, this._configuration);
    }
}
exports.PutClientConfigurationOperation = PutClientConfigurationOperation;
class PutClientConfigurationCommand extends RavenCommand_1.RavenCommand {
    constructor(conventions, configuration) {
        super();
        if (!conventions) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Document conventions cannot be null or undefined.");
        }
        if (!configuration) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Configuration cannot be null or undefined.");
        }
        this._configuration = this._serializer.serialize(configuration);
    }
    get isReadRequest() {
        return false;
    }
    get responseType() {
        return "Empty";
    }
    createRequest(node) {
        const uri = `${node.url}/databases/${node.database}/admin/configuration/client`;
        return {
            method: "PUT",
            uri,
            body: this._configuration,
            headers: HttpUtil_1.HeadersBuilder.create()
                .typeAppJson()
                .build()
        };
    }
    getRaftUniqueRequestId() {
        return RaftIdGenerator_1.RaftIdGenerator.newId();
    }
}
exports.PutClientConfigurationCommand = PutClientConfigurationCommand;
