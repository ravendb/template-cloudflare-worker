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
exports.SubscriptionWorker = void 0;
const LogUtil_1 = require("../../Utility/LogUtil");
const SubscriptionBatch_1 = require("./SubscriptionBatch");
const StringUtil_1 = require("../../Utility/StringUtil");
const Exceptions_1 = require("../../Exceptions");
const TcpUtils_1 = require("../../Utility/TcpUtils");
const stream = require("readable-stream");
const TcpConnectionHeaderMessage_1 = require("../../ServerWide/Tcp/TcpConnectionHeaderMessage");
const TcpNegotiation_1 = require("../../ServerWide/Tcp/TcpNegotiation");
const events_1 = require("events");
const TimeUtil_1 = require("../../Utility/TimeUtil");
const ObjectUtil_1 = require("../../Utility/ObjectUtil");
const PromiseUtil_1 = require("../../Utility/PromiseUtil");
const Parser = require("stream-json/Parser");
const StreamValues = require("stream-json/streamers/StreamValues");
const TransformKeysJsonStream_1 = require("../../Mapping/Json/Streams/TransformKeysJsonStream");
const TransformJsonKeysProfiles_1 = require("../../Mapping/Json/Streams/TransformJsonKeysProfiles");
const RequestExecutor_1 = require("../../Http/RequestExecutor");
const GetTcpInfoCommand_1 = require("../../ServerWide/Commands/GetTcpInfoCommand");
const GetTcpInfoForRemoteTaskCommand_1 = require("../Commands/GetTcpInfoForRemoteTaskCommand");
const os = require("os");
class SubscriptionWorker {
    constructor(options, withRevisions, documentStore, dbName) {
        this._logger = (0, LogUtil_1.getLogger)({ module: "SubscriptionWorker" });
        this._processingCanceled = false;
        this._disposed = false;
        this._forcedTopologyUpdateAttempts = 0;
        this._emitter = new events_1.EventEmitter();
        this._documentType = options.documentType;
        this._options = Object.assign({
            strategy: "OpenIfFree",
            maxDocsPerBatch: 4096,
            timeToWaitBeforeConnectionRetry: 5 * 1000,
            maxErroneousPeriod: 5 * 60 * 1000
        }, options);
        this._revisions = withRevisions;
        if (StringUtil_1.StringUtil.isNullOrEmpty(options.subscriptionName)) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "SubscriptionConnectionOptions must specify the subscriptionName");
        }
        this._store = documentStore;
        this._dbName = documentStore.getEffectiveDatabase(dbName);
    }
    dispose() {
        var _a;
        if (this._disposed) {
            return;
        }
        this._disposed = true;
        this._processingCanceled = true;
        this._closeTcpClient();
        if (this._parser) {
            this._parser.end();
        }
        (_a = this._subscriptionLocalRequestExecutor) === null || _a === void 0 ? void 0 : _a.dispose();
    }
    get currentNodeTag() {
        return this._redirectNode ? this._redirectNode.clusterTag : null;
    }
    get subscriptionName() {
        return this._options ? this._options.subscriptionName : null;
    }
    _connectToServer() {
        return __awaiter(this, void 0, void 0, function* () {
            const command = new GetTcpInfoForRemoteTaskCommand_1.GetTcpInfoForRemoteTaskCommand("Subscription/" + this._dbName, this._dbName, this._options ? this._options.subscriptionName : null, true);
            const requestExecutor = this._store.getRequestExecutor(this._dbName);
            let tcpInfo;
            if (this._redirectNode) {
                try {
                    yield requestExecutor.execute(command, null, {
                        chosenNode: this._redirectNode,
                        nodeIndex: null,
                        shouldRetry: false
                    });
                    tcpInfo = command.result;
                }
                catch (e) {
                    if (e.name === "ClientVersionMismatchException") {
                        tcpInfo = yield this._legacyTryGetTcpInfo(requestExecutor, this._redirectNode);
                    }
                    else {
                        this._redirectNode = null;
                        throw e;
                    }
                }
            }
            else {
                try {
                    yield requestExecutor.execute(command);
                    tcpInfo = command.result;
                    if (tcpInfo.nodeTag) {
                        this._redirectNode = requestExecutor.getTopology().nodes
                            .find(x => x.clusterTag === tcpInfo.nodeTag);
                    }
                }
                catch (e) {
                    if (e.name === "ClientVersionMismatchException") {
                        tcpInfo = yield this._legacyTryGetTcpInfo(requestExecutor);
                    }
                    else {
                        throw e;
                    }
                }
            }
            const result = yield TcpUtils_1.TcpUtils.connectSecuredTcpSocket(tcpInfo, command.result.certificate, this._store.authOptions, "Subscription", (chosenUrl, tcpInfo, socket) => this._negotiateProtocolVersionForSubscription(chosenUrl, tcpInfo, socket));
            this._tcpClient = result.socket;
            this._supportedFeatures = result.supportedFeatures;
            if (this._supportedFeatures.protocolVersion <= 0) {
                (0, Exceptions_1.throwError)("InvalidOperationException", this._options.subscriptionName
                    + " : TCP negotiation resulted with an invalid protocol version: "
                    + this._supportedFeatures.protocolVersion);
            }
            yield this._sendOptions(this._tcpClient, this._options);
            if (this._subscriptionLocalRequestExecutor) {
                this._subscriptionLocalRequestExecutor.dispose();
            }
            this._subscriptionLocalRequestExecutor = RequestExecutor_1.RequestExecutor.createForSingleNodeWithoutConfigurationUpdates(command.getRequestedNode().url, this._dbName, {
                authOptions: requestExecutor.getAuthOptions(),
                documentConventions: requestExecutor.conventions
            });
            this._store.registerEvents(this._subscriptionLocalRequestExecutor);
            return this._tcpClient;
        });
    }
    _negotiateProtocolVersionForSubscription(chosenUrl, tcpInfo, socket) {
        return __awaiter(this, void 0, void 0, function* () {
            const databaseName = this._store.getEffectiveDatabase(this._dbName);
            const parameters = {
                database: databaseName,
                operation: "Subscription",
                version: TcpConnectionHeaderMessage_1.SUBSCRIPTION_TCP_VERSION,
                readResponseAndGetVersionCallback: url => this._readServerResponseAndGetVersion(url, socket),
                destinationNodeTag: this.currentNodeTag,
                destinationUrl: chosenUrl,
                destinationServerId: tcpInfo.serverId
            };
            return TcpNegotiation_1.TcpNegotiation.negotiateProtocolVersion(socket, parameters);
        });
    }
    _legacyTryGetTcpInfo(requestExecutor, node) {
        return __awaiter(this, void 0, void 0, function* () {
            const tcpCommand = new GetTcpInfoCommand_1.GetTcpInfoCommand("Subscription/" + this._dbName, this._dbName);
            try {
                if (node) {
                    yield requestExecutor.execute(tcpCommand, null, {
                        chosenNode: node,
                        shouldRetry: false,
                        nodeIndex: undefined
                    });
                }
                else {
                    yield requestExecutor.execute(tcpCommand, null);
                }
            }
            catch (e) {
                this._redirectNode = null;
                throw e;
            }
            return tcpCommand.result;
        });
    }
    _sendOptions(socket, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const payload = {
                SubscriptionName: options.subscriptionName,
                TimeToWaitBeforeConnectionRetry: TimeUtil_1.TimeUtil.millisToTimeSpan(options.timeToWaitBeforeConnectionRetry),
                IgnoreSubscriberErrors: options.ignoreSubscriberErrors || false,
                Strategy: options.strategy,
                MaxDocsPerBatch: options.maxDocsPerBatch,
                MaxErroneousPeriod: TimeUtil_1.TimeUtil.millisToTimeSpan(options.maxErroneousPeriod),
                CloseWhenNoDocsLeft: options.closeWhenNoDocsLeft || false,
            };
            return new Promise(resolve => {
                socket.write(JSON.stringify(payload, null, 0), () => resolve());
            });
        });
    }
    _ensureParser(socket) {
        const keysTransformProfile = (0, TransformJsonKeysProfiles_1.getTransformJsonKeysProfile)(this._revisions
            ? "SubscriptionRevisionsResponsePayload"
            : "SubscriptionResponsePayload", this._store.conventions);
        this._parser = stream.pipeline([
            socket,
            new Parser({ jsonStreaming: true, streamValues: false }),
            new TransformKeysJsonStream_1.TransformKeysJsonStream(keysTransformProfile),
            new StreamValues()
        ], err => {
            if (err && !socket.destroyed) {
                this._emitter.emit("error", err);
            }
        });
        this._parser.pause();
    }
    _readServerResponseAndGetVersion(url, socket) {
        return __awaiter(this, void 0, void 0, function* () {
            this._ensureParser(socket);
            const x = yield this._readNextObject();
            switch (x.status) {
                case "Ok":
                    return x.version;
                case "AuthorizationFailed":
                    (0, Exceptions_1.throwError)("AuthorizationException", "Cannot access database " + this._dbName + " because " + x.message);
                    return;
                case "TcpVersionMismatch":
                    if (x.version !== TcpNegotiation_1.OUT_OF_RANGE_STATUS) {
                        return x.version;
                    }
                    yield this._sendDropMessage(x.value);
                    (0, Exceptions_1.throwError)("InvalidOperationException", "Can't connect to database " + this._dbName + " because: " + x.message);
                    break;
                case "InvalidNetworkTopology":
                    (0, Exceptions_1.throwError)("InvalidNetworkTopologyException", "Failed to connect to url " + url + " because " + x.message);
            }
            return x.version;
        });
    }
    _sendDropMessage(reply) {
        const dropMsg = {
            operation: "Drop",
            databaseName: this._dbName,
            operationVersion: TcpConnectionHeaderMessage_1.SUBSCRIPTION_TCP_VERSION,
            info: "Couldn't agree on subscription tcp version ours: "
                + TcpConnectionHeaderMessage_1.SUBSCRIPTION_TCP_VERSION + " theirs: " + reply.version
        };
        const payload = ObjectUtil_1.ObjectUtil.transformObjectKeys(dropMsg, {
            defaultTransform: "pascal"
        });
        return new Promise(resolve => {
            this._tcpClient.write(JSON.stringify(payload, null, 0), () => resolve());
        });
    }
    _assertConnectionState(connectionStatus) {
        if (connectionStatus.type === "Error") {
            if (connectionStatus.exception.includes("DatabaseDoesNotExistException")) {
                (0, Exceptions_1.throwError)("DatabaseDoesNotExistException", this._dbName + " does not exists. " + connectionStatus.message);
            }
        }
        if (connectionStatus.type !== "ConnectionStatus") {
            let message = "Server returned illegal type message when expecting connection status, was:" + connectionStatus.type;
            if (connectionStatus.type === "Error") {
                message += ". Exception: " + connectionStatus.exception;
            }
            (0, Exceptions_1.throwError)("InvalidOperationException", message);
        }
        switch (connectionStatus.status) {
            case "Accepted":
                break;
            case "InUse":
                (0, Exceptions_1.throwError)("SubscriptionInUseException", "Subscription with id '" + this._options.subscriptionName
                    + "' cannot be opened, because it's in use and the connection strategy is "
                    + this._options.strategy);
                break;
            case "Closed": {
                const canReconnect = connectionStatus.data.CanReconnect || false;
                const subscriptionClosedError = (0, Exceptions_1.getError)("SubscriptionClosedException", "Subscription with id '" + this._options.subscriptionName
                    + "' was closed. " + connectionStatus.exception);
                subscriptionClosedError.canReconnect = canReconnect;
                throw subscriptionClosedError;
            }
            case "Invalid":
                (0, Exceptions_1.throwError)("SubscriptionInvalidStateException", "Subscription with id '" + this._options.subscriptionName
                    + "' cannot be opened, because it is in invalid state. " + connectionStatus.exception);
                break;
            case "NotFound":
                (0, Exceptions_1.throwError)("SubscriptionDoesNotExistException", "Subscription with id '" + this._options.subscriptionName
                    + "' cannot be opened, because it does not exist. " + connectionStatus.exception);
                break;
            case "Redirect": {
                if (this._options.strategy === "WaitForFree") {
                    if (connectionStatus.data) {
                        const registerConnectionDurationInTicks = connectionStatus.data["RegisterConnectionDurationInTicks"];
                        if (registerConnectionDurationInTicks / 10000 >= this._options.maxErroneousPeriod) {
                            this._lastConnectionFailure = null;
                        }
                    }
                }
                const data = connectionStatus.data;
                const appropriateNode = data.redirectedTag;
                const currentNode = data.currentTag;
                const reasons = data.reasons;
                const error = (0, Exceptions_1.getError)("SubscriptionDoesNotBelongToNodeException", "Subscription with id '" + this._options.subscriptionName
                    + "' cannot be processed by current node '" + currentNode + "', it will be redirected to " + appropriateNode + os.EOL + reasons);
                error.appropriateNode = appropriateNode;
                throw error;
            }
            case "ConcurrencyReconnect":
                (0, Exceptions_1.throwError)("SubscriptionChangeVectorUpdateConcurrencyException", connectionStatus.message);
                break;
            default:
                (0, Exceptions_1.throwError)("InvalidOperationException", "Subscription '" + this._options.subscriptionName
                    + "' could not be opened, reason: " + connectionStatus.status);
        }
    }
    _processSubscription() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this._processingCanceled) {
                    (0, Exceptions_1.throwError)("OperationCanceledException");
                }
                const socket = yield this._connectToServer();
                let notifiedSubscriber = Promise.resolve();
                let readFromServer = Promise.resolve(null);
                try {
                    if (this._processingCanceled) {
                        (0, Exceptions_1.throwError)("OperationCanceledException");
                    }
                    const tcpClientCopy = this._tcpClient;
                    const connectionStatus = yield this._readNextObject();
                    if (this._processingCanceled) {
                        return;
                    }
                    if (connectionStatus.type !== "ConnectionStatus" || connectionStatus.status !== "Accepted") {
                        this._assertConnectionState(connectionStatus);
                    }
                    this._lastConnectionFailure = null;
                    if (this._processingCanceled) {
                        return;
                    }
                    const batch = new SubscriptionBatch_1.SubscriptionBatch(this._documentType, this._revisions, this._subscriptionLocalRequestExecutor, this._store, this._dbName);
                    while (!this._processingCanceled) {
                        readFromServer = this._readSingleSubscriptionBatchFromServer(batch);
                        try {
                            yield notifiedSubscriber;
                        }
                        catch (err) {
                            this._closeTcpClient();
                            throw err;
                        }
                        const incomingBatch = yield readFromServer;
                        if (this._processingCanceled) {
                            (0, Exceptions_1.throwError)("OperationCanceledException");
                        }
                        const lastReceivedChangeVector = batch.initialize(incomingBatch);
                        notifiedSubscriber = this._emitBatchAndWaitForProcessing(batch)
                            .catch((err) => {
                            this._logger.error(err, "Subscription " + this._options.subscriptionName
                                + ". Subscriber threw an exception on document batch");
                            if (!this._options.ignoreSubscriberErrors) {
                                (0, Exceptions_1.throwError)("SubscriberErrorException", "Subscriber threw an exception in subscription "
                                    + this._options.subscriptionName, err);
                            }
                        })
                            .then(() => {
                            if (tcpClientCopy && tcpClientCopy.writable) {
                                return this._sendAck(lastReceivedChangeVector, tcpClientCopy);
                            }
                        });
                    }
                }
                finally {
                    socket.end();
                    this._parser.end();
                    try {
                        yield notifiedSubscriber;
                    }
                    catch (_a) {
                    }
                    try {
                        yield readFromServer;
                    }
                    catch (_b) {
                    }
                }
            }
            catch (err) {
                if (!this._disposed) {
                    throw err;
                }
            }
        });
    }
    _emitBatchAndWaitForProcessing(batch) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                let listenerCount = this._emitter.listenerCount("batch");
                this._emitter.emit("batch", batch, (error) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        listenerCount--;
                        if (!listenerCount) {
                            resolve();
                        }
                    }
                });
            });
        });
    }
    _readSingleSubscriptionBatchFromServer(batch) {
        return __awaiter(this, void 0, void 0, function* () {
            const incomingBatch = [];
            const includes = [];
            const counterIncludes = [];
            const timeSeriesIncludes = [];
            let endOfBatch = false;
            while (!endOfBatch && !this._processingCanceled) {
                const receivedMessage = yield this._readNextObject();
                if (!receivedMessage || this._processingCanceled) {
                    break;
                }
                switch (receivedMessage.type) {
                    case "Data":
                        incomingBatch.push(receivedMessage);
                        break;
                    case "Includes":
                        includes.push(receivedMessage.includes);
                        break;
                    case "CounterIncludes":
                        counterIncludes.push({ counterIncludes: receivedMessage.includedCounterNames, includes: receivedMessage.counterIncludes });
                        break;
                    case "TimeSeriesIncludes":
                        timeSeriesIncludes.push(receivedMessage.timeSeriesIncludes);
                        break;
                    case "EndOfBatch":
                        endOfBatch = true;
                        break;
                    case "Confirm":
                        this._emitter.emit("afterAcknowledgment", batch);
                        incomingBatch.length = 0;
                        batch.items.length = 0;
                        break;
                    case "ConnectionStatus":
                        this._assertConnectionState(receivedMessage);
                        break;
                    case "Error":
                        this._throwSubscriptionError(receivedMessage);
                        break;
                    default:
                        this._throwInvalidServerResponse(receivedMessage);
                        break;
                }
            }
            return {
                messages: incomingBatch,
                includes,
                counterIncludes,
                timeSeriesIncludes
            };
        });
    }
    _throwInvalidServerResponse(receivedMessage) {
        (0, Exceptions_1.throwError)("InvalidArgumentException", "Unrecognized message " + receivedMessage.type + " type received from server");
    }
    _throwSubscriptionError(receivedMessage) {
        (0, Exceptions_1.throwError)("InvalidOperationException", "Connection terminated by server. Exception: " + (receivedMessage.exception || "None"));
    }
    _readNextObject() {
        return __awaiter(this, void 0, void 0, function* () {
            const stream = this._parser;
            if (this._processingCanceled) {
                return null;
            }
            if (this._disposed) {
                return null;
            }
            if (stream.readable) {
                const data = stream.read();
                if (data) {
                    return data.value;
                }
            }
            return new Promise((resolve, reject) => {
                stream.once("readable", readableListener);
                stream.once("error", errorHandler);
                stream.once("end", endHandler);
                function readableListener() {
                    stream.removeListener("error", errorHandler);
                    stream.removeListener("end", endHandler);
                    resolve();
                }
                function errorHandler(err) {
                    stream.removeListener("readable", readableListener);
                    stream.removeListener("end", endHandler);
                    reject(err);
                }
                function endHandler() {
                    stream.removeListener("readable", readableListener);
                    stream.removeListener("error", errorHandler);
                    reject((0, Exceptions_1.getError)("SubscriptionException", "Subscription stream has ended unexpectedly."));
                }
            })
                .then(() => this._readNextObject());
        });
    }
    _sendAck(lastReceivedChangeVector, networkStream) {
        return __awaiter(this, void 0, void 0, function* () {
            const payload = {
                ChangeVector: lastReceivedChangeVector,
                Type: "Acknowledge"
            };
            return new Promise((resolve, reject) => {
                networkStream.write(JSON.stringify(payload, null, 0), (err) => {
                    err ? reject(err) : resolve();
                });
            });
        });
    }
    _runSubscriptionAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            while (!this._processingCanceled) {
                try {
                    this._closeTcpClient();
                    this._logger.info("Subscription " + this._options.subscriptionName + ". Connecting to server...");
                    yield this._processSubscription();
                }
                catch (error) {
                    if (this._processingCanceled) {
                        if (!this._disposed) {
                            throw error;
                        }
                        return;
                    }
                    this._logger.warn(error, "Subscription "
                        + this._options.subscriptionName + ". Pulling task threw the following exception. ");
                    if (this._shouldTryToReconnect(error)) {
                        yield (0, PromiseUtil_1.delay)(this._options.timeToWaitBeforeConnectionRetry);
                        if (!this._redirectNode) {
                            const reqEx = this._store.getRequestExecutor(this._dbName);
                            const curTopology = reqEx.getTopologyNodes();
                            const nextNodeIndex = (this._forcedTopologyUpdateAttempts++) % curTopology.length;
                            try {
                                const indexAndNode = yield reqEx.getRequestedNode(curTopology[nextNodeIndex].clusterTag, true);
                                this._redirectNode = indexAndNode.currentNode;
                                this._logger.info("Subscription " + this._options.subscriptionName + ". Will modify redirect node from null to " + this._redirectNode.clusterTag);
                            }
                            catch (e) {
                                this._logger.info("Subscription '" + this._options.subscriptionName + "'. Could not select the redirect node will keep it null.");
                            }
                        }
                        this._emitter.emit("connectionRetry", error);
                    }
                    else {
                        this._logger.error(error, "Connection to subscription "
                            + this._options.subscriptionName + " have been shut down because of an error.");
                        throw error;
                    }
                }
            }
        });
    }
    _assertLastConnectionFailure(lastError) {
        if (!this._lastConnectionFailure) {
            this._lastConnectionFailure = new Date();
            return;
        }
        const maxErroneousPeriod = this._options.maxErroneousPeriod;
        const erroneousPeriodDuration = new Date().getTime() - this._lastConnectionFailure.getTime();
        if (erroneousPeriodDuration > maxErroneousPeriod) {
            (0, Exceptions_1.throwError)("SubscriptionInvalidStateException", "Subscription connection was in invalid state for more than "
                + maxErroneousPeriod + " and therefore will be terminated.", lastError);
        }
    }
    _shouldTryToReconnect(ex) {
        if (ex.name === "SubscriptionDoesNotBelongToNodeException") {
            const requestExecutor = this._store.getRequestExecutor(this._dbName);
            const appropriateNode = ex.appropriateNode;
            if (!appropriateNode) {
                this._assertLastConnectionFailure(ex);
                this._redirectNode = null;
                return true;
            }
            const nodeToRedirectTo = requestExecutor.getTopologyNodes()
                .find(x => x.clusterTag === appropriateNode);
            if (!nodeToRedirectTo) {
                (0, Exceptions_1.throwError)("InvalidOperationException", "Could not redirect to " + appropriateNode
                    + ", because it was not found in local topology, even after retrying");
            }
            this._redirectNode = nodeToRedirectTo;
            return true;
        }
        else if (ex.name === "NodeIsPassiveException") {
            this._redirectNode = null;
            return true;
        }
        else if (ex.name === "SubscriptionChangeVectorUpdateConcurrencyException") {
            return true;
        }
        else if (ex.name === "SubscriptionClosedException") {
            if (ex.canReconnect) {
                return true;
            }
            this._processingCanceled = true;
            return false;
        }
        if (ex.name === "SubscriptionInUseException"
            || ex.name === "SubscriptionDoesNotExistException"
            || ex.name === "SubscriptionInvalidStateException"
            || ex.name === "DatabaseDoesNotExistException"
            || ex.name === "AuthorizationException"
            || ex.name === "AllTopologyNodesDownException"
            || ex.name === "SubscriberErrorException") {
            this._processingCanceled = true;
            return false;
        }
        this._emitter.emit("unexpectedSubscriptionError", ex);
        this._assertLastConnectionFailure(ex);
        return true;
    }
    _closeTcpClient() {
        if (this._tcpClient) {
            this._tcpClient.end();
        }
    }
    on(event, handler) {
        this._emitter.on(event, handler);
        if (event === "batch" && !this._subscriptionTask) {
            this._subscriptionTask = this._runSubscriptionAsync()
                .catch(err => { this._emitter.emit("error", err); })
                .then(() => { this._emitter.emit("end"); });
        }
        return this;
    }
    off(event, handler) {
        this._emitter.removeListener(event, handler);
        return this;
    }
    removeListener(event, handler) {
        this.removeListener(event, handler);
        return this;
    }
}
exports.SubscriptionWorker = SubscriptionWorker;
