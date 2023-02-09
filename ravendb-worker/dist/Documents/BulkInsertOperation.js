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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkInsertCommand = exports.BulkInsertOperation = void 0;
const GenerateEntityIdOnTheClient_1 = require("./Identity/GenerateEntityIdOnTheClient");
const stream = require("readable-stream");
const RavenCommand_1 = require("../Http/RavenCommand");
const MetadataAsDictionary_1 = require("../Mapping/MetadataAsDictionary");
const Constants_1 = require("../Constants");
const Exceptions_1 = require("../Exceptions");
const GetOperationStateOperation_1 = require("./Operations/GetOperationStateOperation");
const StringUtil_1 = require("../Utility/StringUtil");
const StreamUtil = require("../Utility/StreamUtil");
const Serializer_1 = require("../Mapping/Json/Serializer");
const GetNextOperationIdCommand_1 = require("./Commands/GetNextOperationIdCommand");
const DocumentInfo_1 = require("./Session/DocumentInfo");
const EntityToJson_1 = require("./Session/EntityToJson");
const KillOperationCommand_1 = require("./Commands/KillOperationCommand");
const TypeUtil_1 = require("../Utility/TypeUtil");
const TypedTimeSeriesEntry_1 = require("./Session/TimeSeries/TypedTimeSeriesEntry");
const TimeSeriesOperations_1 = require("./TimeSeries/TimeSeriesOperations");
const TimeSeriesValuesHelper_1 = require("./Session/TimeSeries/TimeSeriesValuesHelper");
class BulkInsertOperation {
    constructor(database, store, options) {
        this._completedWithError = false;
        this._first = true;
        this._countersOperation = new BulkInsertOperation._countersBulkInsertOperationClass(this);
        this._attachmentsOperation = new BulkInsertOperation._attachmentsBulkInsertOperationClass(this);
        this._operationId = -1;
        this._useCompression = false;
        this._concurrentCheck = 0;
        this._isInitialWrite = true;
        this._conventions = store.conventions;
        if (StringUtil_1.StringUtil.isNullOrEmpty(database)) {
            this._throwNoDatabase();
        }
        this._requestExecutor = store.getRequestExecutor(database);
        this._useCompression = options ? options.useCompression : false;
        this._options = options !== null && options !== void 0 ? options : {};
        this._timeSeriesBatchSize = this._conventions.bulkInsert.timeSeriesBatchSize;
        this._generateEntityIdOnTheClient = new GenerateEntityIdOnTheClient_1.GenerateEntityIdOnTheClient(this._requestExecutor.conventions, entity => this._requestExecutor.conventions.generateDocumentId(database, entity));
        this._bulkInsertAborted = new Promise((_, reject) => this._abortReject = reject);
        this._bulkInsertAborted.catch(err => {
        });
    }
    get useCompression() {
        return this._useCompression;
    }
    set useCompression(value) {
        this._useCompression = value;
    }
    _throwBulkInsertAborted(e) {
        return __awaiter(this, void 0, void 0, function* () {
            let errorFromServer;
            try {
                errorFromServer = yield this._getExceptionFromOperation();
            }
            catch (ee) {
            }
            if (errorFromServer) {
                throw errorFromServer;
            }
            (0, Exceptions_1.throwError)("BulkInsertAbortedException", "Failed to execute bulk insert", e);
        });
    }
    _throwNoDatabase() {
        (0, Exceptions_1.throwError)("InvalidOperationException", "Cannot start bulk insert operation without specifying a name of a database to operate on."
            + "Database name can be passed as an argument when bulk insert is being created or default database can be defined using 'DocumentStore.setDatabase' method.");
    }
    _waitForId() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._operationId !== -1) {
                return;
            }
            const bulkInsertGetIdRequest = new GetNextOperationIdCommand_1.GetNextOperationIdCommand();
            yield this._requestExecutor.execute(bulkInsertGetIdRequest);
            this._operationId = bulkInsertGetIdRequest.result;
            this._nodeTag = bulkInsertGetIdRequest.nodeTag;
        });
    }
    static _typeCheckStoreArgs(idOrMetadata, optionalMetadata) {
        let id;
        let metadata;
        let getId = false;
        if (typeof idOrMetadata === "string" || optionalMetadata) {
            id = idOrMetadata;
            metadata = optionalMetadata;
        }
        else {
            metadata = idOrMetadata;
            if (metadata && (Constants_1.CONSTANTS.Documents.Metadata.ID in metadata)) {
                id = metadata[Constants_1.CONSTANTS.Documents.Metadata.ID];
            }
        }
        if (!id) {
            getId = true;
        }
        return { id, metadata, getId };
    }
    store(entity, idOrMetadata, optionalMetadata) {
        return __awaiter(this, void 0, void 0, function* () {
            const opts = BulkInsertOperation._typeCheckStoreArgs(idOrMetadata, optionalMetadata);
            let metadata = opts.metadata;
            const id = opts.getId ? yield this._getId(entity) : opts.id;
            BulkInsertOperation._verifyValidId(id);
            if (!this._currentWriter) {
                yield this._waitForId();
                yield this._ensureStream();
            }
            if (this._completedWithError || this._aborted) {
                yield this._checkIfBulkInsertWasAborted();
            }
            if (!metadata) {
                metadata = (0, MetadataAsDictionary_1.createMetadataDictionary)({
                    raw: {}
                });
            }
            if (!("@collection" in metadata)) {
                const collection = this._requestExecutor.conventions.getCollectionNameForEntity(entity);
                if (collection) {
                    metadata["@collection"] = collection;
                }
            }
            if (!("Raven-Node-Type" in metadata)) {
                const descriptor = this._conventions.getTypeDescriptorByEntity(entity);
                const jsType = this._requestExecutor.conventions.getJsTypeName(descriptor);
                if (jsType) {
                    metadata["Raven-Node-Type"] = jsType;
                }
            }
            this._endPreviousCommandIfNeeded();
            if (this._first) {
                this._first = false;
            }
            else {
                this._writeComma();
            }
            this._inProgressCommand = "None";
            const documentInfo = new DocumentInfo_1.DocumentInfo();
            documentInfo.metadataInstance = metadata;
            let json = EntityToJson_1.EntityToJson.convertEntityToJson(entity, this._conventions, documentInfo, true);
            if (this._conventions.remoteEntityFieldNameConvention) {
                json = this._conventions.transformObjectKeysToRemoteFieldNameConvention(json);
            }
            this._currentWriter.push(`{"Id":"`);
            this._writeString(id);
            const jsonString = Serializer_1.JsonSerializer.getDefault().serialize(json);
            this._currentWriter.push(`","Type":"PUT","Document":${jsonString}}`);
        });
    }
    _handleErrors(documentId, e) {
        const error = this._getExceptionFromOperation();
        if (error) {
            throw error;
        }
        (0, Exceptions_1.throwError)("InvalidOperationException", "Bulk insert error", e);
    }
    _concurrencyCheck() {
        if (this._concurrentCheck) {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Bulk Insert store methods cannot be executed concurrently.");
        }
        this._concurrentCheck = 1;
        return {
            dispose: () => this._concurrentCheck = 0
        };
    }
    _endPreviousCommandIfNeeded() {
        if (this._inProgressCommand === "Counters") {
            this._countersOperation.endPreviousCommandIfNeeded();
        }
        else if (this._inProgressCommand === "TimeSeries") {
            BulkInsertOperation.throwAlreadyRunningTimeSeries();
        }
    }
    _writeString(input) {
        for (let i = 0; i < input.length; i++) {
            const c = input[i];
            if (`"` === c) {
                if (i === 0 || input[i - 1] !== `\\`) {
                    this._currentWriter.push("\\");
                }
            }
            this._currentWriter.push(c);
        }
    }
    _writeComma() {
        this._currentWriter.push(",");
    }
    _executeBeforeStore() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this._currentWriter) {
                yield this._waitForId();
                yield this._ensureStream();
            }
            yield this._checkIfBulkInsertWasAborted();
        });
    }
    _checkIfBulkInsertWasAborted() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._completedWithError) {
                try {
                    yield this._bulkInsertExecuteTask;
                }
                catch (error) {
                    yield this._throwBulkInsertAborted(error);
                }
                finally {
                    this._currentWriter.emit("end");
                }
            }
            if (this._aborted) {
                try {
                    yield this._bulkInsertAborted;
                }
                finally {
                    this._currentWriter.emit("end");
                }
            }
        });
    }
    static _verifyValidId(id) {
        if (StringUtil_1.StringUtil.isNullOrEmpty(id)) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Document id must have a non empty value");
        }
        if (id.endsWith("|")) {
            (0, Exceptions_1.throwError)("NotSupportedException", "Document ids cannot end with '|', but was called with " + id);
        }
    }
    _getExceptionFromOperation() {
        return __awaiter(this, void 0, void 0, function* () {
            const stateRequest = new GetOperationStateOperation_1.GetOperationStateCommand(this._operationId, this._nodeTag);
            yield this._requestExecutor.execute(stateRequest);
            if (!stateRequest.result) {
                return null;
            }
            const result = stateRequest.result["result"];
            if (stateRequest.result["status"] !== "Faulted") {
                return null;
            }
            return (0, Exceptions_1.getError)("BulkInsertAbortedException", result.error);
        });
    }
    _ensureStream() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this._currentWriter = new stream.PassThrough();
                this._requestBodyStream = new stream.PassThrough();
                const bulkCommand = new BulkInsertCommand(this._operationId, this._requestBodyStream, this._nodeTag, this._options.skipOverwriteIfUnchanged);
                bulkCommand.useCompression = this._useCompression;
                const bulkCommandPromise = this._requestExecutor.execute(bulkCommand);
                this._pipelineFinished = StreamUtil.pipelineAsync(this._currentWriter, this._requestBodyStream);
                this._currentWriter.push("[");
                this._bulkInsertExecuteTask = Promise.all([
                    bulkCommandPromise,
                    this._pipelineFinished
                ]);
                this._bulkInsertExecuteTask
                    .catch(() => this._completedWithError = true);
            }
            catch (e) {
                (0, Exceptions_1.throwError)("RavenException", "Unable to open bulk insert stream.", e);
            }
        });
    }
    abort() {
        return __awaiter(this, void 0, void 0, function* () {
            this._aborted = true;
            if (this._operationId !== -1) {
                yield this._waitForId();
                try {
                    yield this._requestExecutor.execute(new KillOperationCommand_1.KillOperationCommand(this._operationId, this._nodeTag));
                }
                catch (err) {
                    const bulkInsertError = (0, Exceptions_1.getError)("BulkInsertAbortedException", "Unable to kill bulk insert operation, because it was not found on the server.", err);
                    this._abortReject(bulkInsertError);
                    return;
                }
            }
            this._abortReject((0, Exceptions_1.getError)("BulkInsertAbortedException", "Bulk insert was aborted by the user."));
        });
    }
    finish() {
        return __awaiter(this, void 0, void 0, function* () {
            this._endPreviousCommandIfNeeded();
            if (this._currentWriter) {
                this._currentWriter.push("]");
                this._currentWriter.push(null);
            }
            if (this._operationId === -1) {
                return;
            }
            if (this._completedWithError || this._aborted) {
                yield this._checkIfBulkInsertWasAborted();
            }
            yield Promise.race([
                this._bulkInsertExecuteTask || Promise.resolve(),
                this._bulkInsertAborted || Promise.resolve()
            ]);
        });
    }
    _getId(entity) {
        return __awaiter(this, void 0, void 0, function* () {
            let idRef;
            if (this._generateEntityIdOnTheClient.tryGetIdFromInstance(entity, id => idRef = id)) {
                return idRef;
            }
            idRef = yield this._generateEntityIdOnTheClient.generateDocumentKeyForStorage(entity);
            this._generateEntityIdOnTheClient.trySetIdentity(entity, idRef);
            return idRef;
        });
    }
    attachmentsFor(id) {
        if (StringUtil_1.StringUtil.isNullOrEmpty(id)) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Document id cannot be null or empty");
        }
        return new BulkInsertOperation._attachmentsBulkInsertClass(this, id);
    }
    timeSeriesFor(classOrId, idOrName, name) {
        if (TypeUtil_1.TypeUtil.isString(classOrId)) {
            return this._timeSeriesFor(classOrId, idOrName);
        }
        else {
            return this._typedTimeSeriesFor(classOrId, idOrName, name);
        }
    }
    _typedTimeSeriesFor(clazz, id, name = null) {
        if (StringUtil_1.StringUtil.isNullOrEmpty(id)) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Document id cannot be null or empty");
        }
        let tsName = name;
        if (!tsName) {
            tsName = TimeSeriesOperations_1.TimeSeriesOperations.getTimeSeriesName(clazz, this._conventions);
        }
        if (StringUtil_1.StringUtil.isNullOrEmpty(tsName)) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Time series name cannot be null or empty");
        }
        return new BulkInsertOperation._typedTimeSeriesBulkInsertClass(this, clazz, id, tsName);
    }
    countersFor(id) {
        if (StringUtil_1.StringUtil.isNullOrEmpty(id)) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Document id cannot be null or empty");
        }
        return new BulkInsertOperation._countersBulkInsertClass(this, id);
    }
    _timeSeriesFor(id, name) {
        if (StringUtil_1.StringUtil.isNullOrEmpty(id)) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Document id cannot be null or empty");
        }
        if (StringUtil_1.StringUtil.isNullOrEmpty(name)) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Time series name cannot be null or empty");
        }
        return new BulkInsertOperation._timeSeriesBulkInsertClass(this, id, name);
    }
    static throwAlreadyRunningTimeSeries() {
        (0, Exceptions_1.throwError)("InvalidOperationException", "There is an already running time series operation, did you forget to close it?");
    }
}
exports.BulkInsertOperation = BulkInsertOperation;
BulkInsertOperation._countersBulkInsertClass = class CountersBulkInsert {
    constructor(operation, id) {
        this._operation = operation;
        this._id = id;
    }
    increment(name, delta = 1) {
        return this._operation._countersOperation.increment(this._id, name, delta);
    }
};
BulkInsertOperation._countersBulkInsertOperationClass = (_a = class CountersBulkInsertOperation {
        constructor(bulkInsertOperation) {
            this._first = true;
            this._countersInBatch = 0;
            this._operation = bulkInsertOperation;
        }
        increment(id, name, delta = 1) {
            return __awaiter(this, void 0, void 0, function* () {
                const check = this._operation._concurrencyCheck();
                try {
                    yield this._operation._executeBeforeStore();
                    if (this._operation._inProgressCommand === "TimeSeries") {
                        BulkInsertOperation.throwAlreadyRunningTimeSeries();
                    }
                    try {
                        const isFirst = !this._id;
                        if (isFirst || !StringUtil_1.StringUtil.equalsIgnoreCase(this._id, id)) {
                            if (!isFirst) {
                                this._operation._currentWriter.push("]}},");
                            }
                            else if (!this._operation._first) {
                                this._operation._writeComma();
                            }
                            this._operation._first = false;
                            this._id = id;
                            this._operation._inProgressCommand = "Counters";
                            this._writePrefixForNewCommand();
                        }
                        if (this._countersInBatch >= CountersBulkInsertOperation.MAX_COUNTERS_IN_BATCH) {
                            this._operation._currentWriter.push("]}},");
                            this._writePrefixForNewCommand();
                        }
                        this._countersInBatch++;
                        if (!this._first) {
                            this._operation._writeComma();
                        }
                        this._first = false;
                        this._operation._currentWriter.push(`{"Type":"Increment","CounterName":"`);
                        this._operation._writeString(name);
                        this._operation._currentWriter.push(`","Delta":`);
                        this._operation._currentWriter.push(delta.toString());
                        this._operation._currentWriter.push("}");
                    }
                    catch (e) {
                        this._operation._handleErrors(this._id, e);
                    }
                }
                finally {
                    check.dispose();
                }
            });
        }
        endPreviousCommandIfNeeded() {
            if (!this._id) {
                return;
            }
            this._operation._currentWriter.push("]}}");
            this._id = null;
        }
        _writePrefixForNewCommand() {
            this._first = true;
            this._countersInBatch = 0;
            this._operation._currentWriter.push(`{"Id":"`);
            this._operation._writeString(this._id);
            this._operation._currentWriter.push(`","Type":"Counters","Counters":{"DocumentId":"`);
            this._operation._writeString(this._id);
            this._operation._currentWriter.push(`","Operations":[`);
        }
    },
    _a.MAX_COUNTERS_IN_BATCH = 1024,
    _a);
