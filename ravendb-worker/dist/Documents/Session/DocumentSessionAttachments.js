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
exports.DocumentSessionAttachments = void 0;
const DocumentSessionAttachmentsBase_1 = require("./DocumentSessionAttachmentsBase");
const HeadAttachmentCommand_1 = require("../Commands/HeadAttachmentCommand");
const GetAttachmentOperation_1 = require("../Operations/Attachments/GetAttachmentOperation");
class DocumentSessionAttachments extends DocumentSessionAttachmentsBase_1.DocumentSessionAttachmentsBase {
    constructor(session) {
        super(session);
    }
    exists(documentId, name) {
        return __awaiter(this, void 0, void 0, function* () {
            const command = new HeadAttachmentCommand_1.HeadAttachmentCommand(documentId, name, null);
            this._session.incrementRequestCount();
            yield this._requestExecutor.execute(command, this._sessionInfo);
            return !!command.result;
        });
    }
    get(idOrEntity, name) {
        return __awaiter(this, void 0, void 0, function* () {
            let docId;
            if (typeof idOrEntity !== "string") {
                const document = this._session.documentsByEntity.get(idOrEntity);
                if (!document) {
                    this._throwEntityNotInSessionOrMissingId(idOrEntity);
                }
                docId = document.id;
            }
            else {
                docId = idOrEntity;
            }
            const operation = new GetAttachmentOperation_1.GetAttachmentOperation(docId, name, "Document", null);
            this._session.incrementRequestCount();
            return yield this._session.operations.send(operation, this._sessionInfo);
        });
    }
    getRevision(documentId, name, changeVector) {
        return __awaiter(this, void 0, void 0, function* () {
            const operation = new GetAttachmentOperation_1.GetAttachmentOperation(documentId, name, "Revision", changeVector);
            this._session.incrementRequestCount();
            return this._session.operations.send(operation, this._sessionInfo);
        });
    }
}
exports.DocumentSessionAttachments = DocumentSessionAttachments;
