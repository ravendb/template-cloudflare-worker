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
exports.GetStatisticsCommand = exports.GetStatisticsOperation = void 0;
const RavenCommand_1 = require("../../Http/RavenCommand");
class GetStatisticsOperation {
    constructor(debugTag, nodeTag) {
        this._debugTag = debugTag;
        this._nodeTag = nodeTag;
    }
    get resultType() {
        return "CommandResult";
    }
    getCommand(conventions) {
        return new GetStatisticsCommand(this._debugTag, this._nodeTag);
    }
}
exports.GetStatisticsOperation = GetStatisticsOperation;
class GetStatisticsCommand extends RavenCommand_1.RavenCommand {
    constructor(debugTag, nodeTag) {
        super();
        this._debugTag = debugTag;
        this._selectedNodeTag = nodeTag;
    }
    createRequest(node) {
        let uri = `${node.url}/databases/${node.database}/stats`;
        if (this._debugTag) {
            uri += "?" + this._debugTag;
        }
        return { uri };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._parseResponseDefaultAsync(bodyStream);
        });
    }
    get isReadRequest() {
        return true;
    }
}
exports.GetStatisticsCommand = GetStatisticsCommand;
