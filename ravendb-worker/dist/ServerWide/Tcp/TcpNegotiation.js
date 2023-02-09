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
exports.TcpNegotiation = exports.OUT_OF_RANGE_STATUS = void 0;
const LogUtil_1 = require("../../Utility/LogUtil");
const TcpConnectionHeaderMessage_1 = require("./TcpConnectionHeaderMessage");
const Exceptions_1 = require("../../Exceptions");
const log = (0, LogUtil_1.getLogger)({ module: "ClusterRequestExecutor" });
exports.OUT_OF_RANGE_STATUS = -1;
const DROP_STATUS = -2;
class TcpNegotiation {
    static negotiateProtocolVersion(socket, parameters) {
        return __awaiter(this, void 0, void 0, function* () {
            log.info("Start negotiation for " + parameters.operation
                + " operation with " + parameters.destinationNodeTag || parameters.destinationUrl);
            let currentRef = parameters.version;
            while (true) {
                yield this._sendTcpVersionInfo(socket, parameters, currentRef);
                const version = yield parameters.readResponseAndGetVersionCallback(parameters.destinationUrl, socket);
                log.info("Read response from " + (parameters.sourceNodeTag || parameters.destinationUrl)
                    + " for " + parameters.operation + ", received version is '" + version + "'");
                if (version === currentRef) {
                    break;
                }
                if (version === DROP_STATUS) {
                    return (0, TcpConnectionHeaderMessage_1.getSupportedFeaturesFor)("Drop", TcpConnectionHeaderMessage_1.DROP_BASE_LINE);
                }
                const status = (0, TcpConnectionHeaderMessage_1.operationVersionSupported)(parameters.operation, version, x => currentRef = x);
                if (status === "OutOfRange") {
                    yield this._sendTcpVersionInfo(socket, parameters, exports.OUT_OF_RANGE_STATUS);
                    (0, Exceptions_1.throwError)("InvalidArgumentException", "The " + parameters.operation + " version " + parameters.version
                        + " is out of range, our lowest version is " + currentRef);
                }
                log.info("The version " + version + " is " + status + ", will try to agree on '"
                    + currentRef + "' for " + parameters.operation + " with "
                    + (parameters.destinationNodeTag || parameters.destinationUrl));
            }
            log.info((parameters.destinationNodeTag || parameters.destinationUrl)
                + " agreed on version " + currentRef + " for " + parameters.operation);
            return (0, TcpConnectionHeaderMessage_1.getSupportedFeaturesFor)(parameters.operation, currentRef);
        });
    }
    static _sendTcpVersionInfo(socket, parameters, currentVersion) {
        return __awaiter(this, void 0, void 0, function* () {
            log.info("Send negotiation for " + parameters.operation + " in version " + currentVersion);
            const payload = JSON.stringify({
                DatabaseName: parameters.database,
                Operation: parameters.operation,
                SourceNodeTag: parameters.sourceNodeTag,
                OperationVersion: currentVersion,
                AuthorizeInfo: parameters.authorizeInfo || null
            }, null, 0);
            return new Promise((resolve, reject) => {
                socket.write(payload, (err) => {
                    err ? reject(err) : resolve();
                });
            });
        });
    }
}
exports.TcpNegotiation = TcpNegotiation;
