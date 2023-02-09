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
exports.QueryStreamCommand = void 0;
const RavenCommand_1 = require("../../Http/RavenCommand");
const IndexQuery_1 = require("../Queries/IndexQuery");
const Exceptions_1 = require("../../Exceptions");
class QueryStreamCommand extends RavenCommand_1.RavenCommand {
    constructor(conventions, query) {
        super();
        if (!conventions) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Conventions cannot be null.");
        }
        if (!query) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Query cannot be null.");
        }
        this._conventions = conventions;
        this._indexQuery = query;
        this._responseType = "Empty";
    }
    createRequest(node) {
        return {
            method: "POST",
            uri: `${node.url}/databases/${node.database}/streams/queries`,
            body: (0, IndexQuery_1.writeIndexQuery)(this._conventions, this._indexQuery),
            headers: this._headers().typeAppJson().build()
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
exports.QueryStreamCommand = QueryStreamCommand;
