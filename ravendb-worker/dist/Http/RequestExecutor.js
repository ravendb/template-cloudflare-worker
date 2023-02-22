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
exports.RequestExecutor = exports.NodeStatus = void 0;
const os = require("os");
const BluebirdPromise = require("bluebird");
const semaphore = require("semaphore");
const SemaphoreUtil_1 = require("../Utility/SemaphoreUtil");
const LogUtil_1 = require("../Utility/LogUtil");
const Timer_1 = require("../Primitives/Timer");
const ServerNode_1 = require("./ServerNode");
const Topology_1 = require("./Topology");
const GetDatabaseTopologyCommand_1 = require("../ServerWide/Commands/GetDatabaseTopologyCommand");
const StatusCode_1 = require("./StatusCode");
const NodeSelector_1 = require("./NodeSelector");
const Certificate_1 = require("../Auth/Certificate");
const HttpCache_1 = require("./HttpCache");
const Exceptions_1 = require("../Exceptions");
const GetClientConfigurationOperation_1 = require("../Documents/Operations/Configuration/GetClientConfigurationOperation");
const Constants_1 = require("../Constants");
const PromiseUtil = require("../Utility/PromiseUtil");
const GetStatisticsOperation_1 = require("../Documents/Operations/GetStatisticsOperation");
const TypeUtil_1 = require("../Utility/TypeUtil");
const Serializer_1 = require("../Mapping/Json/Serializer");
const UriUtil_1 = require("../Utility/UriUtil");
const StreamUtil = require("../Utility/StreamUtil");
const HttpUtil_1 = require("../Utility/HttpUtil");
const PromiseUtil_1 = require("../Utility/PromiseUtil");
const StringUtil_1 = require("../Utility/StringUtil");
const abort_controller_1 = require("abort-controller");
const events_1 = require("events");
const SessionEvents_1 = require("../Documents/Session/SessionEvents");
const TimeUtil_1 = require("../Utility/TimeUtil");
const UpdateTopologyParameters_1 = require("./UpdateTopologyParameters");
const DatabaseHealthCheckOperation_1 = require("../Documents/Operations/DatabaseHealthCheckOperation");
const DEFAULT_REQUEST_OPTIONS = {};
const log = (0, LogUtil_1.getLogger)({ module: "RequestExecutor" });
class IndexAndResponse {
    constructor(index, response, bodyStream) {
        this.index = index;
        this.response = response;
        this.bodyStream = bodyStream;
    }
}
class NodeStatus {
    constructor(nodeIndex, node, requestExecutor, nodeStatusCallback) {
        this.nodeIndex = nodeIndex;
        this.node = node;
        this.requestExecutor = requestExecutor;
        this._timerPeriodInMs = 100;
        this._nodeStatusCallback = nodeStatusCallback;
    }
    _nextTimerPeriod() {
        if (this._timerPeriodInMs <= 5000) {
            return 5000;
        }
        this._timerPeriodInMs = this._timerPeriodInMs + 100;
        return this._timerPeriodInMs;
    }
    startTimer() {
        this._timer = new Timer_1.Timer(() => {
            if (this.requestExecutor.disposed) {
                this.dispose();
                return;
            }
            return this._nodeStatusCallback(this);
        }, this._timerPeriodInMs);
    }
    updateTimer() {
        this._timer.change(this._nextTimerPeriod());
    }
    dispose() {
        this._timer.dispose();
    }
}
exports.NodeStatus = NodeStatus;
class RequestExecutor {
    constructor(database, authOptions, conventions) {
        this._emitter = new events_1.EventEmitter();
        this._updateDatabaseTopologySemaphore = semaphore();
        this._updateClientConfigurationSemaphore = semaphore();
        this._failedNodesTimers = new Map();
        this._certificate = null;
        this.aggressiveCaching = null;
        this.numberOfServerRequests = 0;
        this._clientConfigurationEtag = "0";
        this._topologyEtag = 0;
        this._log = (0, LogUtil_1.getLogger)({
            module: `${this.constructor.name}-${Math.floor(Math.random() * 10000)}`
        });
        this._cache = new HttpCache_1.HttpCache(conventions.maxHttpCacheSize);
        this._databaseName = database;
        this._lastReturnedResponse = new Date();
        this._conventions = conventions.clone();
        this._authOptions = authOptions;
        this._certificate = Certificate_1.Certificate.createFromOptions(this._authOptions);
        this._setDefaultRequestOptions();
        this._defaultTimeout = conventions.requestTimeout;
        this._secondBroadcastAttemptTimeout = conventions.secondBroadcastAttemptTimeout;
        this._firstBroadcastAttemptTimeout = conventions.firstBroadcastAttemptTimeout;
    }
    get _firstTopologyUpdatePromise() {
        return this._firstTopologyUpdatePromiseInternal;
    }
    set _firstTopologyUpdatePromise(value) {
        this._firstTopologyUpdatePromiseInternal = value;
        if (value) {
            this._firstTopologyUpdateStatus = PromiseUtil_1.PromiseStatusTracker.track(value);
        }
    }
    get customHttpRequestOptions() {
        return this._customHttpRequestOptions;
    }
    set customHttpRequestOptions(value) {
        this._customHttpRequestOptions = value;
        this._setDefaultRequestOptions();
    }
    getAuthOptions() {
        return this._authOptions;
    }
    getTopologyEtag() {
        return this._topologyEtag;
    }
    get lastServerVersion() {
        return this._lastServerVersion;
    }
    get defaultTimeout() {
        return this._defaultTimeout;
    }
    set defaultTimeout(timeout) {
        this._defaultTimeout = timeout;
    }
    get secondBroadcastAttemptTimeout() {
        return this._secondBroadcastAttemptTimeout;
    }
    set secondBroadcastAttemptTimeout(timeout) {
        this._secondBroadcastAttemptTimeout = timeout;
    }
    get firstBroadcastAttemptTimeout() {
        return this._firstBroadcastAttemptTimeout;
    }
    set firstBroadcastAttemptTimeout(timeout) {
        this._firstBroadcastAttemptTimeout = timeout;
    }
    on(event, handler) {
        this._emitter.on(event, handler);
    }
    off(event, handler) {
        this._emitter.off(event, handler);
    }
    _onFailedRequestInvoke(url, e, req, response) {
        const args = new SessionEvents_1.FailedRequestEventArgs(this._databaseName, url, e, req, response);
        this._emitter.emit("failedRequest", args);
    }
    get conventions() {
        return this._conventions;
    }
    getClientConfigurationEtag() {
        return this._clientConfigurationEtag;
    }
    get cache() {
        return this._cache;
    }
    get disposed() {
        return this._disposed;
    }
    getUrl() {
        if (!this._nodeSelector) {
            return null;
        }
        const preferredNode = this._nodeSelector.getPreferredNode();
        return preferredNode
            ? preferredNode.currentNode.url
            : null;
    }
    getTopology() {
        return this._nodeSelector
            ? this._nodeSelector.getTopology()
            : null;
    }
    getHttpAgent() {
        if (this._httpAgent) {
            return this._httpAgent;
        }
        return this._httpAgent = this._createHttpAgent();
    }
    _createHttpAgent() {
        return null;
    }
    getTopologyNodes() {
        const topology = this.getTopology();
        return topology
            ? [...topology.nodes]
            : null;
    }
    static create(initialUrls, database, opts) {
        const { authOptions, documentConventions } = opts || {};
        const executor = new RequestExecutor(database, authOptions, documentConventions);
        executor._firstTopologyUpdatePromise = executor._firstTopologyUpdate(initialUrls, this.GLOBAL_APPLICATION_IDENTIFIER);
        executor._firstTopologyUpdatePromise.catch(TypeUtil_1.TypeUtil.NOOP);
        return executor;
    }
    static createForSingleNodeWithConfigurationUpdates(url, database, opts) {
        const executor = this.createForSingleNodeWithoutConfigurationUpdates(url, database, opts);
        executor._disableClientConfigurationUpdates = false;
        return executor;
    }
    static createForSingleNodeWithoutConfigurationUpdates(url, database, opts) {
        const { authOptions, documentConventions } = opts;
        const initialUrls = RequestExecutor.validateUrls([url], authOptions);
        const executor = new RequestExecutor(database, authOptions, documentConventions);
        const topology = new Topology_1.Topology();
        topology.etag = -1;
        const serverNode = new ServerNode_1.ServerNode({
            url: initialUrls[0],
            database
        });
        topology.nodes = [serverNode];
        executor._nodeSelector = new NodeSelector_1.NodeSelector(topology);
        executor._topologyEtag = RequestExecutor.INITIAL_TOPOLOGY_ETAG;
        executor._disableTopologyUpdates = true;
        executor._disableClientConfigurationUpdates = true;
        return executor;
    }
    _updateClientConfiguration(serverNode) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._disposed) {
                return;
            }
            let semAcquiredContext;
            try {
                semAcquiredContext = (0, SemaphoreUtil_1.acquireSemaphore)(this._updateClientConfigurationSemaphore);
                yield semAcquiredContext.promise;
                yield this._updateClientConfigurationInternal(serverNode);
            }
            finally {
                if (semAcquiredContext) {
                    semAcquiredContext.dispose();
                }
            }
        });
    }
    _updateClientConfigurationInternal(serverNode) {
        return __awaiter(this, void 0, void 0, function* () {
            const oldDisableClientConfigurationUpdates = this._disableClientConfigurationUpdates;
            this._disableClientConfigurationUpdates = true;
            try {
                if (this._disposed) {
                    return;
                }
                const command = new GetClientConfigurationOperation_1.GetClientConfigurationCommand();
                yield this.execute(command, null, {
                    chosenNode: serverNode,
                    nodeIndex: null,
                    shouldRetry: false
                });
                const clientConfigOpResult = command.result;
                if (!clientConfigOpResult) {
                    return;
                }
                this._conventions.updateFrom(clientConfigOpResult.configuration);
                this._clientConfigurationEtag = clientConfigOpResult.etag;
            }
            catch (err) {
                this._log.error(err, "Error getting client configuration.");
            }
            finally {
                this._disableClientConfigurationUpdates = oldDisableClientConfigurationUpdates;
            }
        });
    }
    updateTopology(parameters) {
        if (this._disableTopologyUpdates) {
            return Promise.resolve(false);
        }
        if (this._disposed) {
            return Promise.resolve(false);
        }
        const acquiredSemContext = (0, SemaphoreUtil_1.acquireSemaphore)(this._updateDatabaseTopologySemaphore, { timeout: parameters.timeoutInMs });
        const result = BluebirdPromise.resolve(acquiredSemContext.promise)
            .then(() => __awaiter(this, void 0, void 0, function* () {
            if (this._disposed) {
                return false;
            }
            this._log.info(`Update topology from ${parameters.node.url}.`);
            const getTopology = new GetDatabaseTopologyCommand_1.GetDatabaseTopologyCommand(parameters.debugTag, this.conventions.sendApplicationIdentifier ? parameters.applicationIdentifier : null);
            yield this.execute(getTopology, null, {
                chosenNode: parameters.node,
                nodeIndex: null,
                shouldRetry: false,
            });
            const topology = getTopology.result;
            if (!this._nodeSelector) {
                this._nodeSelector = new NodeSelector_1.NodeSelector(topology);
                if (this.conventions.readBalanceBehavior === "FastestNode") {
                    this._nodeSelector.scheduleSpeedTest();
                }
            }
            else if (this._nodeSelector.onUpdateTopology(topology, parameters.forceUpdate)) {
                this._disposeAllFailedNodesTimers();
                if (this.conventions.readBalanceBehavior === "FastestNode") {
                    this._nodeSelector.scheduleSpeedTest();
                }
            }
            this._topologyEtag = this._nodeSelector.getTopology().etag;
            this._onTopologyUpdatedInvoke(topology);
            return true;
        }), (reason) => {
            if (reason.name === "TimeoutError") {
                return false;
            }
            throw reason;
        })
            .finally(() => {
            acquiredSemContext.dispose();
        });
        return Promise.resolve(result);
    }
    _disposeAllFailedNodesTimers() {
        for (const item of this._failedNodesTimers) {
            item[1].dispose();
        }
        this._failedNodesTimers.clear();
    }
    execute(command, sessionInfo, options) {
        if (options) {
            return this._executeOnSpecificNode(command, sessionInfo, options);
        }
        this._log.info(`Execute command ${command.constructor.name}`);
        const topologyUpdate = this._firstTopologyUpdatePromise;
        const topologyUpdateStatus = this._firstTopologyUpdateStatus;
        if ((topologyUpdate && topologyUpdateStatus.isResolved()) || this._disableTopologyUpdates) {
            const currentIndexAndNode = this.chooseNodeForRequest(command, sessionInfo);
            return this._executeOnSpecificNode(command, sessionInfo, {
                chosenNode: currentIndexAndNode.currentNode,
                nodeIndex: currentIndexAndNode.currentIndex,
                shouldRetry: true
            });
        }
        else {
            return this._unlikelyExecute(command, topologyUpdate, sessionInfo);
        }
    }
    chooseNodeForRequest(cmd, sessionInfo) {
        if (!this._disableTopologyUpdates) {
            if (!StringUtil_1.StringUtil.isNullOrWhitespace(cmd.selectedNodeTag)) {
                return this._nodeSelector.getRequestedNode(cmd.selectedNodeTag);
            }
        }
        if (this.conventions.loadBalanceBehavior === "UseSessionContext") {
            if (sessionInfo && sessionInfo.canUseLoadBalanceBehavior()) {
                return this._nodeSelector.getNodeBySessionId(sessionInfo.getSessionId());
            }
        }
        if (!cmd.isReadRequest) {
            return this._nodeSelector.getPreferredNode();
        }
        switch (this.conventions.readBalanceBehavior) {
            case "None":
                return this._nodeSelector.getPreferredNode();
            case "RoundRobin":
                return this._nodeSelector.getNodeBySessionId(sessionInfo ? sessionInfo.getSessionId() : 0);
            case "FastestNode":
                return this._nodeSelector.getFastestNode();
            default:
                (0, Exceptions_1.throwError)("NotSupportedException", `Invalid read balance behavior: ${this.conventions.readBalanceBehavior}`);
        }
    }
    _unlikelyExecute(command, topologyUpdate, sessionInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._waitForTopologyUpdate(topologyUpdate);
            const currentIndexAndNode = this.chooseNodeForRequest(command, sessionInfo);
            return this._executeOnSpecificNode(command, sessionInfo, {
                chosenNode: currentIndexAndNode.currentNode,
                nodeIndex: currentIndexAndNode.currentIndex,
                shouldRetry: true
            });
        });
    }
    _waitForTopologyUpdate(topologyUpdate) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this._firstTopologyUpdatePromise) {
                    if (!this._lastKnownUrls) {
                        (0, Exceptions_1.throwError)("InvalidOperationException", "No known topology and no previously known one, cannot proceed, likely a bug");
                    }
                    topologyUpdate = this._firstTopologyUpdate(this._lastKnownUrls, null);
                }
                yield topologyUpdate;
            }
            catch (reason) {
                if (this._firstTopologyUpdatePromise === topologyUpdate) {
                    this._firstTopologyUpdatePromise = null;
                }
                this._log.warn(reason, "Error doing topology update.");
                throw reason;
            }
        });
    }
    _updateTopologyCallback() {
        const time = new Date();
        const fiveMinutes = 5 * 60 * 1000;
        if (time.valueOf() - this._lastReturnedResponse.valueOf() <= fiveMinutes) {
            return;
        }
        let serverNode;
        try {
            const selector = this._nodeSelector;
            if (!selector) {
                return;
            }
            const preferredNode = selector.getPreferredNode();
            serverNode = preferredNode.currentNode;
        }
        catch (err) {
            this._log.warn(err, "Couldn't get preferred node Topology from _updateTopologyTimer");
            return;
        }
        const updateParameters = new UpdateTopologyParameters_1.UpdateTopologyParameters(serverNode);
        updateParameters.timeoutInMs = 0;
        updateParameters.debugTag = "timer-callback";
        return this.updateTopology(updateParameters)
            .catch(err => {
            this._log.error(err, "Couldn't update topology from _updateTopologyTimer");
            return null;
        });
    }
    _firstTopologyUpdate(inputUrls, applicationIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            const initialUrls = RequestExecutor.validateUrls(inputUrls, this._authOptions);
            const topologyUpdateErrors = [];
            const tryUpdateTopology = (url, database) => __awaiter(this, void 0, void 0, function* () {
                const serverNode = new ServerNode_1.ServerNode({ url, database });
                try {
                    const updateParameters = new UpdateTopologyParameters_1.UpdateTopologyParameters(serverNode);
                    updateParameters.timeoutInMs = TypeUtil_1.TypeUtil.MAX_INT32;
                    updateParameters.debugTag = "first-topology-update";
                    updateParameters.applicationIdentifier = applicationIdentifier;
                    yield this.updateTopology(updateParameters);
                    this._initializeUpdateTopologyTimer();
                    this._topologyTakenFromNode = serverNode;
                    return true;
                }
                catch (error) {
                    if (error.name === "AuthorizationException") {
                        this._lastKnownUrls = initialUrls;
                        throw error;
                    }
                    if (error.name === "DatabaseDoesNotExistException") {
                        this._lastKnownUrls = initialUrls;
                        throw error;
                    }
                    topologyUpdateErrors.push({ url, error });
                    return false;
                }
            });
            const tryUpdateTopologyOnAllNodes = () => __awaiter(this, void 0, void 0, function* () {
                for (const url of initialUrls) {
                    if (yield tryUpdateTopology(url, this._databaseName)) {
                        return;
                    }
                }
                return false;
            });
            yield tryUpdateTopologyOnAllNodes();
            const topology = new Topology_1.Topology();
            topology.etag = this._topologyEtag;
            let topologyNodes = this.getTopologyNodes();
            if (!topologyNodes) {
                topologyNodes = initialUrls.map(url => {
                    const serverNode = new ServerNode_1.ServerNode({
                        url,
                        database: this._databaseName
                    });
                    serverNode.clusterTag = "!";
                    return serverNode;
                });
            }
            topology.nodes = topologyNodes;
            this._nodeSelector = new NodeSelector_1.NodeSelector(topology);
            if (initialUrls && initialUrls.length > 0) {
                this._initializeUpdateTopologyTimer();
                return;
            }
            this._lastKnownUrls = initialUrls;
            const details = topologyUpdateErrors
                .map(x => `${x.url} -> ${x.error && x.error.stack ? x.error.stack : x.error}`)
                .join(", ");
            this._throwExceptions(details);
        });
    }
    _throwExceptions(details) {
        (0, Exceptions_1.throwError)("InvalidOperationException", "Failed to retrieve database topology from all known nodes"
            + os.EOL + details);
    }
    static validateUrls(initialUrls, authOptions) {
        const cleanUrls = [...Array(initialUrls.length)];
        let requireHttps = !!authOptions;
        for (let index = 0; index < initialUrls.length; index++) {
            const url = initialUrls[index];
            (0, UriUtil_1.validateUri)(url);
            cleanUrls[index] = url.replace(/\/$/, "");
            requireHttps = requireHttps || url.startsWith("https://");
        }
        if (!requireHttps) {
            return cleanUrls;
        }
        for (const url of initialUrls) {
            if (!url.startsWith("http://")) {
                continue;
            }
            if (authOptions && authOptions.certificate) {
                (0, Exceptions_1.throwError)("InvalidOperationException", "The url " + url + " is using HTTP, but a certificate is specified, which require us to use HTTPS");
            }
            (0, Exceptions_1.throwError)("InvalidOperationException", "The url " + url
                + " is using HTTP, but other urls are using HTTPS, and mixing of HTTP and HTTPS is not allowed.");
        }
        return cleanUrls;
    }
    _initializeUpdateTopologyTimer() {
        if (this._updateTopologyTimer || this._disposed) {
            return;
        }
        this._log.info("Initialize update topology timer.");
        const minInMs = 60 * 1000;
        const that = this;
        this._updateTopologyTimer =
            new Timer_1.Timer(function timerActionUpdateTopology() {
                return that._updateTopologyCallback();
            }, minInMs, minInMs);
    }
    _executeOnSpecificNode(command, sessionInfo = null, options = null) {
        return __awaiter(this, void 0, void 0, function* () {
            if (command.failoverTopologyEtag === RequestExecutor.INITIAL_TOPOLOGY_ETAG) {
                command.failoverTopologyEtag = RequestExecutor.INITIAL_TOPOLOGY_ETAG;
                if (this._nodeSelector && this._nodeSelector.getTopology()) {
                    const topology = this._nodeSelector.getTopology();
                    if (topology.etag) {
                        command.failoverTopologyEtag = topology.etag;
                    }
                }
            }
            const { chosenNode, nodeIndex, shouldRetry } = options;
            this._log.info(`Actual execute ${command.constructor.name} on ${chosenNode.url}`
                + ` ${shouldRetry ? "with" : "without"} retry.`);
            let url;
            const req = this._createRequest(chosenNode, command, u => url = u);
            if (!req) {
                return null;
            }
            const controller = new abort_controller_1.default();
            if (options === null || options === void 0 ? void 0 : options.abortRef) {
                options.abortRef(controller);
            }
            req.signal = controller.signal;
            const noCaching = sessionInfo ? sessionInfo.noCaching : false;
            let cachedChangeVector;
            let cachedValue;
            const cachedItem = this._getFromCache(command, !noCaching, req.uri.toString(), (cachedItemMetadata) => {
                cachedChangeVector = cachedItemMetadata.changeVector;
                cachedValue = cachedItemMetadata.response;
            });
            if (cachedChangeVector) {
                if (yield this._tryGetFromCache(command, cachedItem, cachedValue)) {
                    return;
                }
            }
            this._setRequestHeaders(sessionInfo, cachedChangeVector, req);
            command.numberOfAttempts++;
            const attemptNum = command.numberOfAttempts;
            this._emitter.emit("beforeRequest", new SessionEvents_1.BeforeRequestEventArgs(this._databaseName, url, req, attemptNum));
            const responseAndStream = yield this._sendRequestToServer(chosenNode, nodeIndex, command, shouldRetry, sessionInfo, req, url, controller);
            if (!responseAndStream) {
                return;
            }
            const response = responseAndStream.response;
            const bodyStream = responseAndStream.bodyStream;
            const refreshTask = this._refreshIfNeeded(chosenNode, response);
            command.statusCode = response.status;
            let responseDispose = "Automatic";
            try {
                if (response.status === StatusCode_1.StatusCodes.NotModified) {
                    this._emitter.emit("succeedRequest", new SessionEvents_1.SucceedRequestEventArgs(this._databaseName, url, response, req, attemptNum));
                    cachedItem.notModified();
                    if (command.responseType === "Object") {
                        yield command.setResponseFromCache(cachedValue);
                    }
                    return;
                }
                if (response.status >= 400) {
                    const unsuccessfulResponseHandled = yield this._handleUnsuccessfulResponse(chosenNode, nodeIndex, command, req, response, bodyStream, req.uri, sessionInfo, shouldRetry);
                    if (!unsuccessfulResponseHandled) {
                        const dbMissingHeader = response.headers.get(Constants_1.HEADERS.DATABASE_MISSING);
                        if (dbMissingHeader) {
                            (0, Exceptions_1.throwError)("DatabaseDoesNotExistException", dbMissingHeader);
                        }
                        this._throwFailedToContactAllNodes(command, req);
                    }
                    return;
                }
                this._emitter.emit("succeedRequest", new SessionEvents_1.SucceedRequestEventArgs(this._databaseName, url, response, req, attemptNum));
                responseDispose = yield command.processResponse(this._cache, response, bodyStream, req.uri);
                this._lastReturnedResponse = new Date();
            }
            finally {
                if (responseDispose === "Automatic") {
                    (0, HttpUtil_1.closeHttpResponse)(response);
                }
                yield refreshTask;
            }
        });
    }
    _refreshIfNeeded(chosenNode, response) {
        return __awaiter(this, void 0, void 0, function* () {
            const refreshTopology = response
                && response.headers
                && response.headers.get(Constants_1.HEADERS.REFRESH_TOPOLOGY);
            const refreshClientConfiguration = response
                && response.headers
                && response.headers.get(Constants_1.HEADERS.REFRESH_CLIENT_CONFIGURATION);
            const tasks = [];
            if (refreshTopology) {
                const updateParameters = new UpdateTopologyParameters_1.UpdateTopologyParameters(chosenNode);
                updateParameters.timeoutInMs = 0;
                updateParameters.debugTag = "refresh-topology-header";
                tasks.push(this.updateTopology(updateParameters));
            }
            if (refreshClientConfiguration) {
                tasks.push(this._updateClientConfiguration(chosenNode));
            }
            yield Promise.all(tasks);
        });
    }
    _sendRequestToServer(chosenNode, nodeIndex, command, shouldRetry, sessionInfo, request, url, abortController) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.numberOfServerRequests++;
                const timeout = command.timeout || this._defaultTimeout;
                if (!TypeUtil_1.TypeUtil.isNullOrUndefined(timeout)) {
                    const cancelTask = setTimeout(() => abortController.abort(), timeout);
                    try {
                        return yield this._send(chosenNode, command, sessionInfo, request);
                    }
                    catch (error) {
                        if (error.name === "AbortError") {
                            const timeoutException = (0, Exceptions_1.getError)("TimeoutException", "The request for " + request.uri + " failed with timeout after " + TimeUtil_1.TimeUtil.millisToTimeSpan(timeout), error);
                            if (!shouldRetry) {
                                if (!command.failedNodes) {
                                    command.failedNodes = new Map();
                                }
                                command.failedNodes.set(chosenNode, timeoutException);
                                throw timeoutException;
                            }
                            if (!(yield this._handleServerDown(url, chosenNode, nodeIndex, command, request, null, "", timeoutException, sessionInfo, shouldRetry))) {
                                this._throwFailedToContactAllNodes(command, request);
                            }
                            return null;
                        }
                        throw error;
                    }
                    finally {
                        clearTimeout(cancelTask);
                    }
                }
                else {
                    return yield this._send(chosenNode, command, sessionInfo, request);
                }
            }
            catch (e) {
                if (e.name === "AllTopologyNodesDownException") {
                    throw e;
                }
                if (e.code === "ERR_INVALID_PROTOCOL") {
                    if (chosenNode.url.startsWith("https://") && !((_a = this.getAuthOptions()) === null || _a === void 0 ? void 0 : _a.certificate)) {
                        (0, Exceptions_1.throwError)("AuthorizationException", "This server requires client certificate for authentication, but none was provided by the client.", e);
                    }
                    (0, Exceptions_1.throwError)("AuthorizationException", "Invalid protocol", e);
                }
                if (!shouldRetry) {
                    throw e;
                }
                if (!(yield this._handleServerDown(url, chosenNode, nodeIndex, command, request, null, "", e, sessionInfo, shouldRetry))) {
                    this._throwFailedToContactAllNodes(command, request);
                }
                return null;
            }
        });
    }
    _send(chosenNode, command, sessionInfo, request) {
        return __awaiter(this, void 0, void 0, function* () {
            let responseAndStream;
            if (this._shouldExecuteOnAll(chosenNode, command)) {
                responseAndStream = yield this._executeOnAllToFigureOutTheFastest(chosenNode, command);
            }
            else {
                responseAndStream = yield command.send(this.getHttpAgent(), request);
            }
            if (chosenNode.shouldUpdateServerVersion()) {
                const serverVersion = RequestExecutor._tryGetServerVersion(responseAndStream.response);
                if (serverVersion) {
                    chosenNode.updateServerVersion(serverVersion);
                }
            }
            this._lastServerVersion = chosenNode.lastServerVersion;
            if (sessionInfo && sessionInfo.lastClusterTransactionIndex) {
                if (this._lastServerVersion && "4.1".localeCompare(this._lastServerVersion) > 0) {
                    (0, Exceptions_1.throwError)("ClientVersionMismatchException", "The server on " + chosenNode.url + " has an old version and can't perform "
                        + "the command since this command dependent on a cluster transaction "
                        + " which this node doesn't support.");
                }
            }
            return responseAndStream;
        });
    }
    _setRequestHeaders(sessionInfo, cachedChangeVector, req) {
        if (cachedChangeVector) {
            req.headers[Constants_1.HEADERS.IF_NONE_MATCH] = `"${cachedChangeVector}"`;
        }
        if (!this._disableClientConfigurationUpdates) {
            req.headers[Constants_1.HEADERS.CLIENT_CONFIGURATION_ETAG] = this._clientConfigurationEtag;
        }
        if (sessionInfo && sessionInfo.lastClusterTransactionIndex) {
            req.headers[Constants_1.HEADERS.LAST_KNOWN_CLUSTER_TRANSACTION_INDEX] =
                sessionInfo.lastClusterTransactionIndex;
        }
        if (!this._disableTopologyUpdates) {
            req.headers[Constants_1.HEADERS.TOPOLOGY_ETAG] = `"${this._topologyEtag}"`;
        }
        if (!req.headers[Constants_1.HEADERS.CLIENT_VERSION]) {
            req.headers[Constants_1.HEADERS.CLIENT_VERSION] = RequestExecutor.CLIENT_VERSION;
        }
    }
    _tryGetFromCache(command, cachedItem, cachedValue) {
        return __awaiter(this, void 0, void 0, function* () {
            const aggressiveCacheOptions = this.aggressiveCaching;
            if (aggressiveCacheOptions
                && cachedItem.age < aggressiveCacheOptions.duration
                && !cachedItem.mightHaveBeenModified
                && command.canCacheAggressively) {
                if (cachedItem.item.flags === "NotFound") {
                    return false;
                }
                else {
                    yield command.setResponseFromCache(cachedValue);
                    return true;
                }
            }
            return false;
        });
    }
    static _tryGetServerVersion(response) {
        return response.headers.get(Constants_1.HEADERS.SERVER_VERSION);
    }
    _throwFailedToContactAllNodes(command, req) {
        if (!command.failedNodes || !command.failedNodes.size) {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Received unsuccessful response and couldn't recover from it. " +
                "Also, no record of exceptions per failed nodes. This is weird and should not happen.");
        }
        if (command.failedNodes.size === 1) {
            throw Array.from(command.failedNodes.values())[0];
        }
        let message = "Tried to send "
            + command.constructor.name
            + " request via "
            + (req.method || "GET") + " "
            + req.uri + " to all configured nodes in the topology, "
            + "none of the attempt succeeded." + os.EOL;
        if (this._topologyTakenFromNode) {
            message += "I was able to fetch " + this._topologyTakenFromNode.database
                + " topology from " + this._topologyTakenFromNode.url + "." + os.EOL;
        }
        let nodes;
        if (this._nodeSelector && this._nodeSelector.getTopology()) {
            nodes = this._nodeSelector.getTopology().nodes;
        }
        if (!nodes) {
            message += "Topology is empty.";
        }
        else {
            message += "Topology: ";
            for (const node of nodes) {
                const error = command.failedNodes.get(node);
                message += os.EOL +
                    "[Url: " + node.url + ", " +
                    "ClusterTag: " + node.clusterTag + ", " +
                    "ServerRole: " + node.serverRole + ", " +
                    "Exception: " + (error ? error.message : "No exception") + "]";
            }
        }
        (0, Exceptions_1.throwError)("AllTopologyNodesDownException", message);
    }
    inSpeedTestPhase() {
        return this._nodeSelector
            && this._nodeSelector.inSpeedTestPhase();
    }
    _shouldExecuteOnAll(chosenNode, command) {
        return this.conventions.readBalanceBehavior === "FastestNode" &&
            this._nodeSelector &&
            this._nodeSelector.inSpeedTestPhase() &&
            this._nodeSelectorHasMultipleNodes() &&
            command.isReadRequest &&
            command.responseType === "Object" &&
            !!chosenNode &&
            !(command["prepareToBroadcast"]);
    }
    _executeOnAllToFigureOutTheFastest(chosenNode, command) {
        let preferredTask = null;
        const nodes = this._nodeSelector.getTopology().nodes;
        const tasks = nodes.map(x => null);
        let task;
        for (let i = 0; i < nodes.length; i++) {
            const taskNumber = i;
            this.numberOfServerRequests++;
            task = BluebirdPromise.resolve()
                .then(() => {
                const req = this._createRequest(nodes[taskNumber], command, TypeUtil_1.TypeUtil.NOOP);
                if (!req) {
                    return;
                }
                this._setRequestHeaders(null, null, req);
                return command.send(this.getHttpAgent(), req);
            })
                .then(commandResult => new IndexAndResponse(taskNumber, commandResult.response, commandResult.bodyStream))
                .catch(err => {
                tasks[taskNumber] = null;
                return BluebirdPromise.reject(err);
            });
            if (nodes[i].clusterTag === chosenNode.clusterTag) {
                preferredTask = task;
            }
            tasks[i] = task;
        }
        const result = PromiseUtil.raceToResolution(tasks)
            .then(fastest => {
            this._nodeSelector.recordFastest(fastest.index, nodes[fastest.index]);
        })
            .catch((err) => {
            this._log.warn(err, "Error executing on all to find fastest node.");
        })
            .then(() => preferredTask);
        return Promise.resolve(result);
    }
    _getFromCache(command, useCache, url, cachedItemMetadataCallback) {
        if (useCache
            && command.canCache
            && command.isReadRequest
            && command.responseType === "Object") {
            return this._cache.get(url, cachedItemMetadataCallback);
        }
        cachedItemMetadataCallback({
            changeVector: null,
            response: null
        });
        return new HttpCache_1.ReleaseCacheItem(null);
    }
    _nodeSelectorHasMultipleNodes() {
        const selector = this._nodeSelector;
        if (!selector) {
            return false;
        }
        const topology = selector.getTopology();
        return topology && topology.nodes && topology.nodes.length > 1;
    }
    _createRequest(node, command, urlRef) {
        var _a;
        const request = command.createRequest(node);
        if (!request) {
            return null;
        }
        const req = Object.assign(request, this._defaultRequestOptions);
        urlRef(req.uri);
        req.headers = req.headers || {};
        let builder = new URL(req.uri);
        if (RequestExecutor.requestPostProcessor) {
            RequestExecutor.requestPostProcessor(req);
        }
        if (command["getRaftUniqueRequestId"]) {
            const raftCommand = command;
            const raftRequestString = "raft-request-id=" + raftCommand.getRaftUniqueRequestId();
            let joinCharacter = builder.search ? "&" : "?";
            if (!builder.search && req.uri.endsWith("?")) {
                joinCharacter = "";
            }
            builder = new URL(builder.toString() + joinCharacter + raftRequestString);
        }
        if (this._shouldBroadcast(command)) {
            command.timeout = (_a = command.timeout) !== null && _a !== void 0 ? _a : this.firstBroadcastAttemptTimeout;
        }
        req.uri = builder.toString();
        return req;
    }
    _handleUnsuccessfulResponse(chosenNode, nodeIndex, command, req, response, responseBodyStream, url, sessionInfo, shouldRetry) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            responseBodyStream.resume();
            const readBody = () => StreamUtil.readToEnd(responseBodyStream);
            switch (response.status) {
                case StatusCode_1.StatusCodes.NotFound:
                    this._cache.setNotFound(url);
                    switch (command.responseType) {
                        case "Empty":
                            return Promise.resolve(true);
                        case "Object":
                            return command.setResponseAsync(null, false)
                                .then(() => true);
                        default:
                            command.setResponseRaw(response, null);
                            break;
                    }
                    return true;
                case StatusCode_1.StatusCodes.Forbidden: {
                    const msg = yield readBody();
                    (0, Exceptions_1.throwError)("AuthorizationException", `Forbidden access to ${chosenNode.database}@${chosenNode.url}`
                        + `, ${req.method || "GET"} ${req.uri}` + os.EOL + msg);
                    break;
                }
                case StatusCode_1.StatusCodes.Gone: {
                    if (!shouldRetry) {
                        return false;
                    }
                    if (nodeIndex != null) {
                        this._nodeSelector.onFailedRequest(nodeIndex);
                    }
                    if (!command.failedNodes) {
                        command.failedNodes = new Map();
                    }
                    if (command.isFailedWithNode(chosenNode)) {
                        command.failedNodes.set(chosenNode, (0, Exceptions_1.getError)("UnsuccessfulRequestException", "Request to " + url + "(" + req.method + ") is not relevant for this node anymore."));
                    }
                    let indexAndNode = this.chooseNodeForRequest(command, sessionInfo);
                    if (command.failedNodes.has(indexAndNode.currentNode)) {
                        const updateParameters = new UpdateTopologyParameters_1.UpdateTopologyParameters(chosenNode);
                        updateParameters.timeoutInMs = 60000;
                        updateParameters.debugTag = "handle-unsuccessful-response";
                        const success = yield this.updateTopology(updateParameters);
                        if (!success) {
                            return false;
                        }
                        command.failedNodes.clear();
                        indexAndNode = this.chooseNodeForRequest(command, sessionInfo);
                        yield this._executeOnSpecificNode(command, sessionInfo, {
                            chosenNode: indexAndNode.currentNode,
                            nodeIndex: indexAndNode.currentIndex,
                            shouldRetry: false
                        });
                        return true;
                    }
                    yield this._executeOnSpecificNode(command, sessionInfo, {
                        chosenNode: indexAndNode.currentNode,
                        nodeIndex: indexAndNode.currentIndex,
                        shouldRetry: false
                    });
                    return true;
                }
                case StatusCode_1.StatusCodes.GatewayTimeout:
                case StatusCode_1.StatusCodes.RequestTimeout:
                case StatusCode_1.StatusCodes.BadGateway:
                case StatusCode_1.StatusCodes.ServiceUnavailable:
                    return this._handleServerDown(url, chosenNode, nodeIndex, command, req, response, yield readBody(), null, sessionInfo, shouldRetry);
                case StatusCode_1.StatusCodes.Conflict:
                    RequestExecutor._handleConflict(response, yield readBody());
                    break;
                case StatusCode_1.StatusCodes.TooEarly: {
                    if (!shouldRetry) {
                        return false;
                    }
                    if (!TypeUtil_1.TypeUtil.isNullOrUndefined(nodeIndex)) {
                        this._nodeSelector.onFailedRequest(nodeIndex);
                    }
                    (_a = command.failedNodes) !== null && _a !== void 0 ? _a : (command.failedNodes = new Map());
                    if (!command.isFailedWithNode(chosenNode)) {
                        command.failedNodes.set(chosenNode, (0, Exceptions_1.getError)("UnsuccessfulRequestException", "Request to '" + req.uri + "' (" + req.method + ") is processing and not yet available on that node."));
                    }
                    const nextNode = this.chooseNodeForRequest(command, sessionInfo);
                    yield this._executeOnSpecificNode(command, sessionInfo, {
                        chosenNode: nextNode.currentNode,
                        nodeIndex: nextNode.currentIndex,
                        shouldRetry: true
                    });
                    if (!TypeUtil_1.TypeUtil.isNullOrUndefined(nodeIndex)) {
                        this._nodeSelector.restoreNodeIndex(nodeIndex);
                    }
                    return true;
                }
                default:
                    command.onResponseFailure(response);
                    Exceptions_1.ExceptionDispatcher.throwException(response, yield readBody());
            }
        });
    }
    static _handleConflict(response, body) {
        Exceptions_1.ExceptionDispatcher.throwException(response, body);
    }
    _handleServerDown(url, chosenNode, nodeIndex, command, req, response, body, error, sessionInfo, shouldRetry) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!command.failedNodes) {
                command.failedNodes = new Map();
            }
            const exception = RequestExecutor._readExceptionFromServer(req, response, body, error);
            if (exception.name === "RavenTimeoutException" && exception.failImmediately) {
                throw exception;
            }
            command.failedNodes.set(chosenNode, exception);
            if (nodeIndex === null) {
                return false;
            }
            if (!this._nodeSelector) {
                this._spawnHealthChecks(chosenNode, nodeIndex);
                return false;
            }
            chosenNode.discardServerVersion();
            this._nodeSelector.onFailedRequest(nodeIndex);
            if (this._shouldBroadcast(command)) {
                command.result = yield this._broadcast(command, sessionInfo);
                return true;
            }
            this._spawnHealthChecks(chosenNode, nodeIndex);
            const indexAndNodeAndEtag = this._nodeSelector.getPreferredNodeWithTopology();
            if (command.failoverTopologyEtag !== this._topologyEtag) {
                command.failedNodes.clear();
                command.failoverTopologyEtag = this._topologyEtag;
            }
            if (command.failedNodes.has(indexAndNodeAndEtag.currentNode)) {
                return false;
            }
            this._onFailedRequestInvoke(url, error, req, response);
            yield this._executeOnSpecificNode(command, sessionInfo, {
                chosenNode: indexAndNodeAndEtag.currentNode,
                nodeIndex: indexAndNodeAndEtag.currentIndex,
                shouldRetry
            });
            return true;
        });
    }
    _shouldBroadcast(command) {
        if (!command["prepareToBroadcast"]) {
            return false;
        }
        const topologyNodes = this.getTopologyNodes();
        if (!topologyNodes || topologyNodes.length < 2) {
            return false;
        }
        return true;
    }
    _broadcast(command, sessionInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!command["prepareToBroadcast"]) {
                (0, Exceptions_1.throwError)("InvalidOperationException", "You can broadcast only commands that implement 'IBroadcast'.");
            }
            const broadcastCommand = command;
            const failedNodes = command.failedNodes;
            command.failedNodes = new Map();
            const broadcastTasks = new Map();
            try {
                this._sendToAllNodes(broadcastTasks, sessionInfo, broadcastCommand);
                return this._waitForBroadcastResult(command, broadcastTasks);
            }
            finally {
                for (const broadcastState of Array.from(broadcastTasks.entries())) {
                    const task = broadcastState[0];
                    if (task) {
                        task.catch(throwable => {
                            const index = broadcastState[1].index;
                            const node = this._nodeSelector.getTopology().nodes[index];
                            if (failedNodes.has(node)) {
                                this._spawnHealthChecks(node, index);
                            }
                        });
                    }
                }
            }
        });
    }
    _waitForBroadcastResult(command, tasks) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            while (tasks.size) {
                let error;
                try {
                    const completed = yield Promise.race(Array.from(tasks.keys()));
                    for (const state of Array.from(tasks.values())) {
                        (_a = state.abort) === null || _a === void 0 ? void 0 : _a.abort();
                    }
                    const completedItem = Array.from(tasks.values()).find(x => x.index === completed);
                    this._nodeSelector.restoreNodeIndex(completed);
                    return completedItem.command.result;
                }
                catch (e) {
                    error = e.error;
                    const failedIndex = e.index;
                    const failedPair = Array.from(tasks.entries())
                        .find(x => x[1].index === failedIndex);
                    const node = this._nodeSelector.getTopology().nodes[failedIndex];
                    command.failedNodes.set(node, error);
                    this._nodeSelector.onFailedRequest(failedIndex);
                    this._spawnHealthChecks(node, failedIndex);
                    tasks.delete(failedPair[0]);
                }
            }
            const exceptions = Array.from(command.failedNodes
                .entries())
                .map(x => x[0].url + ": " + x[1].message)
                .join(", ");
            (0, Exceptions_1.throwError)("AllTopologyNodesDownException", "Broadcasting " + command.constructor.name + " failed: " + exceptions);
        });
    }
    _sendToAllNodes(tasks, sessionInfo, command) {
        for (let index = 0; index < this._nodeSelector.getTopology().nodes.length; index++) {
            const state = new BroadcastState();
            state.command = command.prepareToBroadcast(this.conventions);
            state.index = index;
            state.node = this._nodeSelector.getTopology().nodes[index];
            state.command.timeout = this.secondBroadcastAttemptTimeout;
            let abortController;
            const task = this.execute(state.command, sessionInfo, {
                chosenNode: state.node,
                nodeIndex: null,
                shouldRetry: false,
                abortRef: a => abortController = a
            })
                .then(() => index)
                .catch(e => {
                throw {
                    index,
                    error: e
                };
            });
            state.abort = abortController;
            tasks.set(task, state);
        }
    }
    handleServerNotResponsive(url, chosenNode, nodeIndex, e) {
        return __awaiter(this, void 0, void 0, function* () {
            this._spawnHealthChecks(chosenNode, nodeIndex);
            if (this._nodeSelector) {
                this._nodeSelector.onFailedRequest(nodeIndex);
            }
            const preferredNode = yield this.getPreferredNode();
            if (this._disableTopologyUpdates) {
                yield this._performHealthCheck(chosenNode, nodeIndex);
            }
            else {
                const updateParameters = new UpdateTopologyParameters_1.UpdateTopologyParameters(preferredNode.currentNode);
                updateParameters.timeoutInMs = 0;
                updateParameters.forceUpdate = true;
                updateParameters.debugTag = "handle-server-not-responsive";
                yield this.updateTopology(updateParameters);
            }
            this._onFailedRequestInvoke(url, e);
            return preferredNode.currentNode;
        });
    }
    _spawnHealthChecks(chosenNode, nodeIndex) {
        if (this._disposed) {
            return;
        }
        if (this._nodeSelector && this._nodeSelector.getTopology().nodes.length < 2) {
            return;
        }
        if (this._failedNodesTimers.has(chosenNode)) {
            return;
        }
        this._log.info(`Spawn health checks for node ${chosenNode.url}.`);
        const nodeStatus = new NodeStatus(nodeIndex, chosenNode, this, (nStatus) => this._checkNodeStatusCallback(nStatus));
        this._failedNodesTimers.set(chosenNode, nodeStatus);
        nodeStatus.startTimer();
    }
    _checkNodeStatusCallback(nodeStatus) {
        const copy = this.getTopologyNodes();
        if (nodeStatus.nodeIndex >= copy.length) {
            return;
        }
        const serverNode = copy[nodeStatus.nodeIndex];
        if (serverNode !== nodeStatus.node) {
            return;
        }
        return Promise.resolve()
            .then(() => {
            let status;
            return Promise.resolve(this._performHealthCheck(serverNode, nodeStatus.nodeIndex))
                .then(() => {
                status = this._failedNodesTimers[nodeStatus.nodeIndex];
                if (status) {
                    this._failedNodesTimers.delete(nodeStatus.node);
                    status.dispose();
                }
                if (this._nodeSelector) {
                    this._nodeSelector.restoreNodeIndex(nodeStatus.nodeIndex);
                }
            }, err => {
                this._log.error(err, `${serverNode.clusterTag} is still down`);
                status = this._failedNodesTimers.get(nodeStatus.node);
                if (status) {
                    nodeStatus.updateTimer();
                }
            });
        })
            .catch(err => {
            this._log.error(err, "Failed to check node topology, will ignore this node until next topology update.");
        });
    }
    _performHealthCheck(serverNode, nodeIndex) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!RequestExecutor._useOldFailureCheckOperation.has(serverNode.url)) {
                    yield this._executeOnSpecificNode(RequestExecutor._failureCheckOperation.getCommand(this._conventions), null, {
                        chosenNode: serverNode,
                        nodeIndex,
                        shouldRetry: false,
                    });
                }
                else {
                    yield this._executeOldHealthCheck(serverNode, nodeIndex);
                }
            }
            catch (e) {
                if (e.message.includes("RouteNotFoundException")) {
                    RequestExecutor._useOldFailureCheckOperation.add(serverNode.url);
                    yield this._executeOldHealthCheck(serverNode, nodeIndex);
                    return;
                }
                throw e;
            }
        });
    }
    _executeOldHealthCheck(serverNode, nodeIndex) {
        return this._executeOnSpecificNode(RequestExecutor._backwardCompatibilityFailureCheckOperation.getCommand(this._conventions), null, {
            chosenNode: serverNode,
            nodeIndex,
            shouldRetry: false,
        });
    }
    static _readExceptionFromServer(req, response, body, e) {
        if (response && body) {
            const responseJson = body;
            try {
                const resExceptionSchema = Serializer_1.JsonSerializer
                    .getDefaultForCommandPayload()
                    .deserialize(responseJson);
                return Exceptions_1.ExceptionDispatcher.get(resExceptionSchema, response.status, e);
            }
            catch (__) {
                log.warn(__, "Error parsing server error.");
                const unrecognizedErrSchema = {
                    url: req.uri,
                    message: "Unrecognized response from the server",
                    error: responseJson,
                    type: "Unparsable Server Response"
                };
                return Exceptions_1.ExceptionDispatcher.get(unrecognizedErrSchema, response.status, e);
            }
        }
        const exceptionSchema = {
            url: req.uri.toString(),
            message: e.message,
            error: `An exception occurred while contacting ${req.uri} . ${os.EOL + e.stack}`,
            type: e.name
        };
        return Exceptions_1.ExceptionDispatcher.get(exceptionSchema, StatusCode_1.StatusCodes.ServiceUnavailable, e);
    }
    _setDefaultRequestOptions() {
        this._defaultRequestOptions = Object.assign(DEFAULT_REQUEST_OPTIONS, {
            compress: !(this._conventions.hasExplicitlySetCompressionUsage && !this._conventions.useCompression)
        }, this._customHttpRequestOptions);
    }
    dispose() {
        this._log.info("Dispose.");
        if (this._disposed) {
            return;
        }
        this._disposed = true;
        this._updateClientConfigurationSemaphore.take(TypeUtil_1.TypeUtil.NOOP);
        this._updateDatabaseTopologySemaphore.take(TypeUtil_1.TypeUtil.NOOP);
        this._cache.dispose();
        if (this._updateTopologyTimer) {
            this._updateTopologyTimer.dispose();
        }
        this._disposeAllFailedNodesTimers();
    }
    getRequestedNode(nodeTag, throwIfContainsFailures = false) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._ensureNodeSelector();
            const currentIndexAndNode = this._nodeSelector.getRequestedNode(nodeTag);
            if (throwIfContainsFailures && !this._nodeSelector.nodeIsAvailable(currentIndexAndNode.currentIndex)) {
                (0, Exceptions_1.throwError)("RequestedNodeUnavailableException", "Requested node " + nodeTag + " currently unavailable, please try again later.");
            }
            return currentIndexAndNode;
        });
    }
    getPreferredNode() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._ensureNodeSelector();
            return this._nodeSelector.getPreferredNode();
        });
    }
    getNodeBySessionId(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._ensureNodeSelector();
            return this._nodeSelector.getNodeBySessionId(sessionId);
        });
    }
    getFastestNode() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._ensureNodeSelector();
            return this._nodeSelector.getFastestNode();
        });
    }
    _ensureNodeSelector() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._disableTopologyUpdates) {
                yield this._waitForTopologyUpdate(this._firstTopologyUpdatePromise);
            }
            if (!this._nodeSelector) {
                const topology = new Topology_1.Topology(this._topologyEtag, this.getTopologyNodes().slice());
                this._nodeSelector = new NodeSelector_1.NodeSelector(topology);
            }
        });
    }
    _onTopologyUpdatedInvoke(newTopology) {
        this._emitter.emit("topologyUpdated", new SessionEvents_1.TopologyUpdatedEventArgs(newTopology));
    }
}
exports.RequestExecutor = RequestExecutor;
RequestExecutor.GLOBAL_APPLICATION_IDENTIFIER = "aaa";
RequestExecutor.INITIAL_TOPOLOGY_ETAG = -2;
RequestExecutor.CLIENT_VERSION = "5.2.0";
RequestExecutor._backwardCompatibilityFailureCheckOperation = new GetStatisticsOperation_1.GetStatisticsOperation("failure=check");
RequestExecutor._failureCheckOperation = new DatabaseHealthCheckOperation_1.DatabaseHealthCheckOperation();
RequestExecutor._useOldFailureCheckOperation = new Set();
RequestExecutor.requestPostProcessor = null;
class BroadcastState {
}