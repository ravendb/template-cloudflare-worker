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
exports.PatchCommand = exports.PatchOperation = exports.PatchOperationResult = void 0;
const RavenCommand_1 = require("../../Http/RavenCommand");
const Exceptions_1 = require("../../Exceptions");
const ObjectUtil_1 = require("../../Utility/ObjectUtil");
class PatchOperationResult {
}
exports.PatchOperationResult = PatchOperationResult;
class PatchOperation {
    constructor(id, changeVector, patch, patchIfMissing = null, skipPatchIfChangeVectorMismatch = false) {
        if (!patch) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Patch cannot be null");
        }
        if (!patch.script || !patch.script.trim()) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Patch script cannot be null");
        }
        if (patchIfMissing && !patchIfMissing.script.trim()) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "PatchIfMissing script cannot be null");
        }
        this._id = id;
        this._changeVector = changeVector;
        this._patch = patch;
        this._patchIfMissing = patchIfMissing;
        this._skipPatchIfChangeVectorMismatch = skipPatchIfChangeVectorMismatch;
    }
    get resultType() {
        return "PatchResult";
    }
    getCommand(store, conventions, cache, returnDebugInformation = false, test = false) {
        return new PatchCommand(conventions, this._id, this._changeVector, this._patch, this._patchIfMissing, this._skipPatchIfChangeVectorMismatch, returnDebugInformation, test);
    }
}
exports.PatchOperation = PatchOperation;
class PatchCommand extends RavenCommand_1.RavenCommand {
    constructor(conventions, id, changeVector, patch, patchIfMissing, skipPatchIfChangeVectorMismatch, returnDebugInformation, test) {
        super();
        if (!conventions) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Conventions cannot be null");
        }
        if (!patch) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Patch cannot be null");
        }
        if (!patch.script.trim()) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Patch.Script cannot be null");
        }
        if (patchIfMissing && !patchIfMissing.script.trim()) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "PatchIfMissing.Script cannot be null");
        }
        if (!id) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Id cannot be null");
        }
        this._id = id;
        this._changeVector = changeVector;
        this._patch = ObjectUtil_1.ObjectUtil.transformObjectKeys(conventions.objectMapper.toObjectLiteral({ patch, patchIfMissing }), {
            defaultTransform: "pascal",
            paths: [
                {
                    transform: conventions.remoteEntityFieldNameConvention,
                    path: /Values/i
                }
            ]
        });
        this._skipPatchIfChangeVectorMismatch = skipPatchIfChangeVectorMismatch;
        this._returnDebugInformation = returnDebugInformation;
        this._test = test;
        this._conventions = conventions;
    }
    get isReadRequest() {
        return false;
    }
    createRequest(node) {
        let uri = node.url + "/databases/" + node.database + "/docs?id=" + encodeURIComponent(this._id);
        if (this._skipPatchIfChangeVectorMismatch) {
            uri += "&skipPatchIfChangeVectorMismatch=true";
        }
        if (this._returnDebugInformation) {
            uri += "&debug=true";
        }
        if (this._test) {
            uri += "&test=true";
        }
        const body = JSON.stringify(this._patch);
        const req = {
            method: "PATCH",
            uri,
            headers: this._headers().typeAppJson().build(),
            body
        };
        this._addChangeVectorIfNotNull(this._changeVector, req);
        return req;
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!bodyStream) {
                return;
            }
            let body;
            this.result = yield this._pipeline()
                .collectBody(_ => body = _)
                .parseJsonAsync()
                .jsonKeysTransform("Patch", this._conventions)
                .process(bodyStream);
            return body;
        });
    }
}
exports.PatchCommand = PatchCommand;
