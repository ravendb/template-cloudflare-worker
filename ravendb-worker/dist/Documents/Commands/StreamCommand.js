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
exports.StreamCommand = void 0;
const RavenCommand_1 = require("../../Http/RavenCommand");
const Exceptions_1 = require("../../Exceptions");
class StreamCommand extends RavenCommand_1.RavenCommand {
    constructor(url) {
        super();
        if (!url) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Url cannot be null.");
        }
        this._url = url;
        this._responseType = "Empty";
    }
    createRequest(node) {
        return {
            uri: `${node.url}/databases/${node.database}/${this._url}`
        };
    }
    processResponse(cache, response, bodyStream, url) {
        return __awaiter(this, void 0, void 0, function* () {
            this.result = {
                response,
                stream: bodyStream
            };
            return "Manually";
        });
    }
    get isReadRequest() {
        return true;
    }
}
exports.StreamCommand = StreamCommand;
