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
exports.GetConnectionStringCommand = exports.GetConnectionStringsOperation = void 0;
const ConnectionString_1 = require("../Etl/ConnectionString");
const RavenCommand_1 = require("../../../Http/RavenCommand");
class GetConnectionStringsOperation {
    constructor(connectionStringName, type) {
        this._connectionStringName = connectionStringName;
        this._type = type;
    }
    getCommand(conventions) {
        return new GetConnectionStringCommand(this._connectionStringName, this._type);
    }
    get resultType() {
        return "CommandResult";
    }
}
exports.GetConnectionStringsOperation = GetConnectionStringsOperation;
class GetConnectionStringCommand extends RavenCommand_1.RavenCommand {
    constructor(connectionStringName, type) {
        super();
        this._connectionStringName = connectionStringName;
        this._type = type;
    }
    get isReadRequest() {
        return true;
    }
    createRequest(node) {
        let uri = node.url + "/databases/" + node.database + "/admin/connection-strings";
        if (this._connectionStringName) {
            uri += "?connectionStringName=" + encodeURIComponent(this._connectionStringName) + "&type=" + this._type;
        }
        return {
            method: "GET",
            uri
        };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!bodyStream) {
                return;
            }
            let body = "";
            this.result = yield this._defaultPipeline(_ => body += _).process(bodyStream);
            if (this.result.ravenConnectionStrings) {
                this.result.ravenConnectionStrings = Object.entries(this.result.ravenConnectionStrings)
                    .reduce(((previousValue, currentValue) => {
                    previousValue[currentValue[0]] = Object.assign(new ConnectionString_1.RavenConnectionString(), currentValue[1]);
                    return previousValue;
                }), {});
            }
            if (this.result.sqlConnectionStrings) {
                this.result.sqlConnectionStrings = Object.entries(this.result.sqlConnectionStrings)
                    .reduce(((previousValue, currentValue) => {
                    previousValue[currentValue[0]] = Object.assign(new ConnectionString_1.SqlConnectionString(), currentValue[1]);
                    return previousValue;
                }), {});
            }
            if (this.result.olapConnectionStrings) {
                this.result.olapConnectionStrings = Object.entries(this.result.olapConnectionStrings)
                    .reduce(((previousValue, currentValue) => {
                    previousValue[currentValue[0]] = Object.assign(new ConnectionString_1.OlapConnectionString(), currentValue[1]);
                    return previousValue;
                }), {});
            }
            return body;
        });
    }
}
exports.GetConnectionStringCommand = GetConnectionStringCommand;
