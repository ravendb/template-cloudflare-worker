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
exports.ConfigureRevisionsForConflictsResult = exports.ConfigureRevisionsForConflictsOperation = void 0;
const index_1 = require("../../Exceptions/index");
const RavenCommand_1 = require("../../Http/RavenCommand");
const RaftIdGenerator_1 = require("../../Utility/RaftIdGenerator");
class ConfigureRevisionsForConflictsOperation {
    constructor(database, configuration) {
        this._database = database;
        if (!configuration) {
            (0, index_1.throwError)("InvalidArgumentException", "Configuration cannot be null");
        }
        this._configuration = configuration;
    }
    get resultType() {
        return "CommandResult";
    }
    getCommand(conventions) {
        return new ConfigureRevisionsForConflictsCommand(conventions, this._database, this._configuration);
    }
}
exports.ConfigureRevisionsForConflictsOperation = ConfigureRevisionsForConflictsOperation;
class ConfigureRevisionsForConflictsCommand extends RavenCommand_1.RavenCommand {
    constructor(conventions, database, configuration) {
        super();
        if (!conventions) {
            (0, index_1.throwError)("InvalidArgumentException", "Conventions cannot be null");
        }
        this._conventions = conventions;
        if (!database) {
            (0, index_1.throwError)("InvalidArgumentException", "Database cannot be null");
        }
        this._databaseName = database;
        this._configuration = configuration;
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + this._databaseName + "/admin/revisions/conflicts/config";
        const body = this._serializer.serialize(this._configuration);
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
    get isReadRequest() {
        return false;
    }
    getRaftUniqueRequestId() {
        return RaftIdGenerator_1.RaftIdGenerator.newId();
    }
}
class ConfigureRevisionsForConflictsResult {
}
exports.ConfigureRevisionsForConflictsResult = ConfigureRevisionsForConflictsResult;
