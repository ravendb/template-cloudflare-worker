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
exports.DeleteByIndexCommand = exports.DeleteByQueryOperation = void 0;
const IndexQuery_1 = require("../Queries/IndexQuery");
const Exceptions_1 = require("../../Exceptions");
const RavenCommand_1 = require("../../Http/RavenCommand");
const TypeUtil_1 = require("../../Utility/TypeUtil");
const StringBuilder_1 = require("../../Utility/StringBuilder");
class DeleteByQueryOperation {
    constructor(queryToDelete, options) {
        if (!queryToDelete) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "QueryToDelete cannot be null");
        }
        this._queryToDelete = TypeUtil_1.TypeUtil.isString(queryToDelete) ? new IndexQuery_1.IndexQuery(queryToDelete) : queryToDelete;
        this._options = options;
    }
    get resultType() {
        return "OperationId";
    }
    getCommand(store, conventions, cache) {
        return new DeleteByIndexCommand(conventions, this._queryToDelete, this._options);
    }
}
exports.DeleteByQueryOperation = DeleteByQueryOperation;
class DeleteByIndexCommand extends RavenCommand_1.RavenCommand {
    constructor(conventions, queryToDelete, options) {
        super();
        this._conventions = conventions;
        this._queryToDelete = queryToDelete;
        this._options = options || {};
    }
    createRequest(node) {
        const path = new StringBuilder_1.StringBuilder(node.url)
            .append("/databases/")
            .append(node.database)
            .append("/queries")
            .append("?allowStale=")
            .append(this._options.allowStale || "");
        if (!TypeUtil_1.TypeUtil.isNullOrUndefined(this._options.maxOpsPerSecond)) {
            path.append("&maxOpsPerSec=")
                .append(this._options.maxOpsPerSecond);
        }
        path
            .append("&details=")
            .append(this._options.retrieveDetails || "");
        if (this._options.staleTimeout) {
            path.append("&staleTimeout=")
                .append(this._options.staleTimeout);
        }
        const body = (0, IndexQuery_1.writeIndexQuery)(this._conventions, this._queryToDelete);
        const headers = this._headers().typeAppJson().build();
        const uri = path.toString();
        return {
            uri,
            body,
            method: "DELETE",
            headers
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
}
exports.DeleteByIndexCommand = DeleteByIndexCommand;
