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
exports.DetailedDatabaseStatisticsCommand = exports.GetDetailedStatisticsOperation = void 0;
const RavenCommand_1 = require("../../Http/RavenCommand");
class GetDetailedStatisticsOperation {
    constructor(debugTag) {
        this._debugTag = debugTag;
    }
    getCommand(conventions) {
        return new DetailedDatabaseStatisticsCommand(this._debugTag);
    }
    get resultType() {
        return "CommandResult";
    }
}
exports.GetDetailedStatisticsOperation = GetDetailedStatisticsOperation;
class DetailedDatabaseStatisticsCommand extends RavenCommand_1.RavenCommand {
    constructor(debugTag) {
        super();
        this._debugTag = debugTag;
    }
    createRequest(node) {
        let uri = node.url + "/databases/" + node.database + "/stats/detailed";
        if (this._debugTag) {
            uri += "?" + this._debugTag;
        }
        return { uri };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this._parseResponseDefaultAsync(bodyStream);
        });
    }
    get isReadRequest() {
        return false;
    }
}
exports.DetailedDatabaseStatisticsCommand = DetailedDatabaseStatisticsCommand;
