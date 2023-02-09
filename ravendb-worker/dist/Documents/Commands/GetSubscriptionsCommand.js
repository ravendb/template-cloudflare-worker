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
exports.GetSubscriptionsCommand = void 0;
const RavenCommand_1 = require("../../Http/RavenCommand");
class GetSubscriptionsCommand extends RavenCommand_1.RavenCommand {
    constructor(start, pageSize) {
        super();
        this._start = start;
        this._pageSize = pageSize;
    }
    createRequest(node) {
        const uri = node.url + "/databases/" + node.database
            + "/subscriptions?start=" + this._start + "&pageSize=" + this._pageSize;
        return {
            uri
        };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!bodyStream) {
                this.result = null;
                return;
            }
            let body = null;
            const data = yield this._defaultPipeline(_ => body = _)
                .process(bodyStream);
            const results = data["results"];
            if (!results) {
                this._throwInvalidResponse();
                return;
            }
            this.result = results;
            return body;
        });
    }
    get isReadRequest() {
        return true;
    }
}
exports.GetSubscriptionsCommand = GetSubscriptionsCommand;