BulkInsertOperation._timeSeriesBulkInsertBaseClass = class TimeSeriesBulkInsertBase {
    constructor(operation, id, name) {
        this._first = true;
        this._timeSeriesInBatch = 0;
        operation._endPreviousCommandIfNeeded();
        this._operation = operation;
        this._id = id;
        this._name = name;
        this._operation._inProgressCommand = "TimeSeries";
    }
    _appendInternal(timestamp, values, tag) {
        return __awaiter(this, void 0, void 0, function* () {
            const check = this._operation._concurrencyCheck();
            try {
                yield this._operation._executeBeforeStore();
                try {
                    if (this._first) {
                        if (!this._operation._first) {
                            this._operation._writeComma();
                        }
                        this._writePrefixForNewCommand();
                    }
                    else if (this._timeSeriesInBatch >= this._operation._timeSeriesBatchSize) {
                        this._operation._currentWriter.push("]}},");
                        this._writePrefixForNewCommand();
                    }
                    this._timeSeriesInBatch++;
                    if (!this._first) {
                        this._operation._writeComma();
                    }
                    this._first = false;
                    this._operation._currentWriter.push("[");
                    this._operation._currentWriter.push(timestamp.getTime().toString());
                    this._operation._writeComma();
                    this._operation._currentWriter.push(values.length.toString());
                    this._operation._writeComma();
                    let firstValue = true;
                    for (const value of values) {
                        if (!firstValue) {
                            this._operation._writeComma();
                        }
                        firstValue = false;
                        this._operation._currentWriter.push((value !== null && value !== void 0 ? value : 0).toString());
                    }
                    if (tag) {
                        this._operation._currentWriter.push(`,"`);
                        this._operation._writeString(tag);
                        this._operation._currentWriter.push(`"`);
                    }
                    this._operation._currentWriter.push("]");
                }
                catch (e) {
                    this._operation._handleErrors(this._id, e);
                }
            }
            finally {
                check.dispose();
            }
        });
    }
    _writePrefixForNewCommand() {
        this._first = true;
        this._timeSeriesInBatch = 0;
        this._operation._currentWriter.push(`{"Id":"`);
        this._operation._writeString(this._id);
        this._operation._currentWriter.push(`","Type":"TimeSeriesBulkInsert","TimeSeries":{"Name":"`);
        this._operation._writeString(this._name);
        this._operation._currentWriter.push(`","TimeFormat":"UnixTimeInMs","Appends":[`);
    }
    dispose() {
        this._operation._inProgressCommand = "None";
        if (!this._first) {
            this._operation._currentWriter.push("]}}");
        }
    }
};
BulkInsertOperation._timeSeriesBulkInsertClass = class TimeSeriesBulkInsert extends BulkInsertOperation._timeSeriesBulkInsertBaseClass {
    constructor(operation, id, name) {
        super(operation, id, name);
    }
    append(timestamp, valueOrValues, tag) {
        if (TypeUtil_1.TypeUtil.isArray(valueOrValues)) {
            return this._appendInternal(timestamp, valueOrValues, tag);
        }
        else {
            return this._appendInternal(timestamp, [valueOrValues], tag);
        }
    }
};
BulkInsertOperation._typedTimeSeriesBulkInsertClass = class TypedTimeSeriesBulkInsert extends BulkInsertOperation._timeSeriesBulkInsertBaseClass {
    constructor(operation, clazz, id, name) {
        super(operation, id, name);
        this.clazz = clazz;
    }
    append(timestampOrEntry, value, tag) {
        if (timestampOrEntry instanceof TypedTimeSeriesEntry_1.TypedTimeSeriesEntry) {
            return this.append(timestampOrEntry.timestamp, timestampOrEntry.value, timestampOrEntry.tag);
        }
        else {
            const values = TimeSeriesValuesHelper_1.TimeSeriesValuesHelper.getValues(this.clazz, value);
            return this._appendInternal(timestampOrEntry, values, tag);
        }
    }
};
BulkInsertOperation._attachmentsBulkInsertClass = class AttachmentsBulkInsert {
    constructor(operation, id) {
        this._operation = operation;
        this._id = id;
    }
    store(name, bytes, contentType) {
        return this._operation._attachmentsOperation.store(this._id, name, bytes, contentType);
    }
};
BulkInsertOperation._attachmentsBulkInsertOperationClass = class AttachmentsBulkInsertOperation {
    constructor(operation) {
        this._operation = operation;
    }
    store(id, name, bytes, contentType) {
        return __awaiter(this, void 0, void 0, function* () {
            const check = this._operation._concurrencyCheck();
            try {
                this._operation._endPreviousCommandIfNeeded();
                yield this._operation._executeBeforeStore();
                try {
                    if (!this._operation._first) {
                        this._operation._writeComma();
                    }
                    this._operation._currentWriter.push(`{"Id":"`);
                    this._operation._writeString(id);
                    this._operation._currentWriter.push(`","Type":"AttachmentPUT","Name":"`);
                    this._operation._writeString(name);
                    if (contentType) {
                        this._operation._currentWriter.push(`","ContentType":"`);
                        this._operation._writeString(contentType);
                    }
                    this._operation._currentWriter.push(`","ContentLength":`);
                    this._operation._currentWriter.push(bytes.length.toString());
                    this._operation._currentWriter.push("}");
                    this._operation._currentWriter.push(bytes);
                }
                catch (e) {
                    this._operation._handleErrors(id, e);
                }
            }
            finally {
                check.dispose();
            }
        });
    }
};
class BulkInsertCommand extends RavenCommand_1.RavenCommand {
    constructor(id, stream, nodeTag, skipOverwriteIfUnchanged) {
        super();
        this._stream = stream;
        this._id = id;
        this._selectedNodeTag = nodeTag;
        this._skipOverwriteIfUnchanged = skipOverwriteIfUnchanged;
    }
    get isReadRequest() {
        return false;
    }
    createRequest(node) {
        const uri = node.url
            + "/databases/" + node.database
            + "/bulk_insert?id=" + this._id
            + "&skipOverwriteIfUnchanged=" + (this._skipOverwriteIfUnchanged ? "true" : "false");
        const headers = this._headers().typeAppJson().build();
        return {
            method: "POST",
            uri,
            body: this._stream,
            headers
        };
    }
    setResponseAsync(bodyStream, fromCache) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, Exceptions_1.throwError)("NotImplementedException", "Not implemented");
        });
    }
}
exports.BulkInsertCommand = BulkInsertCommand;
