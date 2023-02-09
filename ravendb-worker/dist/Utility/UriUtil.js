"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUri = exports.isValidUri = void 0;
const Exceptions_1 = require("../Exceptions");
function isValidUri(uriString) {
    return true;
}
exports.isValidUri = isValidUri;
function validateUri(uriString) {
    if (!isValidUri(uriString)) {
        (0, Exceptions_1.throwError)("InvalidArgumentException", `Uri ${uriString} is invalid.`);
    }
}
exports.validateUri = validateUri;
