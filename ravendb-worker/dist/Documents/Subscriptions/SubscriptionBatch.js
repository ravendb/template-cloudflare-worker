"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Item = exports.SubscriptionBatch = void 0;
const LogUtil_1 = require("../../Utility/LogUtil");
const GenerateEntityIdOnTheClient_1 = require("../Identity/GenerateEntityIdOnTheClient");
const Exceptions_1 = require("../../Exceptions");
const os = require("os");
const Constants_1 = require("../../Constants");
const StringUtil_1 = require("../../Utility/StringUtil");
const MetadataAsDictionary_1 = require("../../Mapping/MetadataAsDictionary");
const DocumentInfo_1 = require("../Session/DocumentInfo");
class SubscriptionBatch {
    constructor(documentType, revisions, requestExecutor, store, dbName) {
        this._logger = (0, LogUtil_1.getLogger)({ module: "SubscriptionBatch" });
        this._items = [];
        this._documentType = documentType;
        this._revisions = revisions;
        this._requestExecutor = requestExecutor;
        this._store = store;
        this._dbName = dbName;
        this._generateEntityIdOnTheClient = new GenerateEntityIdOnTheClient_1.GenerateEntityIdOnTheClient(this._requestExecutor.conventions, () => (0, Exceptions_1.throwError)("InvalidOperationException", "Shouldn't be generating new ids here"));
    }
    get items() {
        return this._items;
    }
    openSession(options) {
        if (options) {
            SubscriptionBatch._validateSessionOptions(options);
        }
        options = options || {};
        options.database = this._dbName;
        options.requestExecutor = this._requestExecutor;
        return this._openSessionInternal(options);
    }
    _openSessionInternal(options) {
        const s = this._store.openSession(options);
        this._loadDataToSession(s);
        return s;
    }
    getNumberOfItemsInBatch() {
        return this._items ? this._items.length : 0;
    }
    getNumberOfIncludes() {
        return this._includes ? this._includes.length : 0;
    }
    static _validateSessionOptions(options) {
        if (options.database) {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Cannot set Database when session is opened in subscription.");
        }
        if (options.requestExecutor) {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Cannot set RequestExecutor when session is opened in subscription.");
        }
        if (options.transactionMode !== "SingleNode") {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Cannot set TransactionMode when session is opened in subscription. Only 'SingleNode' is supported.");
        }
    }
    _loadDataToSession(session) {
        if (session.noTracking) {
            return;
        }
        if (this._includes && this._includes.length) {
            for (const item of this._includes) {
                session.registerIncludes(item);
            }
        }
        if (this._counterIncludes && this._counterIncludes.length) {
            for (const item of this._counterIncludes) {
                session.registerCounters(item.includes, item.counterIncludes);
            }
        }
        if (this._timeSeriesIncludes && this._timeSeriesIncludes.length > 0) {
            for (const item of this._timeSeriesIncludes) {
                session.registerTimeSeries(item);
            }
        }
        for (const item of this._items) {
            if (item.projection || item.revision) {
                continue;
            }
            const documentInfo = new DocumentInfo_1.DocumentInfo();
            documentInfo.id = item.id;
            documentInfo.document = item.rawResult;
            documentInfo.metadata = item.rawMetadata;
            documentInfo.changeVector = item.changeVector;
            documentInfo.entity = item.result;
            documentInfo.newDocument = false;
            session.registerExternalLoadedIntoTheSession(documentInfo);
        }
    }
    initialize(batch) {
        var _a;
        this._includes = batch.includes;
        this._counterIncludes = batch.counterIncludes;
        this._timeSeriesIncludes = batch.timeSeriesIncludes;
        this._items.length = 0;
        let lastReceivedChangeVector;
        for (const item of batch.messages) {
            const curDoc = item.data;
            const metadata = curDoc[Constants_1.CONSTANTS.Documents.Metadata.KEY];
            if (!metadata) {
                SubscriptionBatch._throwRequired("@metadata field");
            }
            const id = metadata[Constants_1.CONSTANTS.Documents.Metadata.ID];
            if (!id) {
                SubscriptionBatch._throwRequired("@id field");
            }
            const changeVector = metadata[Constants_1.CONSTANTS.Documents.Metadata.CHANGE_VECTOR];
            if (!changeVector) {
                SubscriptionBatch._throwRequired("@change-vector field");
            }
            lastReceivedChangeVector = changeVector;
            const projection = (_a = metadata[Constants_1.CONSTANTS.Documents.Metadata.PROJECTION]) !== null && _a !== void 0 ? _a : false;
            this._logger.info("Got " + id + " (change vector: [" + lastReceivedChangeVector + "]");
            let instance = null;
            if (!item.exception) {
                instance = curDoc;
                if (!StringUtil_1.StringUtil.isNullOrEmpty(id)) {
                    this._generateEntityIdOnTheClient.trySetIdentity(instance, id);
                }
            }
            const itemToAdd = new Item();
            itemToAdd.changeVector = changeVector;
            itemToAdd.id = id;
            itemToAdd.rawResult = curDoc;
            itemToAdd.rawMetadata = metadata;
            itemToAdd.result = instance;
            itemToAdd.exceptionMessage = item.exception;
            itemToAdd.projection = projection;
            itemToAdd.revision = this._revisions;
            this._items.push(itemToAdd);
        }
        return lastReceivedChangeVector;
    }
    static _throwRequired(name) {
        (0, Exceptions_1.throwError)("InvalidOperationException", "Document must have a " + name);
    }
}
exports.SubscriptionBatch = SubscriptionBatch;
class Item {
    _throwItemProcessError() {
        (0, Exceptions_1.throwError)("InvalidOperationException", "Failed to process document " + this.id + " with Change Vector "
            + this.changeVector + " because: " + os.EOL + this.exceptionMessage);
    }
    get result() {
        if (this.exceptionMessage) {
            this._throwItemProcessError();
        }
        return this._result;
    }
    set result(result) {
        this._result = result;
    }
    get metadata() {
        if (!this._metadata) {
            this._metadata = (0, MetadataAsDictionary_1.createMetadataDictionary)({ raw: this.rawMetadata });
        }
        return this._metadata;
    }
}
exports.Item = Item;