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
exports.GetCollectionStatisticsCommand = exports.GetCollectionStatisticsOperation = void 0;
const RavenCommand_1 = require("../../Http/RavenCommand");
const Serializer_1 = require("../../Mapping/Json/Serializer");
class GetCollectionStatisticsOperation {
    getCommand(conventions) {
        return new GetCollectionStatisticsCommand();
    }
    get resultType() {
        return "CommandResult";
    }
}
exports.GetCollectionStatisticsOperation = GetCollectionStatisticsOperation;
class GetCollectionStatisticsCommand extends RavenCommand_1.RavenCommand {
    constructor() {
        super();
    }
    get isReadRequest() {
        return true;
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + node.database + "/collections/stats";
        return { uri };
    }
    get _serializer() {
        return Serializer_1.JsonSerializer.getDefault();
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!bodyStream) {
                this._throwInvalidResponse();
            }
            let body = null;
            this.result = yield this._defaultPipeline(_ => body = _)
                .collectBody()
                .objectKeysTransform({
                defaultTransform: "camel",
                ignorePaths: [/^collections\./i]
            })
                .process(bodyStream);
            return body;
        });
    }
}
exports.GetCollectionStatisticsCommand = GetCollectionStatisticsCommand;
