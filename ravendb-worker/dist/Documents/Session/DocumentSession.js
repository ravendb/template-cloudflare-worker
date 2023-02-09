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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentSession = void 0;
const stream = require("readable-stream");
const os = require("os");
const DocumentQuery_1 = require("./DocumentQuery");
const MultiLoaderWithInclude_1 = require("./Loaders/MultiLoaderWithInclude");
const BatchOperation_1 = require("./Operations/BatchOperation");
const TypeUtil_1 = require("../../Utility/TypeUtil");
const Exceptions_1 = require("../../Exceptions");
const LoadOperation_1 = require("./Operations/LoadOperation");
const InMemoryDocumentSessionOperations_1 = require("./InMemoryDocumentSessionOperations");
const GetDocumentsCommand_1 = require("../Commands/GetDocumentsCommand");
const HeadDocumentCommand_1 = require("../Commands/HeadDocumentCommand");
const LoadStartingWithOperation_1 = require("./Operations/LoadStartingWithOperation");
const RawDocumentQuery_1 = require("./RawDocumentQuery");
const DocumentSessionAttachments_1 = require("./DocumentSessionAttachments");
const Lazy_1 = require("../Lazy");
const LazyLoadOperation_1 = require("./Operations/Lazy/LazyLoadOperation");
const ResponseTimeInformation_1 = require("./ResponseTimeInformation");
const MultiGetOperation_1 = require("./Operations/MultiGetOperation");
const Stopwatch_1 = require("../../Utility/Stopwatch");
const Constants_1 = require("../../Constants");
const PromiseUtil_1 = require("../../Utility/PromiseUtil");
const LazySessionOperations_1 = require("./Operations/Lazy/LazySessionOperations");
const JavaScriptArray_1 = require("./JavaScriptArray");
const PatchRequest_1 = require("../Operations/PatchRequest");
const PatchCommandData_1 = require("../Commands/Batches/PatchCommandData");
const IdTypeAndName_1 = require("../IdTypeAndName");
const DocumentSessionRevisions_1 = require("./DocumentSessionRevisions");
const StreamUtil = require("../../Utility/StreamUtil");
const StreamOperation_1 = require("./Operations/StreamOperation");
const QueryOperation_1 = require("./Operations/QueryOperation");
const Pipelines_1 = require("../../Mapping/Json/Streams/Pipelines");
const ClusterTransactionOperations_1 = require("./ClusterTransactionOperations");
const SessionDocumentCounters_1 = require("./SessionDocumentCounters");
const IncludeBuilder_1 = require("./Loaders/IncludeBuilder");
const GraphDocumentQuery_1 = require("./GraphDocumentQuery");
const JavaScriptMap_1 = require("./JavaScriptMap");
const SessionDocumentTimeSeries_1 = require("./SessionDocumentTimeSeries");
const TimeSeriesOperations_1 = require("../TimeSeries/TimeSeriesOperations");
const SessionDocumentTypedTimeSeries_1 = require("./SessionDocumentTypedTimeSeries");
const SessionDocumentRollupTypedTimeSeries_1 = require("./SessionDocumentRollupTypedTimeSeries");
const RawTimeSeriesTypes_1 = require("../Operations/TimeSeries/RawTimeSeriesTypes");
const DocumentInfo_1 = require("./DocumentInfo");
const MetadataAsDictionary_1 = require("../../Mapping/MetadataAsDictionary");
const StringUtil_1 = require("../../Utility/StringUtil");
const ConditionalGetDocumentsCommand_1 = require("../Commands/ConditionalGetDocumentsCommand");
const StatusCode_1 = require("../../Http/StatusCode");
class DocumentSession extends InMemoryDocumentSessionOperations_1.InMemoryDocumentSessionOperations {
    constructor(documentStore, id, options) {
        super(documentStore, id, options);
        this._valsCount = 0;
        this._customCount = 0;
    }
    get advanced() {
        return this;
    }
    get session() {
        return this;
    }
    _generateId(entity) {
        return this.conventions.generateDocumentId(this.databaseName, entity);
    }
    load(idOrIds, optionsOrDocumentType) {
        return __awaiter(this, void 0, void 0, function* () {
            const isLoadingSingle = !Array.isArray(idOrIds);
            if (isLoadingSingle && StringUtil_1.StringUtil.isNullOrWhitespace(idOrIds)) {
                return null;
            }
            const ids = isLoadingSingle ? [idOrIds] : idOrIds;
            let options;
            if (TypeUtil_1.TypeUtil.isDocumentType(optionsOrDocumentType)) {
                options = { documentType: optionsOrDocumentType };
            }
            else if (TypeUtil_1.TypeUtil.isObject(optionsOrDocumentType)) {
                options = optionsOrDocumentType;
            }
            const internalOpts = this._prepareLoadInternalOpts(options || {});
            const docs = yield this.loadInternal(ids, internalOpts);
            return isLoadingSingle
                ? docs[Object.keys(docs)[0]]
                : docs;
        });
    }
    _prepareLoadInternalOpts(options) {
        const internalOpts = { documentType: options.documentType };
        this.conventions.tryRegisterJsType(internalOpts.documentType);
        if ("includes" in options) {
            if (TypeUtil_1.TypeUtil.isFunction(options.includes)) {
                const builder = new IncludeBuilder_1.IncludeBuilder(this.conventions);
                options.includes(builder);
                if (builder.countersToInclude) {
                    internalOpts.counterIncludes = [...builder.countersToInclude];
                }
                if (builder.documentsToInclude) {
                    internalOpts.includes = [...builder.documentsToInclude];
                }
                if (builder.timeSeriesToInclude) {
                    internalOpts.timeSeriesIncludes = [...builder.timeSeriesToInclude];
                }
                if (builder.compareExchangeValuesToInclude) {
                    internalOpts.compareExchangeValueIncludes = [...builder.compareExchangeValuesToInclude];
                }
                internalOpts.revisionIncludesByChangeVector = builder.revisionsToIncludeByChangeVector ? Array.from(builder.revisionsToIncludeByChangeVector) : null;
                internalOpts.revisionsToIncludeByDateTime = builder.revisionsToIncludeByDateTime;
                internalOpts.includeAllCounters = builder.isAllCounters;
            }
            else {
                internalOpts.includes = options.includes;
            }
        }
        return internalOpts;
    }
    _loadInternal(ids, operation, writable) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!ids) {
                (0, Exceptions_1.throwError)("InvalidArgumentException", "Ids cannot be null");
            }
            operation.byIds(ids);
            const command = operation.createRequest();
            if (command) {
                yield this._requestExecutor.execute(command, this._sessionInfo);
                if (!writable) {
                    operation.setResult(command.result);
                }
                else {
                    const readable = StreamUtil.stringToReadable(JSON.stringify(command.result));
                    yield StreamUtil.pipelineAsync(readable, writable);
                }
            }
        });
    }
    saveChanges() {
        return __awaiter(this, void 0, void 0, function* () {
            const saveChangeOperation = new BatchOperation_1.BatchOperation(this);
            let command;
            try {
                command = saveChangeOperation.createRequest();
                if (!command) {
                    return;
                }
                if (this.noTracking) {
                    (0, Exceptions_1.throwError)("InvalidOperationException", "Cannot execute saveChanges when entity tracking is disabled in session.");
                }
                yield this._requestExecutor.execute(command, this._sessionInfo);
                this._updateSessionAfterSaveChanges(command.result);
                saveChangeOperation.setResult(command.result);
            }
            finally {
                if (command) {
                    command.dispose();
                }
            }
        });
    }
    refresh(entity) {
        return __awaiter(this, void 0, void 0, function* () {
            const documentInfo = this.documentsByEntity.get(entity);
            if (!documentInfo) {
                (0, Exceptions_1.throwError)("InvalidOperationException", "Cannot refresh a transient instance");
            }
            this.incrementRequestCount();
            const command = new GetDocumentsCommand_1.GetDocumentsCommand({
                id: documentInfo.id,
                conventions: this.conventions
            });
            yield this._requestExecutor.execute(command, this._sessionInfo);
            this._refreshInternal(entity, command, documentInfo);
        });
    }
    exists(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!id) {
                (0, Exceptions_1.throwError)("InvalidArgumentException", "id cannot be null");
            }
            if (this._knownMissingIds.has(id)) {
                return Promise.resolve(false);
            }
            if (this.documentsById.getValue(id)) {
                return true;
            }
            const command = new HeadDocumentCommand_1.HeadDocumentCommand(id, null);
            yield this._requestExecutor.execute(command, this._sessionInfo);
            return !TypeUtil_1.TypeUtil.isNullOrUndefined(command.result);
        });
    }
    loadStartingWith(idPrefix, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const loadStartingWithOperation = new LoadStartingWithOperation_1.LoadStartingWithOperation(this);
            opts || (opts = {});
            yield this._loadStartingWithInternal(idPrefix, loadStartingWithOperation, opts);
            return loadStartingWithOperation.getDocuments(opts.documentType);
        });
    }
    loadStartingWithIntoStream(idPrefix, writable, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!writable) {
                (0, Exceptions_1.throwError)("InvalidArgumentException", "writable cannot be null.");
            }
            if (!idPrefix) {
                (0, Exceptions_1.throwError)("InvalidArgumentException", "idPrefix cannot be null.");
            }
            const loadStartingWithOperation = new LoadStartingWithOperation_1.LoadStartingWithOperation(this);
            opts || (opts = {});
            yield this._loadStartingWithInternal(idPrefix, loadStartingWithOperation, opts, writable);
        });
    }
    loadIntoStream(ids, writable) {
        return __awaiter(this, void 0, void 0, function* () {
            return this._loadInternal(ids, new LoadOperation_1.LoadOperation(this), writable);
        });
    }
    _loadStartingWithInternal(idPrefix, operation, opts, writable) {
        return __awaiter(this, void 0, void 0, function* () {
            const { matches, start, pageSize, exclude, startAfter } = opts || {};
            operation.withStartWith(idPrefix, {
                matches, start, pageSize, exclude, startAfter
            });
            const command = operation.createRequest();
            if (command) {
                yield this._requestExecutor.execute(command, this._sessionInfo);
                if (writable) {
                    return StreamUtil.pipelineAsync(StreamUtil.stringToReadable(JSON.stringify(command.result)), writable);
                }
                else {
                    operation.setResult(command.result);
                }
            }
            return command;
        });
    }
    loadInternal(ids, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!ids) {
                (0, Exceptions_1.throwError)("InvalidArgumentException", "Ids cannot be null");
            }
            opts = opts || {};
            const loadOperation = new LoadOperation_1.LoadOperation(this);
            loadOperation.byIds(ids);
            loadOperation.withIncludes(opts.includes);
            if (opts.includeAllCounters) {
                loadOperation.withAllCounters();
            }
            else {
                loadOperation.withCounters(opts.counterIncludes);
            }
            loadOperation.withRevisions(opts.revisionIncludesByChangeVector);
            loadOperation.withRevisions(opts.revisionsToIncludeByDateTime);
            loadOperation.withTimeSeries(opts.timeSeriesIncludes);
            loadOperation.withCompareExchange(opts.compareExchangeValueIncludes);
            const command = loadOperation.createRequest();
            if (command) {
                yield this._requestExecutor.execute(command, this._sessionInfo);
                loadOperation.setResult(command.result);
            }
            const clazz = this.conventions.getJsTypeByDocumentType(opts.documentType);
            return loadOperation.getDocuments(clazz);
        });
    }
    include(path) {
        return new MultiLoaderWithInclude_1.MultiLoaderWithInclude(this).include(path);
    }
    increment(entityOrId, path, valueToAdd) {
        let id;
        if (TypeUtil_1.TypeUtil.isString(entityOrId)) {
            id = entityOrId;
        }
        else {
            const metadata = this.getMetadataFor(entityOrId);
            id = metadata["@id"];
        }
        const patchRequest = new PatchRequest_1.PatchRequest();
        const variable = `this.${path}`;
        const value = `args.val_${this._valsCount}`;
        patchRequest.script = `${variable} = ${variable} ? ${variable} + ${value} : ${value};`;
        const valKey = "val_" + this._valsCount;
        patchRequest.values = { [valKey]: valueToAdd };
        this._valsCount++;
        if (!this._tryMergePatches(id, patchRequest)) {
            this.defer(new PatchCommandData_1.PatchCommandData(id, null, patchRequest, null));
        }
    }
    addOrIncrement(id, entity, pathToObject, valToAdd) {
        const variable = "this." + pathToObject;
        const value = "args.val_" + this._valsCount;
        const patchRequest = new PatchRequest_1.PatchRequest();
        patchRequest.script = variable + " = " + variable + " ? " + variable + " + " + value + " : " + value;
        patchRequest.values = {
            ["val_" + this._valsCount]: valToAdd
        };
        const collectionName = this._requestExecutor.conventions.getCollectionNameForEntity(entity);
        const metadataAsDictionary = MetadataAsDictionary_1.MetadataDictionary.create();
        metadataAsDictionary[Constants_1.CONSTANTS.Documents.Metadata.COLLECTION] = collectionName;
        const descriptor = this._requestExecutor.conventions.getTypeDescriptorByEntity(entity);
        const jsType = this._requestExecutor.conventions.getJsTypeName(descriptor);
        if (jsType) {
            metadataAsDictionary[Constants_1.CONSTANTS.Documents.Metadata.RAVEN_JS_TYPE] = jsType;
        }
        const documentInfo = new DocumentInfo_1.DocumentInfo();
        documentInfo.id = id;
        documentInfo.collection = collectionName;
        documentInfo.metadataInstance = metadataAsDictionary;
        const newInstance = this.entityToJson.convertEntityToJson(entity, documentInfo);
        this._valsCount++;
        const patchCommandData = new PatchCommandData_1.PatchCommandData(id, null, patchRequest);
        patchCommandData.createIfMissing = newInstance;
        this.defer(patchCommandData);
    }
    addOrPatchArray(id, entity, pathToArray, arrayAdder) {
        const scriptArray = new JavaScriptArray_1.JavaScriptArray(this._customCount++, pathToArray);
        arrayAdder(scriptArray);
        const patchRequest = new PatchRequest_1.PatchRequest();
        patchRequest.script = scriptArray.script;
        patchRequest.values = scriptArray.parameters;
        const collectionName = this._requestExecutor.conventions.getCollectionNameForEntity(entity);
        const metadataAsDictionary = MetadataAsDictionary_1.MetadataDictionary.create();
        metadataAsDictionary[Constants_1.CONSTANTS.Documents.Metadata.COLLECTION] = collectionName;
        const descriptor = this._requestExecutor.conventions.getTypeDescriptorByEntity(entity);
        const jsType = this._requestExecutor.conventions.getJsTypeName(descriptor);
        if (jsType) {
            metadataAsDictionary[Constants_1.CONSTANTS.Documents.Metadata.RAVEN_JS_TYPE] = jsType;
        }
        const documentInfo = new DocumentInfo_1.DocumentInfo();
        documentInfo.id = id;
        documentInfo.collection = collectionName;
        documentInfo.metadataInstance = metadataAsDictionary;
        const newInstance = this.entityToJson.convertEntityToJson(entity, documentInfo);
        this._valsCount++;
        const patchCommandData = new PatchCommandData_1.PatchCommandData(id, null, patchRequest);
        patchCommandData.createIfMissing = newInstance;
        this.defer(patchCommandData);
    }
    addOrPatch(id, entity, pathToObject, value) {
        const patchRequest = new PatchRequest_1.PatchRequest();
        patchRequest.script = "this." + pathToObject + " = args.val_" + this._valsCount;
        patchRequest.values = {
            ["val_" + this._valsCount]: value
        };
        const collectionName = this._requestExecutor.conventions.getCollectionNameForEntity(entity);
        const metadataAsDictionary = MetadataAsDictionary_1.MetadataDictionary.create();
        metadataAsDictionary[Constants_1.CONSTANTS.Documents.Metadata.COLLECTION] = collectionName;
        const descriptor = this._requestExecutor.conventions.getTypeDescriptorByEntity(entity);
        const jsType = this._requestExecutor.conventions.getJsTypeName(descriptor);
        if (jsType) {
            metadataAsDictionary[Constants_1.CONSTANTS.Documents.Metadata.RAVEN_JS_TYPE] = jsType;
        }
        const documentInfo = new DocumentInfo_1.DocumentInfo();
        documentInfo.id = id;
        documentInfo.collection = collectionName;
        documentInfo.metadataInstance = metadataAsDictionary;
        const newInstance = this.entityToJson.convertEntityToJson(entity, documentInfo);
        this._valsCount++;
        const patchCommandData = new PatchCommandData_1.PatchCommandData(id, null, patchRequest);
        patchCommandData.createIfMissing = newInstance;
        this.defer(patchCommandData);
    }
    patch(entityOrId, path, value) {
        let id;
        if (TypeUtil_1.TypeUtil.isString(entityOrId)) {
            id = entityOrId;
        }
        else {
            const metadata = this.getMetadataFor(entityOrId);
            id = metadata["@id"];
        }
        const patchRequest = new PatchRequest_1.PatchRequest();
        patchRequest.script = "this." + path + " = args.val_" + this._valsCount + ";";
        const valKey = "val_" + this._valsCount;
        patchRequest.values = {};
        patchRequest.values[valKey] = value;
        this._valsCount++;
        if (!this._tryMergePatches(id, patchRequest)) {
            this.defer(new PatchCommandData_1.PatchCommandData(id, null, patchRequest, null));
        }
    }
    patchArray(entityOrId, path, arrayAdder) {
        let id;
        if (TypeUtil_1.TypeUtil.isString(entityOrId)) {
            id = entityOrId;
        }
        else {
            const metadata = this.getMetadataFor(entityOrId);
            id = metadata["@id"];
        }
        const scriptArray = new JavaScriptArray_1.JavaScriptArray(this._customCount++, path);
        arrayAdder(scriptArray);
        const patchRequest = new PatchRequest_1.PatchRequest();
        patchRequest.script = scriptArray.script;
        patchRequest.values = scriptArray.parameters;
        if (!this._tryMergePatches(id, patchRequest)) {
            this.defer(new PatchCommandData_1.PatchCommandData(id, null, patchRequest, null));
        }
    }
    patchObject(idOrEntity, pathToObject, mapAdder) {
        if (TypeUtil_1.TypeUtil.isString(idOrEntity)) {
            const scriptMap = new JavaScriptMap_1.JavaScriptMap(this._customCount++, pathToObject);
            mapAdder(scriptMap);
            const patchRequest = new PatchRequest_1.PatchRequest();
            patchRequest.script = scriptMap.getScript();
            patchRequest.values = scriptMap.parameters;
            if (!this._tryMergePatches(idOrEntity, patchRequest)) {
                this.defer(new PatchCommandData_1.PatchCommandData(idOrEntity, null, patchRequest, null));
            }
        }
        else {
            const metadata = this.getMetadataFor(idOrEntity);
            const id = metadata[Constants_1.CONSTANTS.Documents.Metadata.ID];
            this.patchObject(id, pathToObject, mapAdder);
        }
    }
    _tryMergePatches(id, patchRequest) {
        const command = this.deferredCommandsMap.get(IdTypeAndName_1.IdTypeAndName.keyFor(id, "PATCH", null));
        if (!command) {
            return false;
        }
        const commandIdx = this._deferredCommands.indexOf(command);
        if (commandIdx > -1) {
            this._deferredCommands.splice(commandIdx, 1);
        }
        const oldPatch = command;
        const newScript = oldPatch.patch.script + "\n" + patchRequest.script;
        const newVals = {};
        Object.keys(oldPatch.patch.values).forEach(key => {
            newVals[key] = oldPatch.patch.values[key];
        });
        Object.keys(patchRequest.values).forEach(key => {
            newVals[key] = patchRequest.values[key];
        });
        const newPatchRequest = new PatchRequest_1.PatchRequest();
        newPatchRequest.script = newScript;
        newPatchRequest.values = newVals;
        this.defer(new PatchCommandData_1.PatchCommandData(id, null, newPatchRequest, null));
        return true;
    }
    rawQuery(query, documentType) {
        if (documentType) {
            this.conventions.tryRegisterJsType(documentType);
        }
        return new RawDocumentQuery_1.RawDocumentQuery(this, query, documentType);
    }
    query(docTypeOrOpts, index) {
        if (TypeUtil_1.TypeUtil.isDocumentType(docTypeOrOpts)) {
            return this.documentQuery({
                documentType: docTypeOrOpts,
                index
            });
        }
        return this.documentQuery(docTypeOrOpts);
    }
    documentQuery(documentTypeOrOpts) {
        let opts;
        if (TypeUtil_1.TypeUtil.isDocumentType(documentTypeOrOpts)) {
            opts = { documentType: documentTypeOrOpts };
        }
        else {
            opts = documentTypeOrOpts;
            const { index } = opts, restOpts = __rest(opts, ["index"]);
            if (index) {
                opts = Object.assign(Object.assign({}, restOpts), { indexName: new opts.index().getIndexName() });
            }
        }
        if (opts.documentType) {
            this.conventions.tryRegisterJsType(opts.documentType);
        }
        const { indexName, collection } = this._processQueryParameters(opts, this.conventions);
        return new DocumentQuery_1.DocumentQuery(opts.documentType, this, indexName, collection, !!opts.isMapReduce);
    }
    _processQueryParameters(opts, conventions) {
        let { collection } = opts;
        const { indexName } = opts;
        const isIndex = !!indexName;
        const isCollection = !!collection;
        if (isIndex && isCollection) {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Parameters indexName and collectionName are mutually exclusive. Please specify only one of them.");
        }
        if (!isIndex && !isCollection) {
            const entityType = this.conventions.getJsTypeByDocumentType(opts.documentType);
            collection = this.conventions.getCollectionNameForType(entityType)
                || Constants_1.CONSTANTS.Documents.Metadata.ALL_DOCUMENTS_COLLECTION;
        }
        return { indexName, collection };
    }
    get attachments() {
        if (!this._attachments) {
            this._attachments = new DocumentSessionAttachments_1.DocumentSessionAttachments(this);
        }
        return this._attachments;
    }
    get revisions() {
        if (!this._revisions) {
            this._revisions = new DocumentSessionRevisions_1.DocumentSessionRevisions(this);
        }
        return this._revisions;
    }
    get clusterTransaction() {
        if (!this._clusterTransaction) {
            this._clusterTransaction = new ClusterTransactionOperations_1.ClusterTransactionOperations(this);
        }
        return this._clusterTransaction;
    }
    _hasClusterSession() {
        return !!this._clusterTransaction;
    }
    _clearClusterSession() {
        if (!this._hasClusterSession()) {
            return;
        }
        this.clusterSession.clear();
    }
    get clusterSession() {
        if (!this._clusterTransaction) {
            this._clusterTransaction = new ClusterTransactionOperations_1.ClusterTransactionOperations(this);
        }
        return this._clusterTransaction;
    }
    get lazily() {
        return new LazySessionOperations_1.LazySessionOperations(this);
    }
    get eagerly() {
        return this;
    }
    executeAllPendingLazyOperations() {
        return __awaiter(this, void 0, void 0, function* () {
            const requests = [];
            for (let i = this._pendingLazyOperations.length - 1; i >= 0; i -= 1) {
                const op = this._pendingLazyOperations[i];
                const req = op.createRequest();
                if (!req) {
                    this._pendingLazyOperations.splice(i, 1);
                    continue;
                }
                requests.unshift(req);
            }
            if (!requests.length) {
                return new ResponseTimeInformation_1.ResponseTimeInformation();
            }
            try {
                const sw = Stopwatch_1.Stopwatch.createStarted();
                const responseTimeDuration = new ResponseTimeInformation_1.ResponseTimeInformation();
                while (yield this._executeLazyOperationsSingleStep(responseTimeDuration, requests, sw)) {
                    yield (0, PromiseUtil_1.delay)(100);
                }
                responseTimeDuration.computeServerTotal();
                sw.stop();
                responseTimeDuration.totalClientDuration = sw.elapsed;
                return responseTimeDuration;
            }
            finally {
                this._pendingLazyOperations.length = 0;
            }
        });
    }
    _executeLazyOperationsSingleStep(responseTimeInformation, requests, sw) {
        return __awaiter(this, void 0, void 0, function* () {
            const multiGetOperation = new MultiGetOperation_1.MultiGetOperation(this);
            const multiGetCommand = multiGetOperation.createRequest(requests);
            try {
                yield this.requestExecutor.execute(multiGetCommand, this._sessionInfo);
                const responses = multiGetCommand.result;
                if (!multiGetCommand.aggressivelyCached) {
                    this.incrementRequestCount();
                }
                for (let i = 0; i < this._pendingLazyOperations.length; i++) {
                    const response = responses[i];
                    const tempReqTime = response.headers[Constants_1.HEADERS.REQUEST_TIME];
                    response.elapsed = sw.elapsed;
                    const totalTime = tempReqTime ? parseInt(tempReqTime, 10) : 0;
                    const timeItem = {
                        url: requests[i].urlAndQuery,
                        duration: totalTime
                    };
                    responseTimeInformation.durationBreakdown.push(timeItem);
                    if (response.requestHasErrors()) {
                        (0, Exceptions_1.throwError)("InvalidOperationException", "Got an error from server, status code: " + response.statusCode + os.EOL + response.result);
                    }
                    yield this._pendingLazyOperations[i].handleResponseAsync(response);
                    if (this._pendingLazyOperations[i].requiresRetry) {
                        return true;
                    }
                }
            }
            finally {
                multiGetCommand.dispose();
            }
            return false;
        });
    }
    addLazyOperation(operation) {
        this._pendingLazyOperations.push(operation);
        return new Lazy_1.Lazy(() => __awaiter(this, void 0, void 0, function* () {
            yield this.executeAllPendingLazyOperations();
            return operation.result;
        }));
    }
    addLazyCountOperation(operation) {
        this._pendingLazyOperations.push(operation);
        return new Lazy_1.Lazy(() => __awaiter(this, void 0, void 0, function* () {
            yield this.executeAllPendingLazyOperations();
            return operation.queryResult.totalResults;
        }));
    }
    lazyLoadInternal(ids, includes, clazz) {
        if (this.checkIfIdAlreadyIncluded(ids, includes)) {
            return new Lazy_1.Lazy(() => this.load(ids, { documentType: clazz }));
        }
        const loadOperation = new LoadOperation_1.LoadOperation(this)
            .byIds(ids)
            .withIncludes(includes);
        const lazyOp = new LazyLoadOperation_1.LazyLoadOperation(this, loadOperation, clazz)
            .byIds(ids)
            .withIncludes(includes);
        return this.addLazyOperation(lazyOp);
    }
    stream(queryOrIdPrefix, optsOrStatsCallback) {
        return __awaiter(this, arguments, void 0, function* () {
            if (TypeUtil_1.TypeUtil.isString(queryOrIdPrefix)) {
                return this._streamStartingWith(queryOrIdPrefix, optsOrStatsCallback);
            }
            if (arguments.length > 1 && typeof optsOrStatsCallback !== "function") {
                (0, Exceptions_1.throwError)("InvalidArgumentException", "Statistics callback must be a function.");
            }
            return this._streamQueryResults(queryOrIdPrefix, optsOrStatsCallback);
        });
    }
    _streamStartingWith(idPrefix, opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const streamOperation = new StreamOperation_1.StreamOperation(this);
            const command = streamOperation.createRequest(idPrefix, opts);
            yield this.requestExecutor.execute(command, this.sessionInfo);
            const docsReadable = streamOperation.setResult(command.result);
            let clazz = null;
            if (opts && "documentType" in opts) {
                clazz = this.conventions.getJsTypeByDocumentType(opts.documentType);
            }
            const result = this._getStreamResultTransform(this, clazz, null, false);
            result.on("newListener", (event, listener) => {
                if (event === "data") {
                    result.resume();
                }
            });
            result.on("removeListener", (event, listener) => {
                if (event === "data") {
                    result.pause();
                }
            });
            return stream.pipeline(docsReadable, result);
        });
    }
    _streamQueryResults(query, streamQueryStatsCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            const streamOperation = new StreamOperation_1.StreamOperation(this);
            const command = streamOperation.createRequest(query.getIndexQuery());
            yield this.requestExecutor.execute(command, this.sessionInfo);
            const docsReadable = streamOperation.setResult(command.result);
            const result = this._getStreamResultTransform(this, query.getQueryType(), query.fieldsToFetchToken, query.isProjectInto);
            docsReadable.once("stats", stats => {
                (streamQueryStatsCallback || TypeUtil_1.TypeUtil.NOOP)(stats);
                result.emit("stats", stats);
            });
            result.on("newListener", (event, listener) => {
                if (event === "data") {
                    result.resume();
                }
            });
            result.on("removeListener", (event, listener) => {
                if (event === "data") {
                    result.pause();
                }
            });
            return stream.pipeline(docsReadable, result);
        });
    }
    _getStreamResultTransform(session, clazz, fieldsToFetchToken, isProjectInto) {
        return new stream.Transform({
            objectMode: true,
            transform(chunk, encoding, callback) {
                const doc = chunk["value"];
                const metadata = doc[Constants_1.CONSTANTS.Documents.Metadata.KEY];
                const changeVector = metadata[Constants_1.CONSTANTS.Documents.Metadata.CHANGE_VECTOR];
                const id = metadata[Constants_1.CONSTANTS.Documents.Metadata.ID] || null;
                const entity = QueryOperation_1.QueryOperation.deserialize(id, doc, metadata, fieldsToFetchToken || null, true, session, clazz, isProjectInto);
                callback(null, {
                    changeVector,
                    metadata,
                    id,
                    document: entity
                });
            }
        });
    }
    streamInto(query, writable) {
        return __awaiter(this, void 0, void 0, function* () {
            const streamOperation = new StreamOperation_1.StreamOperation(this);
            const command = streamOperation.createRequest(query.getIndexQuery());
            yield this.requestExecutor.execute(command, this._sessionInfo);
            return (0, Pipelines_1.streamResultsIntoStream)(command.result.stream, this.conventions, writable);
        });
    }
    countersFor(entityOrId) {
        return new SessionDocumentCounters_1.SessionDocumentCounters(this, entityOrId);
    }
    graphQuery(query, documentType) {
        return new GraphDocumentQuery_1.GraphDocumentQuery(this, query, documentType);
    }
    timeSeriesFor(entityOrDocumentId, nameOrClass, clazz) {
        if (clazz) {
            const name = nameOrClass;
            const tsName = name !== null && name !== void 0 ? name : TimeSeriesOperations_1.TimeSeriesOperations.getTimeSeriesName(clazz, this.conventions);
            return new SessionDocumentTypedTimeSeries_1.SessionDocumentTypedTimeSeries(this, entityOrDocumentId, tsName, clazz);
        }
        if (TypeUtil_1.TypeUtil.isString(nameOrClass)) {
            return new SessionDocumentTimeSeries_1.SessionDocumentTimeSeries(this, entityOrDocumentId, nameOrClass);
        }
        else {
            const tsName = TimeSeriesOperations_1.TimeSeriesOperations.getTimeSeriesName(nameOrClass, this.conventions);
            return new SessionDocumentTypedTimeSeries_1.SessionDocumentTypedTimeSeries(this, entityOrDocumentId, tsName, nameOrClass);
        }
    }
    timeSeriesRollupFor(entityOrDocumentId, policy, rawOrClass, clazz) {
        if (clazz) {
            const name = rawOrClass;
            const tsName = name !== null && name !== void 0 ? name : TimeSeriesOperations_1.TimeSeriesOperations.getTimeSeriesName(clazz, this.conventions);
            return new SessionDocumentRollupTypedTimeSeries_1.SessionDocumentRollupTypedTimeSeries(this, entityOrDocumentId, tsName + RawTimeSeriesTypes_1.TIME_SERIES_ROLLUP_SEPARATOR + policy, clazz);
        }
        const tsName = TimeSeriesOperations_1.TimeSeriesOperations.getTimeSeriesName(rawOrClass, this.conventions);
        return new SessionDocumentRollupTypedTimeSeries_1.SessionDocumentRollupTypedTimeSeries(this, entityOrDocumentId, tsName + RawTimeSeriesTypes_1.TIME_SERIES_ROLLUP_SEPARATOR + policy, rawOrClass);
    }
    conditionalLoad(id, changeVector, clazz) {
        return __awaiter(this, void 0, void 0, function* () {
            if (StringUtil_1.StringUtil.isNullOrEmpty(id)) {
                (0, Exceptions_1.throwError)("InvalidArgumentException", "Id cannot be null");
            }
            if (this.advanced.isLoaded(id)) {
                const entity = yield this.load(id, clazz);
                if (!entity) {
                    return {
                        entity: null,
                        changeVector: null
                    };
                }
                const cv = this.advanced.getChangeVectorFor(entity);
                return {
                    entity,
                    changeVector: cv
                };
            }
            if (StringUtil_1.StringUtil.isNullOrEmpty(changeVector)) {
                (0, Exceptions_1.throwError)("InvalidArgumentException", "The requested document with id '" + id + "' is not loaded into the session and could not conditional load when changeVector is null or empty.");
            }
            this.incrementRequestCount();
            const cmd = new ConditionalGetDocumentsCommand_1.ConditionalGetDocumentsCommand(id, changeVector, this.conventions);
            yield this.advanced.requestExecutor.execute(cmd);
            switch (cmd.statusCode) {
                case StatusCode_1.StatusCodes.NotModified:
                    return {
                        entity: null,
                        changeVector
                    };
                case StatusCode_1.StatusCodes.NotFound:
                    this.registerMissing(id);
                    return {
                        entity: null,
                        changeVector: null
                    };
            }
            const documentInfo = DocumentInfo_1.DocumentInfo.getNewDocumentInfo(cmd.result.results[0]);
            const r = this.trackEntity(clazz, documentInfo);
            return {
                entity: r,
                changeVector: cmd.result.changeVector
            };
        });
    }
}
exports.DocumentSession = DocumentSession;
