"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoveAttachmentCommandData = void 0;
const StringUtil_1 = require("../../../Utility/StringUtil");
const Exceptions_1 = require("../../../Exceptions");
class MoveAttachmentCommandData {
    constructor(documentId, name, destinationDocumentId, destinationName, changeVector) {
        if (StringUtil_1.StringUtil.isNullOrWhitespace(documentId)) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "DocumentId is required.");
        }
        if (StringUtil_1.StringUtil.isNullOrWhitespace(name)) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Name is required.");
        }
        if (StringUtil_1.StringUtil.isNullOrWhitespace(destinationDocumentId)) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "DestinationDocumentId is required.");
        }
        if (StringUtil_1.StringUtil.isNullOrWhitespace(destinationName)) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "DestinationName is required.");
        }
        this.id = documentId;
        this.name = name;
        this.changeVector = changeVector;
        this._destinationId = destinationDocumentId;
        this._destinationName = destinationName;
    }
    get type() {
        return "AttachmentMOVE";
    }
    getType() {
        return "AttachmentMOVE";
    }
    serialize(conventions) {
        return {
            Id: this.id,
            Name: this.name,
            DestinationId: this._destinationId,
            DestinationName: this._destinationName,
            ChangeVector: this.changeVector,
            Type: "AttachmentMOVE"
        };
    }
}
exports.MoveAttachmentCommandData = MoveAttachmentCommandData;