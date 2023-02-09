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
exports.DocumentSessionRevisions = void 0;
const GetRevisionOperation_1 = require("./Operations/GetRevisionOperation");
const TypeUtil_1 = require("../../Utility/TypeUtil");
const DocumentSessionRevisionsBase_1 = require("./DocumentSessionRevisionsBase");
const LazyRevisionOperations_1 = require("./Operations/Lazy/LazyRevisionOperations");
const GetRevisionsCountOperation_1 = require("./Operations/GetRevisionsCountOperation");
class DocumentSessionRevisions extends DocumentSessionRevisionsBase_1.DocumentSessionRevisionsBase {
    constructor(session) {
        super(session);
    }
    get lazily() {
        return new LazyRevisionOperations_1.LazyRevisionOperations(this._session);
    }
    getFor(id, options) {
        return __awaiter(this, void 0, void 0, function* () {
            options = Object.assign({
                pageSize: 25,
                start: 0
            }, options || {});
            const operation = new GetRevisionOperation_1.GetRevisionOperation(this._session, id, options.start, options.pageSize);
            const command = operation.createRequest();
            if (!command) {
                return operation.getRevisionsFor(options.documentType);
            }
            if (this._sessionInfo) {
                this._sessionInfo.incrementRequestCount();
            }
            yield this._requestExecutor.execute(command, this._sessionInfo);
            operation.result = command.result;
            return operation.getRevisionsFor(options.documentType);
        });
    }
    getMetadataFor(id, options) {
        return __awaiter(this, void 0, void 0, function* () {
            options = Object.assign({
                pageSize: 25,
                start: 0
            }, options || {});
            const operation = new GetRevisionOperation_1.GetRevisionOperation(this._session, id, options.start, options.pageSize, true);
            const command = operation.createRequest();
            if (!command) {
                return operation.getRevisionsMetadataFor();
            }
            if (this._sessionInfo) {
                this._sessionInfo.incrementRequestCount();
            }
            yield this._requestExecutor.execute(command, this._sessionInfo);
            operation.result = command.result;
            return operation.getRevisionsMetadataFor();
        });
    }
    get(changeVectorOrVectorsOrId, documentTypeOrDate, documentTypeForDateOverload) {
        return __awaiter(this, void 0, void 0, function* () {
            const documentType = TypeUtil_1.TypeUtil.isDocumentType(documentTypeOrDate)
                ? documentTypeOrDate
                : undefined;
            if (TypeUtil_1.TypeUtil.isDate(documentTypeOrDate)) {
                return this._getByIdAndDate(changeVectorOrVectorsOrId, documentTypeOrDate, documentTypeForDateOverload);
            }
            else {
                return this._get(changeVectorOrVectorsOrId, documentType);
            }
        });
    }
    _getByIdAndDate(id, date, clazz) {
        return __awaiter(this, void 0, void 0, function* () {
            const operation = new GetRevisionOperation_1.GetRevisionOperation(this._session, id, date);
            const command = operation.createRequest();
            if (!command) {
                return operation.getRevision(clazz);
            }
            if (this._sessionInfo) {
                this._sessionInfo.incrementRequestCount();
            }
            yield this._requestExecutor.execute(command, this._sessionInfo);
            operation.result = command.result;
            return operation.getRevision(clazz);
        });
    }
    _get(changeVectorOrVectors, documentType) {
        return __awaiter(this, void 0, void 0, function* () {
            const operation = new GetRevisionOperation_1.GetRevisionOperation(this._session, changeVectorOrVectors);
            const command = operation.createRequest();
            if (!command) {
                return TypeUtil_1.TypeUtil.isArray(changeVectorOrVectors)
                    ? operation.getRevisions(documentType)
                    : operation.getRevision(documentType);
            }
            if (this._sessionInfo) {
                this._sessionInfo.incrementRequestCount();
            }
            yield this._requestExecutor.execute(command, this._sessionInfo);
            operation.result = command.result;
            return TypeUtil_1.TypeUtil.isArray(changeVectorOrVectors)
                ? operation.getRevisions(documentType)
                : operation.getRevision(documentType);
        });
    }
    getCountFor(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const operation = new GetRevisionsCountOperation_1.GetRevisionsCountOperation(id);
            const command = operation.createRequest();
            if (this._sessionInfo) {
                this._sessionInfo.incrementRequestCount();
            }
            yield this._requestExecutor.execute(command, this._sessionInfo);
            return command.result;
        });
    }
}
exports.DocumentSessionRevisions = DocumentSessionRevisions;
