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
exports.GetDatabaseNamesCommand = exports.GetDatabaseNamesOperation = void 0;
const RavenCommand_1 = require("../../Http/RavenCommand");
class GetDatabaseNamesOperation {
    constructor(start, pageSize) {
        this._start = start;
        this._pageSize = pageSize;
    }
    getCommand(conventions) {
        return new GetDatabaseNamesCommand(this._start, this._pageSize);
    }
    get resultType() {
        return "CommandResult";
    }
}
exports.GetDatabaseNamesOperation = GetDatabaseNamesOperation;
class GetDatabaseNamesCommand extends RavenCommand_1.RavenCommand {
    constructor(start, pageSize) {
        super();
        this._start = start;
        this._pageSize = pageSize;
    }
    get isReadRequest() {
        return true;
    }
    createRequest(node) {
        const uri = `${node.url}/databases?start=${this._start}&pageSize=${this._pageSize}&namesOnly=true`;
        return { uri };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!bodyStream) {
                this._throwInvalidResponse();
                return;
            }
            let body = null;
            const results = yield this._defaultPipeline(_ => body = _)
                .process(bodyStream);
            const { databases } = results;
            if (!databases || !Array.isArray(databases)) {
                this._throwInvalidResponse();
            }
            this.result = databases;
            return body;
        });
    }
}
exports.GetDatabaseNamesCommand = GetDatabaseNamesCommand;
