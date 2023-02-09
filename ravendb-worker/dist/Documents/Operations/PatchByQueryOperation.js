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
exports.PatchByQueryCommand = exports.PatchByQueryOperation = void 0;
const IndexQuery_1 = require("../Queries/IndexQuery");
const TypeUtil_1 = require("../../Utility/TypeUtil");
const Exceptions_1 = require("../../Exceptions");
const RavenCommand_1 = require("../../Http/RavenCommand");
class PatchByQueryOperation {
    constructor(queryToUpdate, options) {
        if (TypeUtil_1.TypeUtil.isString(queryToUpdate)) {
            queryToUpdate = new IndexQuery_1.IndexQuery(queryToUpdate);
        }
        if (!queryToUpdate) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "QueryToUpdate cannot be null");
        }
        this._queryToUpdate = queryToUpdate;
        this._options = options;
    }
    getCommand(store, conventions, cache) {
        return new PatchByQueryCommand(conventions, this._queryToUpdate, this._options);
    }
    get resultType() {
        return "OperationId";
    }
}
exports.PatchByQueryOperation = PatchByQueryOperation;
PatchByQueryOperation.DUMMY_QUERY = new IndexQuery_1.IndexQuery();
class PatchByQueryCommand extends RavenCommand_1.RavenCommand {
    constructor(conventions, queryToUpdate, options) {
        super();
        this._conventions = conventions;
        this._queryToUpdate = queryToUpdate;
        this._options = options || {};
    }
    get isReadRequest() {
        return false;
    }
    createRequest(node) {
        let path = node.url + "/databases/" + node.database + "/queries?allowStale="
            + !!this._options.allowStale;
        if (!TypeUtil_1.TypeUtil.isNullOrUndefined(this._options.maxOpsPerSecond)) {
            path += "&maxOpsPerSec=" + this._options.maxOpsPerSecond;
        }
        path += "&details=" + !!this._options.retrieveDetails;
        if (!TypeUtil_1.TypeUtil.isNullOrUndefined(this._options.staleTimeout)) {
            path += "&staleTimeout=" + this._options.staleTimeout;
        }
        const body = `{ "Query": ${(0, IndexQuery_1.writeIndexQuery)(this._conventions, this._queryToUpdate)} }`;
        return {
            method: "PATCH",
            uri: path,
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
}
exports.PatchByQueryCommand = PatchByQueryCommand;
