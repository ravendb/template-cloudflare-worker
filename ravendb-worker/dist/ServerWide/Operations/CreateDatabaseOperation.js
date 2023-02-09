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
exports.CreateDatabaseCommand = exports.CreateDatabaseOperation = void 0;
const RavenCommand_1 = require("../../Http/RavenCommand");
const Exceptions_1 = require("../../Exceptions");
const HttpUtil_1 = require("../../Utility/HttpUtil");
const Constants_1 = require("../../Constants");
const RaftIdGenerator_1 = require("../../Utility/RaftIdGenerator");
class CreateDatabaseOperation {
    constructor(databaseRecord, replicationFactor) {
        this._databaseRecord = databaseRecord;
        const topology = databaseRecord.topology;
        if (replicationFactor) {
            this._replicationFactor = replicationFactor;
        }
        else {
            if (topology) {
                this._replicationFactor = topology.replicationFactor > 0 ? topology.replicationFactor : 1;
            }
            else {
                this._replicationFactor = 1;
            }
        }
    }
    get resultType() {
        return "CommandResult";
    }
    getCommand(conventions) {
        return new CreateDatabaseCommand(conventions, this._databaseRecord, this._replicationFactor);
    }
}
exports.CreateDatabaseOperation = CreateDatabaseOperation;
class CreateDatabaseCommand extends RavenCommand_1.RavenCommand {
    constructor(conventions, databaseRecord, replicationFactor, etag) {
        super();
        this._conventions = conventions;
        this._databaseRecord = databaseRecord;
        this._replicationFactor = replicationFactor;
        this._etag = etag;
        if (!databaseRecord || !databaseRecord.databaseName) {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Database name is required");
        }
        this._databaseName = databaseRecord.databaseName;
    }
    createRequest(node) {
        let uri = node.url + "/admin/databases?name=" + this._databaseName;
        uri += "&replicationFactor=" + this._replicationFactor;
        const databaseDocumentJson = this._serializer.serialize(this._databaseRecord);
        return {
            uri,
            method: "PUT",
            headers: HttpUtil_1.HeadersBuilder.create()
                .typeAppJson()
                .with(Constants_1.HEADERS.ETAG, `"${this._etag}"`)
                .build(),
            body: databaseDocumentJson
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
        return false;
    }
    getRaftUniqueRequestId() {
        return RaftIdGenerator_1.RaftIdGenerator.newId();
    }
}
exports.CreateDatabaseCommand = CreateDatabaseCommand;
