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
exports.DeletedEntitiesHolder = exports.DocumentsByEntityHolder = exports.InMemoryDocumentSessionOperations = void 0;
const EntityToJson_1 = require("./EntityToJson");
const IDocumentSession_1 = require("./IDocumentSession");
const SessionEvents_1 = require("./SessionEvents");
const Exceptions_1 = require("../../Exceptions");
const DocumentsById_1 = require("./DocumentsById");
const DocumentInfo_1 = require("./DocumentInfo");
const CommandData_1 = require("../Commands/CommandData");
const GenerateEntityIdOnTheClient_1 = require("../Identity/GenerateEntityIdOnTheClient");
const Json_1 = require("../../Mapping/Json");
const Constants_1 = require("../../Constants");
const DateUtil_1 = require("../../Utility/DateUtil");
const ObjectUtil_1 = require("../../Utility/ObjectUtil");
const IncludesUtil_1 = require("./IncludesUtil");
const TypeUtil_1 = require("../../Utility/TypeUtil");
const IdTypeAndName_1 = require("../IdTypeAndName");
const DocumentsChanges_1 = require("./DocumentsChanges");
const events_1 = require("events");
const JsonOperation_1 = require("../../Mapping/JsonOperation");
const Serializer_1 = require("../../Mapping/Json/Serializer");
const MetadataAsDictionary_1 = require("../../Mapping/MetadataAsDictionary");
const CaseInsensitiveKeysMap_1 = require("../../Primitives/CaseInsensitiveKeysMap");
const CaseInsensitiveStringSet_1 = require("../../Primitives/CaseInsensitiveStringSet");
const SessionOperationExecutor_1 = require("../Operations/SessionOperationExecutor");
const StringUtil_1 = require("../../Utility/StringUtil");
const ForceRevisionCommandData_1 = require("../Commands/Batches/ForceRevisionCommandData");
const TimeSeriesRangeResult_1 = require("../Operations/TimeSeries/TimeSeriesRangeResult");
const DatesComparator_1 = require("../../Primitives/DatesComparator");
const GetTimeSeriesOperation_1 = require("../Operations/TimeSeries/GetTimeSeriesOperation");
class InMemoryDocumentSessionOperations extends events_1.EventEmitter {
    constructor(documentStore, id, options) {
        super();
        this._pendingLazyOperations = [];
        this._hash = ++InMemoryDocumentSessionOperations._instancesCounter;
        this._jsonSerializer = Serializer_1.JsonSerializer.getDefaultForCommandPayload();
        this._knownMissingIds = CaseInsensitiveStringSet_1.CaseInsensitiveStringSet.create();
        this.documentsById = new DocumentsById_1.DocumentsById();
        this.idsForCreatingForcedRevisions = CaseInsensitiveKeysMap_1.CaseInsensitiveKeysMap.create();
        this.includedDocumentsById = CaseInsensitiveKeysMap_1.CaseInsensitiveKeysMap.create();
        this.includeRevisionsByChangeVector = CaseInsensitiveKeysMap_1.CaseInsensitiveKeysMap.create();
        this.includeRevisionsIdByDateTimeBefore = CaseInsensitiveKeysMap_1.CaseInsensitiveKeysMap.create();
        this.documentsByEntity = new DocumentsByEntityHolder();
        this.deletedEntities = new DeletedEntitiesHolder();
        this._numberOfRequests = 0;
        this._deferredCommands = [];
        this.deferredCommandsMap = new Map();
        this._generateDocumentKeysOnStore = true;
        this._id = id;
        this._databaseName = options.database || documentStore.database;
        if (StringUtil_1.StringUtil.isNullOrWhitespace(this._databaseName)) {
            InMemoryDocumentSessionOperations._throwNoDatabase();
        }
        this._documentStore = documentStore;
        this._requestExecutor =
            options.requestExecutor || documentStore.getRequestExecutor(this._databaseName);
        this.noTracking = options.noTracking;
        this.useOptimisticConcurrency = this._requestExecutor.conventions.isUseOptimisticConcurrency();
        this.maxNumberOfRequestsPerSession = this._requestExecutor.conventions.maxNumberOfRequestsPerSession;
        this._generateEntityIdOnTheClient =
            new GenerateEntityIdOnTheClient_1.GenerateEntityIdOnTheClient(this._requestExecutor.conventions, (obj) => this._generateId(obj));
        this._entityToJson = new EntityToJson_1.EntityToJson(this);
        this._sessionInfo = new IDocumentSession_1.SessionInfo(this, options, documentStore);
        this._transactionMode = options.transactionMode;
        this.disableAtomicDocumentWritesInClusterWideTransaction = options.disableAtomicDocumentWritesInClusterWideTransaction;
    }
    get id() {
        return this._id;
    }
    get externalState() {
        if (!this._externalState) {
            this._externalState = new Map();
        }
        return this._externalState;
    }
    getCurrentSessionNode() {
        return this.sessionInfo.getCurrentSessionNode(this._requestExecutor);
    }
    get countersByDocId() {
        if (!this._countersByDocId) {
            this._countersByDocId = CaseInsensitiveKeysMap_1.CaseInsensitiveKeysMap.create();
        }
        return this._countersByDocId;
    }
    get timeSeriesByDocId() {
        if (!this._timeSeriesByDocId) {
            this._timeSeriesByDocId = CaseInsensitiveKeysMap_1.CaseInsensitiveKeysMap.create();
        }
        return this._timeSeriesByDocId;
    }
    get databaseName() {
        return this._databaseName;
    }
    get documentStore() {
        return this._documentStore;
    }
    get requestExecutor() {
        return this._requestExecutor;
    }
    get sessionInfo() {
        return this._sessionInfo;
    }
    get operations() {
        if (!this._operationExecutor) {
            this._operationExecutor = new SessionOperationExecutor_1.SessionOperationExecutor(this);
        }
        return this._operationExecutor;
    }
    get numberOfRequests() {
        return this._numberOfRequests;
    }
    getNumberOfEntitiesInUnitOfWork() {
        return this.documentsByEntity.size;
    }
    get storeIdentifier() {
        return `${this._documentStore.identifier};${this._databaseName}`;
    }
    get conventions() {
        return this._requestExecutor.conventions;
    }
    get deferredCommands() {
        return this._deferredCommands;
    }
    get deferredCommandsCount() {
        return this._deferredCommands.length;
    }
    get generateEntityIdOnTheClient() {
        return this._generateEntityIdOnTheClient;
    }
    get entityToJson() {
        return this._entityToJson;
    }
    getMetadataFor(instance) {
        if (!instance) {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Instance cannot be null or undefined.");
        }
        const documentInfo = this._getDocumentInfo(instance);
        return this._makeMetadataInstance(documentInfo);
    }
    getCountersFor(instance) {
        if (!instance) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Instance cannot be null.");
        }
        const documentInfo = this._getDocumentInfo(instance);
        const countersArray = documentInfo.metadata[Constants_1.CONSTANTS.Documents.Metadata.COUNTERS];
        if (!countersArray) {
            return null;
        }
        return countersArray;
    }
    getTimeSeriesFor(instance) {
        if (!instance) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Instance cannot be null");
        }
        const documentInfo = this._getDocumentInfo(instance);
        return documentInfo.metadata[Constants_1.CONSTANTS.Documents.Metadata.TIME_SERIES] || [];
    }
    _makeMetadataInstance(docInfo) {
        const metadataInstance = docInfo.metadataInstance;
        if (metadataInstance) {
            return metadataInstance;
        }
        const metadataAsJson = docInfo.metadata;
        const metadata = (0, MetadataAsDictionary_1.createMetadataDictionary)({ raw: metadataAsJson });
        docInfo.entity[Constants_1.CONSTANTS.Documents.Metadata.KEY] = docInfo.metadataInstance = metadata;
        return metadata;
    }
    _getDocumentInfo(instance) {
        const documentInfo = this.documentsByEntity.get(instance);
        if (documentInfo) {
            return documentInfo;
        }
        let idRef;
        if (!this._generateEntityIdOnTheClient.tryGetIdFromInstance(instance, (_idRef) => idRef = _idRef)) {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Could not find the document id for " + instance);
        }
        this._assertNoNonUniqueInstance(instance, idRef);
        (0, Exceptions_1.throwError)("InvalidArgumentException", "Document " + idRef + " doesn't exist in the session");
    }
    _assertNoNonUniqueInstance(entity, id) {
        if (!id
            || id[id.length - 1] === "|"
            || id[id.length - 1] === this.conventions.identityPartsSeparator) {
            return;
        }
        const info = this.documentsById.getValue(id);
        if (!info || info.entity === entity) {
            return;
        }
        (0, Exceptions_1.throwError)("NonUniqueObjectException", "Attempted to associate a different object with id '" + id + "'.");
    }
    getChangeVectorFor(instance) {
        if (!instance) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Instance cannot be null or undefined.");
        }
        const documentInfo = this._getDocumentInfo(instance);
        const changeVector = documentInfo.metadata[Constants_1.CONSTANTS.Documents.Metadata.CHANGE_VECTOR];
        if (changeVector) {
            return changeVector.toString();
        }
        return null;
    }
    getLastModifiedFor(instance) {
        if (!instance) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Instance cannot be null or undefined.");
        }
        const documentInfo = this._getDocumentInfo(instance);
        const lastModified = documentInfo.metadata["@last-modified"];
        return DateUtil_1.DateUtil.default.parse(lastModified);
    }
    isLoaded(id) {
        return this.isLoadedOrDeleted(id);
    }
    isLoadedOrDeleted(id) {
        const documentInfo = this.documentsById.getValue(id);
        return !!(documentInfo && (documentInfo.document || documentInfo.entity))
            || this.isDeleted(id)
            || this.includedDocumentsById.has(id);
    }
    isDeleted(id) {
        return this._knownMissingIds.has(id);
    }
    getDocumentId(instance) {
        if (!instance) {
            return null;
        }
        const value = this.documentsByEntity.get(instance);
        return value ? value.id : null;
    }
    incrementRequestCount() {
        if (++this._numberOfRequests > this.maxNumberOfRequestsPerSession) {
            (0, Exceptions_1.throwError)("InvalidOperationException", `The maximum number of requests (${this.maxNumberOfRequestsPerSession}) allowed for this session has been reached.` +
                "Raven limits the number of remote calls that a session is allowed to make as an early warning system. Sessions are expected to be short lived, and " +
                "Raven provides facilities like load(string[] keys) to load multiple documents at once and batch saves (call SaveChanges() only once)." +
                "You can increase the limit by setting DocumentConvention.MaxNumberOfRequestsPerSession or MaxNumberOfRequestsPerSession, but it is" +
                "advisable that you'll look into reducing the number of remote calls first, since that will speed up your application significantly and result in a" +
                "more responsive application.");
        }
    }
    checkIfAllChangeVectorsAreAlreadyIncluded(changeVectors) {
        if (!this.includeRevisionsByChangeVector) {
            return false;
        }
        for (const cv of changeVectors) {
            if (!this.includeRevisionsByChangeVector.has(cv)) {
                return false;
            }
        }
        return true;
    }
    checkIfRevisionByDateTimeBeforeAlreadyIncluded(id, dateTime) {
        if (!this.includeRevisionsIdByDateTimeBefore) {
            return false;
        }
        const dictionaryDateTimeToDocument = this.includeRevisionsIdByDateTimeBefore.get(id);
        return dictionaryDateTimeToDocument && dictionaryDateTimeToDocument.has(dateTime.getTime());
    }
    checkIfIdAlreadyIncluded(ids, includes) {
        for (const id of ids) {
            if (this._knownMissingIds.has(id)) {
                continue;
            }
            let documentInfo = this.documentsById.getValue(id);
            if (!documentInfo) {
                documentInfo = this.includedDocumentsById.get(id);
                if (!documentInfo) {
                    return false;
                }
            }
            if (!documentInfo.entity && !documentInfo.document) {
                return false;
            }
            if (!includes) {
                continue;
            }
            for (const include of includes) {
                let hasAll = true;
                IncludesUtil_1.IncludesUtil.include(documentInfo.document, include, (includeId) => {
                    hasAll = hasAll && this.isLoaded(includeId);
                });
                if (!hasAll) {
                    return false;
                }
            }
        }
        return true;
    }
    trackEntity(entityType, idOrDocumentInfo, document, metadata, noTracking) {
        let id;
        if (TypeUtil_1.TypeUtil.isObject(idOrDocumentInfo)) {
            const info = idOrDocumentInfo;
            return this.trackEntity(entityType, info.id, info.document, info.metadata, this.noTracking);
        }
        else {
            id = idOrDocumentInfo;
        }
        noTracking = this.noTracking || noTracking;
        if (!id) {
            return this._deserializeFromTransformer(entityType, null, document, false);
        }
        let docInfo = this.documentsById.getValue(id);
        if (docInfo) {
            if (!docInfo.entity) {
                docInfo.entity = this.entityToJson.convertToEntity(entityType, id, document, !noTracking);
                this._makeMetadataInstance(docInfo);
            }
            if (!noTracking) {
                this.includedDocumentsById.delete(id);
                this.documentsByEntity.put(docInfo.entity, docInfo);
            }
            return docInfo.entity;
        }
        docInfo = this.includedDocumentsById.get(id);
        if (docInfo) {
            if (!docInfo.entity) {
                docInfo.entity = this.entityToJson.convertToEntity(entityType, id, document, !noTracking);
                this._makeMetadataInstance(docInfo);
            }
            if (!noTracking) {
                this.includedDocumentsById.delete(id);
                this.documentsById.add(docInfo);
                this.documentsByEntity.put(docInfo.entity, docInfo);
            }
            return docInfo.entity;
        }
        const entity = this.entityToJson.convertToEntity(entityType, id, document, !noTracking);
        const changeVector = metadata[Constants_1.CONSTANTS.Documents.Metadata.CHANGE_VECTOR];
        if (!changeVector) {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Document " + id + " must have Change Vector.");
        }
        if (!noTracking) {
            const newDocumentInfo = new DocumentInfo_1.DocumentInfo();
            newDocumentInfo.id = id;
            newDocumentInfo.document = document;
            newDocumentInfo.metadata = metadata;
            newDocumentInfo.entity = entity;
            newDocumentInfo.changeVector = changeVector;
            this.documentsById.add(newDocumentInfo);
            this.documentsByEntity.put(entity, newDocumentInfo);
            this._makeMetadataInstance(newDocumentInfo);
        }
        return entity;
    }
    registerExternalLoadedIntoTheSession(info) {
        if (this.noTracking) {
            return;
        }
        const existing = this.documentsById.getValue(info.id);
        if (existing) {
            if (existing.entity === info.entity) {
                return;
            }
            (0, Exceptions_1.throwError)("InvalidOperationException", "The document " + info.id + " is already in the session with a different entity instance.");
        }
        const existingEntity = this.documentsByEntity.get(info.entity);
        if (existingEntity) {
            if (StringUtil_1.StringUtil.equalsIgnoreCase(existingEntity.id, info.id)) {
                return;
            }
            (0, Exceptions_1.throwError)("InvalidOperationException", "Attempted to load an entity with id "
                + info.id
                + ", but the entity instance already exists in the session with id: " + existing.id);
        }
        this.documentsByEntity.put(info.entity, info);
        this.documentsById.add(info);
        this.includedDocumentsById.delete(info.id);
    }
    _deserializeFromTransformer(clazz, id, document, trackEntity) {
        return this.entityToJson.convertToEntity(clazz, id, document, trackEntity);
    }
    registerIncludes(includes) {
        if (this.noTracking) {
            return;
        }
        if (!includes) {
            return;
        }
        for (const fieldName of Object.keys(includes)) {
            const fieldValue = includes[fieldName];
            if (TypeUtil_1.TypeUtil.isNullOrUndefined(fieldValue)) {
                continue;
            }
            const newDocumentInfo = DocumentInfo_1.DocumentInfo.getNewDocumentInfo(fieldValue);
            if ((0, Json_1.tryGetConflict)(newDocumentInfo.metadata)) {
                continue;
            }
            this.includedDocumentsById.set(newDocumentInfo.id, newDocumentInfo);
        }
    }
    registerRevisionIncludes(revisionIncludes) {
        if (this.noTracking) {
            return;
        }
        if (!revisionIncludes) {
            return;
        }
        if (!this.includeRevisionsByChangeVector) {
            this.includeRevisionsByChangeVector = CaseInsensitiveKeysMap_1.CaseInsensitiveKeysMap.create();
        }
        if (!this.includeRevisionsIdByDateTimeBefore) {
            this.includeRevisionsIdByDateTimeBefore = CaseInsensitiveKeysMap_1.CaseInsensitiveKeysMap.create();
        }
        for (const obj of revisionIncludes) {
            if (!obj) {
                continue;
            }
            const json = obj;
            const id = json.Id;
            const changeVector = json.ChangeVector;
            const beforeAsText = json.Before;
            const dateTime = beforeAsText ? DateUtil_1.DateUtil.utc.parse(beforeAsText) : null;
            const revision = json.Revision;
            this.includeRevisionsByChangeVector.set(changeVector, DocumentInfo_1.DocumentInfo.getNewDocumentInfo(revision));
            if (dateTime && !StringUtil_1.StringUtil.isNullOrWhitespace(id)) {
                const map = new Map();
                this.includeRevisionsIdByDateTimeBefore.set(id, map);
                const documentInfo = new DocumentInfo_1.DocumentInfo();
                documentInfo.document = revision;
                map.set(dateTime.getTime(), documentInfo);
            }
        }
    }
    registerMissingIncludes(results, includes, includePaths) {
        if (this.noTracking) {
            return;
        }
        if (!includePaths || !includePaths.length) {
            return;
        }
        for (const result of results) {
            for (const include of includePaths) {
                if (include === Constants_1.CONSTANTS.Documents.Indexing.Fields.DOCUMENT_ID_FIELD_NAME) {
                    continue;
                }
                IncludesUtil_1.IncludesUtil.include(result, include, id => {
                    if (!id) {
                        return;
                    }
                    if (this.isLoaded(id)) {
                        return;
                    }
                    const document = includes[id];
                    if (document) {
                        const metadata = document.get(Constants_1.CONSTANTS.Documents.Metadata.KEY);
                        if ((0, Json_1.tryGetConflict)(metadata)) {
                            return;
                        }
                    }
                    this.registerMissing(id);
                });
            }
        }
    }
    registerMissing(idOrIds) {
        if (this.noTracking) {
            return;
        }
        if (TypeUtil_1.TypeUtil.isArray(idOrIds)) {
            for (const id of idOrIds) {
                this._knownMissingIds.add(id);
            }
        }
        else {
            this._knownMissingIds.add(idOrIds);
        }
    }
    unregisterMissing(id) {
        this._knownMissingIds.delete(id);
    }
    registerCounters(resultCounters, idsOrCountersToInclude, countersToInclude, gotAll) {
        if (Array.isArray(idsOrCountersToInclude)) {
            this._registerCountersWithIdsList(resultCounters, idsOrCountersToInclude, countersToInclude, gotAll);
        }
        else {
            this._registerCountersWithCountersToIncludeObj(resultCounters, idsOrCountersToInclude);
        }
    }
    _registerCountersWithIdsList(resultCounters, ids, countersToInclude, gotAll) {
        if (this.noTracking) {
            return;
        }
        if (!resultCounters || Object.keys(resultCounters).length === 0) {
            if (gotAll) {
                for (const id of ids) {
                    this._setGotAllCountersForDocument(id);
                }
                return;
            }
        }
        else {
            this._registerCountersInternal(resultCounters, null, false, gotAll);
        }
        this._registerMissingCounters(ids, countersToInclude);
    }
    _registerCountersWithCountersToIncludeObj(resultCounters, countersToInclude) {
        if (this.noTracking) {
            return;
        }
        if (!resultCounters || Object.keys(resultCounters).length === 0) {
            this._setGotAllInCacheIfNeeded(countersToInclude);
        }
        else {
            this._registerCountersInternal(resultCounters, countersToInclude, true, false);
        }
        this._registerMissingCounters(countersToInclude);
    }
    _registerCountersInternal(resultCounters, countersToInclude, fromQueryResult, gotAll) {
        for (const [field, value] of Object.entries(resultCounters)) {
            if (!value) {
                continue;
            }
            let counters = [];
            if (fromQueryResult) {
                counters = countersToInclude[field];
                gotAll = counters && counters.length === 0;
            }
            if (value.length === 0 && !gotAll) {
                const cache = this._countersByDocId.get(field);
                if (!cache) {
                    continue;
                }
                for (const counter of counters) {
                    cache.data.delete(counter);
                }
                this._countersByDocId.set(field, cache);
                continue;
            }
            this._registerCountersForDocument(field, gotAll, value, countersToInclude);
        }
    }
    _registerCountersForDocument(id, gotAll, counters, countersToInclude) {
        let cache = this.countersByDocId.get(id);
        if (!cache) {
            cache = { gotAll, data: CaseInsensitiveKeysMap_1.CaseInsensitiveKeysMap.create() };
        }
        const deletedCounters = cache.data.size === 0
            ? new Set()
            : (countersToInclude[id].length === 0 ? new Set(cache.data.keys()) : new Set(countersToInclude[id]));
        for (const counterJson of counters) {
            if (!counterJson) {
                continue;
            }
            const counterName = counterJson["counterName"];
            const totalValue = counterJson["totalValue"];
            if (counterName && totalValue) {
                cache.data.set(counterName, totalValue);
                deletedCounters.delete(counterName);
            }
        }
        if (deletedCounters.size > 0) {
            for (const name of deletedCounters) {
                cache.data.delete(name);
            }
        }
        cache.gotAll = gotAll;
        this._countersByDocId.set(id, cache);
    }
    _setGotAllInCacheIfNeeded(countersToInclude) {
        for (const [key, value] of Object.entries(countersToInclude)) {
            if (value.length > 0) {
                continue;
            }
            this._setGotAllCountersForDocument(key);
        }
    }
    _setGotAllCountersForDocument(id) {
        let cache = this.countersByDocId.get(id);
        if (!cache) {
            cache = { gotAll: false, data: CaseInsensitiveKeysMap_1.CaseInsensitiveKeysMap.create() };
        }
        cache.gotAll = true;
        this._countersByDocId.set(id, cache);
    }
    _registerMissingCounters(idsOrCountersToInclude, countersToInclude) {
        if (Array.isArray(idsOrCountersToInclude)) {
            this._registerMissingCountersWithIdsList(idsOrCountersToInclude, countersToInclude);
        }
        else {
            this._registerMissingCountersWithCountersToIncludeObj(idsOrCountersToInclude);
        }
    }
    registerTimeSeries(resultTimeSeries) {
        if (this.noTracking || !resultTimeSeries) {
            return;
        }
        for (const [id, perDocTs] of Object.entries(resultTimeSeries)) {
            if (!perDocTs) {
                continue;
            }
            let cache = this.timeSeriesByDocId.get(id);
            if (!cache) {
                cache = CaseInsensitiveKeysMap_1.CaseInsensitiveKeysMap.create();
                this.timeSeriesByDocId.set(id, cache);
            }
            if (!TypeUtil_1.TypeUtil.isObject(perDocTs)) {
                (0, Exceptions_1.throwError)("InvalidOperationException", "Unable to read time series range results on document: '" + id + "'.");
            }
            for (const [name, perNameTs] of Object.entries(perDocTs)) {
                if (!perNameTs) {
                    continue;
                }
                if (!TypeUtil_1.TypeUtil.isArray(perNameTs)) {
                    (0, Exceptions_1.throwError)("InvalidOperationException", "Unable to read time series range results on document: '" + id + "', time series: '" + name + "'.");
                }
                for (const range of perNameTs) {
                    const newRange = InMemoryDocumentSessionOperations._parseTimeSeriesRangeResult(range, id, name, this.conventions);
                    InMemoryDocumentSessionOperations._addToCache(cache, newRange, name);
                }
            }
        }
    }
    static _addToCache(cache, newRange, name) {
        const localRanges = cache.get(name);
        if (!localRanges || !localRanges.length) {
            cache.set(name, [newRange]);
            return;
        }
        if (DatesComparator_1.DatesComparator.compare((0, DatesComparator_1.leftDate)(localRanges[0].from), (0, DatesComparator_1.rightDate)(newRange.to)) > 0
            || DatesComparator_1.DatesComparator.compare((0, DatesComparator_1.rightDate)(localRanges[localRanges.length - 1].to), (0, DatesComparator_1.leftDate)(newRange.from)) < 0) {
            const index = DatesComparator_1.DatesComparator.compare((0, DatesComparator_1.leftDate)(localRanges[0].from), (0, DatesComparator_1.rightDate)(newRange.to)) > 0 ? 0 : localRanges.length;
            localRanges.splice(index, 0, newRange);
            return;
        }
        let toRangeIndex;
        let fromRangeIndex = -1;
        let rangeAlreadyInCache = false;
        for (toRangeIndex = 0; toRangeIndex < localRanges.length; toRangeIndex++) {
            if (DatesComparator_1.DatesComparator.compare((0, DatesComparator_1.leftDate)(localRanges[toRangeIndex].from), (0, DatesComparator_1.leftDate)(newRange.from)) <= 0) {
                if (DatesComparator_1.DatesComparator.compare((0, DatesComparator_1.rightDate)(localRanges[toRangeIndex].to), (0, DatesComparator_1.rightDate)(newRange.to)) >= 0) {
                    rangeAlreadyInCache = true;
                    break;
                }
                fromRangeIndex = toRangeIndex;
                continue;
            }
            if (DatesComparator_1.DatesComparator.compare((0, DatesComparator_1.rightDate)(localRanges[toRangeIndex].to), (0, DatesComparator_1.rightDate)(newRange.to)) >= 0) {
                break;
            }
        }
        if (rangeAlreadyInCache) {
            InMemoryDocumentSessionOperations._updateExistingRange(localRanges[toRangeIndex], newRange);
            return;
        }
        const mergedValues = InMemoryDocumentSessionOperations._mergeRanges(fromRangeIndex, toRangeIndex, localRanges, newRange);
        InMemoryDocumentSessionOperations.addToCache(name, newRange.from, newRange.to, fromRangeIndex, toRangeIndex, localRanges, cache, mergedValues);
    }
    static addToCache(timeseries, from, to, fromRangeIndex, toRangeIndex, ranges, cache, values) {
        if (fromRangeIndex === -1) {
            if (toRangeIndex === ranges.length) {
                const timeSeriesRangeResult = new TimeSeriesRangeResult_1.TimeSeriesRangeResult();
                timeSeriesRangeResult.from = from;
                timeSeriesRangeResult.to = to;
                timeSeriesRangeResult.entries = values;
                const result = [];
                result.push(timeSeriesRangeResult);
                cache.set(timeseries, result);
                return;
            }
            if (DatesComparator_1.DatesComparator.compare((0, DatesComparator_1.leftDate)(ranges[toRangeIndex].from), (0, DatesComparator_1.rightDate)(to)) > 0) {
                ranges.splice(0, toRangeIndex);
                const timeSeriesRangeResult = new TimeSeriesRangeResult_1.TimeSeriesRangeResult();
                timeSeriesRangeResult.from = from;
                timeSeriesRangeResult.to = to;
                timeSeriesRangeResult.entries = values;
                ranges.splice(0, 0, timeSeriesRangeResult);
                return;
            }
            ranges[toRangeIndex].from = from;
            ranges[toRangeIndex].entries = values;
            ranges.splice(0, toRangeIndex);
            return;
        }
        if (toRangeIndex === ranges.length) {
            if (DatesComparator_1.DatesComparator.compare((0, DatesComparator_1.rightDate)(ranges[fromRangeIndex].to), (0, DatesComparator_1.leftDate)(from)) < 0) {
                ranges.splice(fromRangeIndex + 1, ranges.length - fromRangeIndex - 1);
                const timeSeriesRangeResult = new TimeSeriesRangeResult_1.TimeSeriesRangeResult();
                timeSeriesRangeResult.from = from;
                timeSeriesRangeResult.to = to;
                timeSeriesRangeResult.entries = values;
                ranges.push(timeSeriesRangeResult);
                return;
            }
            ranges[fromRangeIndex].to = to;
            ranges[fromRangeIndex].entries = values;
            ranges.splice(fromRangeIndex + 1, ranges.length - fromRangeIndex - 1);
            return;
        }
        if (DatesComparator_1.DatesComparator.compare((0, DatesComparator_1.rightDate)(ranges[fromRangeIndex].to), (0, DatesComparator_1.leftDate)(from)) < 0) {
            if (DatesComparator_1.DatesComparator.compare((0, DatesComparator_1.leftDate)(ranges[toRangeIndex].from), (0, DatesComparator_1.rightDate)(to)) > 0) {
                ranges.splice(fromRangeIndex + 1, toRangeIndex - fromRangeIndex - 1);
                const timeSeriesRangeResult = new TimeSeriesRangeResult_1.TimeSeriesRangeResult();
                timeSeriesRangeResult.from = from;
                timeSeriesRangeResult.to = to;
                timeSeriesRangeResult.entries = values;
                ranges.splice(fromRangeIndex + 1, 0, timeSeriesRangeResult);
                return;
            }
            ranges.splice(fromRangeIndex + 1, toRangeIndex - fromRangeIndex - 1);
            ranges[toRangeIndex].from = from;
            ranges[toRangeIndex].entries = values;
            return;
        }
        if (DatesComparator_1.DatesComparator.compare((0, DatesComparator_1.leftDate)(ranges[toRangeIndex].from), (0, DatesComparator_1.rightDate)(to)) > 0) {
            ranges[fromRangeIndex].to = to;
            ranges[fromRangeIndex].entries = values;
            ranges.splice(fromRangeIndex + 1, toRangeIndex - fromRangeIndex - 1);
            return;
        }
        ranges[fromRangeIndex].to = ranges[toRangeIndex].to;
        ranges[fromRangeIndex].entries = values;
        ranges.splice(fromRangeIndex + 1, toRangeIndex - fromRangeIndex);
    }
    static _parseTimeSeriesRangeResult(json, id, databaseName, conventions) {
        return (0, GetTimeSeriesOperation_1.reviveTimeSeriesRangeResult)(json, conventions);
    }
    static _mergeRanges(fromRangeIndex, toRangeIndex, localRanges, newRange) {
        const mergedValues = [];
        if (fromRangeIndex !== -1 && localRanges[fromRangeIndex].to.getTime() >= newRange.from.getTime()) {
            for (const val of localRanges[fromRangeIndex].entries) {
                if (val.timestamp.getTime() >= newRange.from.getTime()) {
                    break;
                }
                mergedValues.push(val);
            }
        }
        mergedValues.push(...newRange.entries);
        if (toRangeIndex < localRanges.length
            && DatesComparator_1.DatesComparator.compare((0, DatesComparator_1.leftDate)(localRanges[toRangeIndex].from), (0, DatesComparator_1.rightDate)(newRange.to)) <= 0) {
            for (const val of localRanges[toRangeIndex].entries) {
                if (val.timestamp.getTime() <= newRange.to.getTime()) {
                    continue;
                }
                mergedValues.push(val);
            }
        }
        return mergedValues;
    }
    static _updateExistingRange(localRange, newRange) {
        const newValues = [];
        let index;
        for (index = 0; index < localRange.entries.length; index++) {
            if (localRange.entries[index].timestamp.getTime() >= newRange.from.getTime()) {
                break;
            }
            newValues.push(localRange.entries[index]);
        }
        newValues.push(...newRange.entries);
        localRange.entries.forEach(item => {
            if (item.timestamp.getTime() <= newRange.to.getTime()) {
                return;
            }
            newValues.push(item);
        });
        localRange.entries = newValues;
    }
    _registerMissingCountersWithCountersToIncludeObj(countersToInclude) {
        if (!countersToInclude) {
            return;
        }
        for (const [key, value] of Object.entries(countersToInclude)) {
            let cache = this.countersByDocId.get(key);
            if (!cache) {
                cache = { gotAll: false, data: CaseInsensitiveKeysMap_1.CaseInsensitiveKeysMap.create() };
                this.countersByDocId.set(key, cache);
            }
            for (const counter of value) {
                if (cache.data.has(counter)) {
                    continue;
                }
                cache.data.set(counter, null);
            }
        }
    }
    _registerMissingCountersWithIdsList(ids, countersToInclude) {
        if (!countersToInclude) {
            return;
        }
        for (const counter of countersToInclude) {
            for (const id of ids) {
                let cache = this.countersByDocId.get(id);
                if (!cache) {
                    cache = { gotAll: false, data: CaseInsensitiveKeysMap_1.CaseInsensitiveKeysMap.create() };
                    this.countersByDocId.set(id, cache);
                }
                if (cache.data.has(counter)) {
                    continue;
                }
                cache.data.set(counter, null);
            }
        }
    }
    store(entity, id, docTypeOrOptions) {
        let documentType = null;
        let options = {};
        if (TypeUtil_1.TypeUtil.isDocumentType(docTypeOrOptions)) {
            documentType = docTypeOrOptions;
        }
        else if (TypeUtil_1.TypeUtil.isObject(docTypeOrOptions)) {
            options = docTypeOrOptions;
        }
        const changeVector = options.changeVector;
        documentType = documentType || options.documentType;
        this.conventions.tryRegisterJsType(documentType);
        if (entity.constructor !== Object) {
            this.conventions.tryRegisterJsType(entity.constructor);
        }
        let forceConcurrencyCheck;
        if (!TypeUtil_1.TypeUtil.isUndefined(changeVector)) {
            forceConcurrencyCheck = changeVector === null ? "Disabled" : "Forced";
        }
        else if (!TypeUtil_1.TypeUtil.isNullOrUndefined(id)) {
            forceConcurrencyCheck = "Auto";
        }
        else {
            const hasId = this._generateEntityIdOnTheClient.tryGetIdFromInstance(entity);
            forceConcurrencyCheck = !hasId ? "Forced" : "Auto";
        }
        return this._storeInternal(entity, changeVector, id, forceConcurrencyCheck, documentType);
    }
    _storeInternal(entity, changeVector, id, forceConcurrencyCheck, documentType) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.noTracking) {
                (0, Exceptions_1.throwError)("InvalidOperationException", "Cannot store entity. Entity tracking is disabled in this session.");
            }
            if (!entity) {
                (0, Exceptions_1.throwError)("InvalidArgumentException", "Entity cannot be null or undefined.");
            }
            const value = this.documentsByEntity.get(entity);
            if (value) {
                value.changeVector = changeVector || value.changeVector;
                value.concurrencyCheckMode = forceConcurrencyCheck;
                return;
            }
            if (!id) {
                if (this._generateDocumentKeysOnStore) {
                    id = yield this._generateEntityIdOnTheClient.generateDocumentKeyForStorage(entity);
                }
                else {
                    this._rememberEntityForDocumentIdGeneration(entity);
                }
            }
            else {
                this.generateEntityIdOnTheClient.trySetIdentity(entity, id);
            }
            const cmdKey = IdTypeAndName_1.IdTypeAndName.keyFor(id, "ClientAnyCommand", null);
            if (this.deferredCommandsMap.has(cmdKey)) {
                (0, Exceptions_1.throwError)("InvalidOperationException", "Can't store document, there is a deferred command registered "
                    + "for this document in the session. Document id: " + id);
            }
            if (this.deletedEntities.contains(entity)) {
                (0, Exceptions_1.throwError)("InvalidOperationException", "Can't store object, it was already deleted in this session. Document id: " + id);
            }
            this._assertNoNonUniqueInstance(entity, id);
            const conventions = this._requestExecutor.conventions;
            const typeDesc = conventions.getJsTypeByDocumentType(documentType);
            const collectionName = documentType
                ? conventions.getCollectionNameForType(typeDesc)
                : conventions.getCollectionNameForEntity(entity);
            const metadata = {};
            if (collectionName) {
                metadata[Constants_1.CONSTANTS.Documents.Metadata.COLLECTION] = collectionName;
            }
            const entityType = documentType
                ? conventions.getJsTypeByDocumentType(documentType)
                : conventions.getTypeDescriptorByEntity(entity);
            const jsType = conventions.getJsTypeName(entityType);
            if (jsType) {
                metadata[Constants_1.CONSTANTS.Documents.Metadata.RAVEN_JS_TYPE] = jsType;
            }
            if (id) {
                this._knownMissingIds.delete(id);
            }
            this._storeEntityInUnitOfWork(id, entity, changeVector, metadata, forceConcurrencyCheck, documentType);
        });
    }
    _storeEntityInUnitOfWork(id, entity, changeVector, metadata, forceConcurrencyCheck, documentType) {
        if (id) {
            this._knownMissingIds.delete(id);
        }
        const documentInfo = new DocumentInfo_1.DocumentInfo();
        documentInfo.id = id;
        documentInfo.metadata = metadata;
        documentInfo.changeVector = changeVector;
        documentInfo.concurrencyCheckMode = forceConcurrencyCheck;
        documentInfo.entity = entity;
        documentInfo.newDocument = true;
        documentInfo.document = null;
        this.documentsByEntity.put(entity, documentInfo);
        if (id) {
            this.documentsById.add(documentInfo);
        }
    }
    _rememberEntityForDocumentIdGeneration(entity) {
        (0, Exceptions_1.throwError)("NotImplementedException", "You cannot set GenerateDocumentIdsOnStore to false"
            + " without implementing RememberEntityForDocumentIdGeneration");
    }
    prepareForSaveChanges() {
        const result = this._newSaveChangesData();
        const deferredCommandsCount = this._deferredCommands.length;
        this._prepareForEntitiesDeletion(result, null);
        this._prepareForEntitiesPuts(result);
        this._prepareForCreatingRevisionsFromIds(result);
        this._prepareCompareExchangeEntities(result);
        if (this._deferredCommands.length > deferredCommandsCount) {
            for (let i = deferredCommandsCount; i < this._deferredCommands.length; i++) {
                result.deferredCommands.push(this._deferredCommands[i]);
            }
            for (const item of this.deferredCommandsMap.entries()) {
                result.deferredCommandsMap.set(item[0], item[1]);
            }
        }
        for (const deferredCommand of result.deferredCommands) {
            if (deferredCommand.onBeforeSaveChanges) {
                deferredCommand.onBeforeSaveChanges(this);
            }
        }
        return result;
    }
    validateClusterTransaction(result) {
        if (this._transactionMode !== "ClusterWide") {
            return;
        }
        if (this.useOptimisticConcurrency) {
            (0, Exceptions_1.throwError)("InvalidOperationException", "useOptimisticConcurrency is not supported with TransactionMode set to "
                + "ClusterWide");
        }
        for (const commandData of result.sessionCommands) {
            switch (commandData.type) {
                case "PUT":
                case "DELETE":
                    if (commandData.changeVector) {
                        (0, Exceptions_1.throwError)("InvalidOperationException", "Optimistic concurrency for "
                            + commandData.id + " is not supported when using a cluster transaction.");
                    }
                    break;
                case "CompareExchangeDELETE":
                case "CompareExchangePUT":
                    break;
                default:
                    (0, Exceptions_1.throwError)("InvalidOperationException", "The command '" + commandData.type + "' is not supported in a cluster session.");
            }
        }
    }
    _updateSessionAfterSaveChanges(result) {
        const returnedTransactionIndex = result.transactionIndex;
        this._documentStore.setLastTransactionIndex(this.databaseName, returnedTransactionIndex);
        this.sessionInfo.lastClusterTransactionIndex = returnedTransactionIndex;
    }
    onBeforeConversionToDocumentInvoke(id, entity) {
        const args = new SessionEvents_1.BeforeConversionToDocumentEventArgs(this, id, entity);
        this.emit("beforeConversionToDocument", args);
    }
    onAfterConversionToDocumentInvoke(id, entity, document) {
        if (this.listenerCount("afterConversionToDocument")) {
            const eventArgs = new SessionEvents_1.AfterConversionToDocumentEventArgs(this, id, entity, document);
            this.emit("afterConversionToDocument", eventArgs);
            if (eventArgs.document.value && eventArgs.document.value !== document.value) {
                document.value = eventArgs.document.value;
            }
        }
    }
    onBeforeConversionToEntityInvoke(id, type, document) {
        if (this.listenerCount("beforeConversionToEntity")) {
            const eventArgs = new SessionEvents_1.BeforeConversionToEntityEventArgs(this, id, type, document.value);
            this.emit("beforeConversionToEntity", eventArgs);
            if (eventArgs.document && eventArgs.document !== document) {
                document.value = eventArgs.document;
            }
        }
    }
    onAfterConversionToEntityInvoke(id, document, entity) {
        const eventArgs = new SessionEvents_1.AfterConversionToEntityEventArgs(this, id, document, entity);
        this.emit("afterConversionToEntity", eventArgs);
    }
    _prepareCompareExchangeEntities(result) {
        if (!this._hasClusterSession()) {
            return;
        }
        const clusterTransactionOperations = this.clusterSession;
        if (!clusterTransactionOperations.numberOfTrackedCompareExchangeValues) {
            return;
        }
        if (this._transactionMode !== "ClusterWide") {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Performing cluster transaction operation require the TransactionMode to be set to ClusterWide");
        }
        this.clusterSession.prepareCompareExchangeEntities(result);
    }
    _newSaveChangesData() {
        return new CommandData_1.SaveChangesData({
            deferredCommands: [...this._deferredCommands],
            deferredCommandsMap: new Map(this.deferredCommandsMap),
            options: this._saveChangesOptions,
            session: this
        });
    }
    _prepareForCreatingRevisionsFromIds(result) {
        for (const idEntry of this.idsForCreatingForcedRevisions.keys()) {
            result.sessionCommands.push(new ForceRevisionCommandData_1.ForceRevisionCommandData(idEntry));
        }
        this.idsForCreatingForcedRevisions.clear();
    }
    _prepareForEntitiesDeletion(result, changes) {
        const deletes = this.deletedEntities.prepareEntitiesDeletes();
        try {
            for (const deletedEntity of this.deletedEntities) {
                let documentInfo = this.documentsByEntity.get(deletedEntity.entity);
                if (!documentInfo) {
                    continue;
                }
                if (changes) {
                    const docChanges = [];
                    const change = new DocumentsChanges_1.DocumentsChanges();
                    change.fieldNewValue = "";
                    change.fieldOldValue = "";
                    change.change = "DocumentDeleted";
                    docChanges.push(change);
                    changes[documentInfo.id] = docChanges;
                }
                else {
                    const command = result.deferredCommandsMap.get(IdTypeAndName_1.IdTypeAndName.keyFor(documentInfo.id, "ClientAnyCommand", null));
                    if (command) {
                        InMemoryDocumentSessionOperations._throwInvalidDeletedDocumentWithDeferredCommand(command);
                    }
                    let changeVector = null;
                    documentInfo = this.documentsById.getValue(documentInfo.id);
                    if (documentInfo) {
                        changeVector = documentInfo.changeVector;
                        if (documentInfo.entity) {
                            result.onSuccess.removeDocumentByEntity(documentInfo.entity);
                            result.entities.push(documentInfo.entity);
                        }
                        result.onSuccess.removeDocumentById(documentInfo.id);
                    }
                    if (!this.useOptimisticConcurrency) {
                        changeVector = null;
                    }
                    const beforeDeleteEventArgs = new SessionEvents_1.SessionBeforeDeleteEventArgs(this, documentInfo.id, documentInfo.entity);
                    this.emit("beforeDelete", beforeDeleteEventArgs);
                    result.sessionCommands.push(new CommandData_1.DeleteCommandData(documentInfo.id, changeVector, documentInfo.changeVector));
                }
                if (!changes) {
                    result.onSuccess.clearDeletedEntities();
                }
            }
        }
        finally {
            deletes.dispose();
        }
    }
    _prepareForEntitiesPuts(result) {
        const putsContext = this.documentsByEntity.prepareEntitiesPuts();
        try {
            const shouldIgnoreEntityChanges = this.conventions.shouldIgnoreEntityChanges;
            for (const entry of this.documentsByEntity) {
                const { key: entityKey, value: entityValue } = entry;
                if (entityValue.ignoreChanges) {
                    continue;
                }
                if (shouldIgnoreEntityChanges) {
                    if (shouldIgnoreEntityChanges(this, entry.value.entity, entry.value.id)) {
                        continue;
                    }
                }
                if (this.isDeleted(entityValue.id)) {
                    continue;
                }
                const dirtyMetadata = InMemoryDocumentSessionOperations._updateMetadataModifications(entityValue);
                let document = this.entityToJson.convertEntityToJson(entityKey, entityValue);
                if (!this._entityChanged(document, entityValue, null) && !dirtyMetadata) {
                    continue;
                }
                const command = result.deferredCommandsMap.get(IdTypeAndName_1.IdTypeAndName.keyFor(entityValue.id, "ClientModifyDocumentCommand", null));
                if (command) {
                    InMemoryDocumentSessionOperations._throwInvalidModifiedDocumentWithDeferredCommand(command);
                }
                const beforeStoreEventArgs = new SessionEvents_1.SessionBeforeStoreEventArgs(this, entityValue.id, entityKey);
                if (this.emit("beforeStore", beforeStoreEventArgs)) {
                    if (beforeStoreEventArgs.isMetadataAccessed()) {
                        InMemoryDocumentSessionOperations._updateMetadataModifications(entityValue);
                    }
                    if (beforeStoreEventArgs.isMetadataAccessed() || this._entityChanged(document, entityValue, null)) {
                        document = this.entityToJson.convertEntityToJson(entityKey, entityValue);
                    }
                }
                result.entities.push(entityKey);
                if (entityValue.id) {
                    result.onSuccess.removeDocumentById(entityValue.id);
                }
                result.onSuccess.updateEntityDocumentInfo(entityValue, document);
                let changeVector;
                if (this.useOptimisticConcurrency) {
                    if (entityValue.concurrencyCheckMode !== "Disabled") {
                        changeVector = entityValue.changeVector || "";
                    }
                    else {
                        changeVector = null;
                    }
                }
                else if (entityValue.concurrencyCheckMode === "Forced") {
                    changeVector = entityValue.changeVector;
                }
                else {
                    changeVector = null;
                }
                let forceRevisionCreationStrategy = "None";
                if (entityValue.id) {
                    const creationStrategy = this.idsForCreatingForcedRevisions.get(entityValue.id);
                    if (creationStrategy) {
                        this.idsForCreatingForcedRevisions.delete(entityValue.id);
                        forceRevisionCreationStrategy = creationStrategy;
                    }
                }
                result.sessionCommands.push(new CommandData_1.PutCommandDataWithJson(entityValue.id, changeVector, entityValue.changeVector, document, forceRevisionCreationStrategy));
            }
        }
        finally {
            putsContext.dispose();
        }
    }
    _entityChanged(newObj, documentInfo, changes) {
        return JsonOperation_1.JsonOperation.entityChanged(newObj, documentInfo, changes);
    }
    static _throwInvalidModifiedDocumentWithDeferredCommand(resultCommand) {
        (0, Exceptions_1.throwError)("InvalidOperationException", "Cannot perform save because document " + resultCommand.id
            + " has been modified by the session and is also taking part in deferred "
            + resultCommand.type + " command");
    }
    static _throwInvalidDeletedDocumentWithDeferredCommand(resultCommand) {
        (0, Exceptions_1.throwError)("InvalidOperationException", "Cannot perform save because document " + resultCommand.id
            + " has been deleted by the session and is also taking part in deferred "
            + resultCommand.type + " command");
    }
    static _updateMetadataModifications(documentInfo) {
        let dirty = false;
        if (documentInfo.metadataInstance) {
            if (documentInfo.metadataInstance.isDirty()) {
                dirty = true;
            }
            for (const prop of Object.keys(documentInfo.metadataInstance)) {
                const propValue = documentInfo.metadataInstance[prop];
                if (propValue && (typeof propValue["isDirty"] === "function"
                    && propValue.isDirty())) {
                    dirty = true;
                }
                documentInfo.metadata[prop] = ObjectUtil_1.ObjectUtil.deepJsonClone(propValue);
            }
        }
        return dirty;
    }
    delete(idOrEntity, expectedChangeVector = null) {
        return __awaiter(this, void 0, void 0, function* () {
            if (TypeUtil_1.TypeUtil.isString(idOrEntity)) {
                this._deleteById(idOrEntity, expectedChangeVector);
                return;
            }
            this._deleteByEntity(idOrEntity);
        });
    }
    _deleteByEntity(entity) {
        if (!entity) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Entity cannot be null.");
        }
        const value = this.documentsByEntity.get(entity);
        if (!value) {
            (0, Exceptions_1.throwError)("InvalidOperationException", entity + " is not associated with the session, cannot delete unknown entity instance");
        }
        this.deletedEntities.add(entity);
        this.includedDocumentsById.delete(value.id);
        if (this._countersByDocId) {
            this._countersByDocId.delete(value.id);
        }
        if (this._timeSeriesByDocId) {
            this._timeSeriesByDocId.delete(value.id);
        }
        this._knownMissingIds.add(value.id);
    }
    _deleteById(id, expectedChangeVector = null) {
        if (!id) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Id cannot be null.");
        }
        let changeVector = null;
        const documentInfo = this.documentsById.getValue(id);
        if (documentInfo) {
            const newObj = this.entityToJson.convertEntityToJson(documentInfo.entity, documentInfo);
            if (documentInfo.entity && this._entityChanged(newObj, documentInfo, null)) {
                (0, Exceptions_1.throwError)("InvalidOperationException", "Can't delete changed entity using identifier. Use delete(T entity) instead.");
            }
            if (documentInfo.entity) {
                this.documentsByEntity.remove(documentInfo.entity);
            }
            this.documentsById.remove(id);
            changeVector = documentInfo.changeVector;
        }
        this._knownMissingIds.add(id);
        changeVector = this.useOptimisticConcurrency ? changeVector : null;
        if (this._countersByDocId) {
            this._countersByDocId.delete(id);
        }
        this.defer(new CommandData_1.DeleteCommandData(id, expectedChangeVector || changeVector, expectedChangeVector || (documentInfo === null || documentInfo === void 0 ? void 0 : documentInfo.changeVector)));
    }
    defer(...commands) {
        this._deferredCommands.push(...commands);
        for (const command of commands) {
            this._deferInternal(command);
        }
    }
    _deferInternal(command) {
        if (command.type === "BatchPATCH") {
            const batchPatchCommand = command;
            for (const kvp of batchPatchCommand.ids) {
                this._addCommand(command, kvp.id, "PATCH", command.name);
            }
            return;
        }
        this._addCommand(command, command.id, command.type, command.name);
    }
    _addCommand(command, id, commandType, commandName) {
        this.deferredCommandsMap.set(IdTypeAndName_1.IdTypeAndName.keyFor(id, commandType, commandName), command);
        this.deferredCommandsMap.set(IdTypeAndName_1.IdTypeAndName.keyFor(id, "ClientAnyCommand", null), command);
        if (command.type !== "AttachmentPUT"
            && command.type !== "AttachmentDELETE"
            && command.type !== "AttachmentCOPY"
            && command.type !== "AttachmentMOVE"
            && command.type !== "Counters"
            && command.type !== "TimeSeries"
            && command.type !== "TimeSeriesCopy") {
            this.deferredCommandsMap.set(IdTypeAndName_1.IdTypeAndName.keyFor(id, "ClientModifyDocumentCommand", null), command);
        }
    }
    _refreshInternal(entity, cmd, documentInfo) {
        const document = cmd.result.results[0];
        if (!document) {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Document '" + documentInfo.id + "' no longer exists and was probably deleted");
        }
        const value = document[Constants_1.CONSTANTS.Documents.Metadata.KEY];
        documentInfo.metadata = value;
        if (documentInfo.metadata) {
            const changeVector = value[Constants_1.CONSTANTS.Documents.Metadata.CHANGE_VECTOR];
            documentInfo.changeVector = changeVector;
        }
        if (documentInfo.entity && !this.noTracking) {
            this.entityToJson.removeFromMissing(documentInfo.entity);
        }
        const entityType = this.conventions.getTypeDescriptorByEntity(entity);
        documentInfo.entity = this.entityToJson.convertToEntity(entityType, documentInfo.id, document, !this.noTracking);
        documentInfo.document = document;
        Object.assign(entity, documentInfo.entity);
        const documentInfoById = this.documentsById.getValue(documentInfo.id);
        if (documentInfoById) {
            documentInfoById.entity = entity;
        }
    }
    hasChanges() {
        for (const entity of this.documentsByEntity) {
            const document = this.entityToJson.convertEntityToJson(entity.key, entity.value);
            if (this._entityChanged(document, entity.value, null)) {
                return true;
            }
        }
        return !!this.deletedEntities.size || this.deferredCommands.length > 0;
    }
    evict(entity) {
        const documentInfo = this.documentsByEntity.get(entity);
        if (documentInfo) {
            this.documentsByEntity.evict(entity);
            this.documentsById.remove(documentInfo.id);
            if (this._countersByDocId) {
                this._countersByDocId.delete(documentInfo.id);
            }
            if (this._timeSeriesByDocId) {
                this._timeSeriesByDocId.delete(documentInfo.id);
            }
        }
        this.deletedEntities.evict(entity);
        this.entityToJson.removeFromMissing(entity);
    }
    clear() {
        this.documentsByEntity.clear();
        this.deletedEntities.clear();
        this.documentsById.clear();
        this._knownMissingIds.clear();
        if (this._countersByDocId) {
            this._countersByDocId.clear();
        }
        this.deferredCommands.length = 0;
        this.deferredCommandsMap.clear();
        this._clearClusterSession();
        this._pendingLazyOperations.length = 0;
        this.entityToJson.clear();
    }
    hasChanged(entity) {
        const documentInfo = this.documentsByEntity.get(entity);
        if (!documentInfo) {
            return false;
        }
        const document = this.entityToJson.convertEntityToJson(entity, documentInfo);
        return this._entityChanged(document, documentInfo, null);
    }
    waitForReplicationAfterSaveChanges(opts) {
        if (!this._saveChangesOptions) {
            this._saveChangesOptions = {
                indexOptions: null,
                replicationOptions: null
            };
        }
        opts = opts || {};
        this._saveChangesOptions.replicationOptions = {
            replicas: opts.replicas || 1,
            throwOnTimeout: TypeUtil_1.TypeUtil.isUndefined(opts.throwOnTimeout) ? true : opts.throwOnTimeout,
            majority: TypeUtil_1.TypeUtil.isNullOrUndefined(opts.majority) ? false : opts.majority,
            timeout: opts.timeout || this.conventions.waitForReplicationAfterSaveChangesTimeout
        };
    }
    waitForIndexesAfterSaveChanges(opts) {
        if (!this._saveChangesOptions) {
            this._saveChangesOptions = {
                indexOptions: null,
                replicationOptions: null
            };
        }
        opts = opts || {};
        this._saveChangesOptions.indexOptions = {
            indexes: opts.indexes || [],
            throwOnTimeout: TypeUtil_1.TypeUtil.isNullOrUndefined(opts.throwOnTimeout) ? true : opts.throwOnTimeout,
            timeout: opts.timeout || this.conventions.waitForIndexesAfterSaveChangesTimeout
        };
    }
    ignoreChangesFor(entity) {
        this._getDocumentInfo(entity).ignoreChanges = true;
    }
    whatChanged() {
        const changes = {};
        this._getAllEntitiesChanges(changes);
        this._prepareForEntitiesDeletion(null, changes);
        return changes;
    }
    _getAllEntitiesChanges(changes) {
        for (const pair of this.documentsById.entries()) {
            InMemoryDocumentSessionOperations._updateMetadataModifications(pair[1]);
            const newObj = this.entityToJson.convertEntityToJson(pair[1].entity, pair[1]);
            this._entityChanged(newObj, pair[1], changes);
        }
    }
    dispose(isDisposing) {
        if (this._disposed) {
            return;
        }
        this.emit("sessionDisposing", { session: this });
        this._disposed = true;
    }
    get transactionMode() {
        return this._transactionMode;
    }
    set transactionMode(value) {
        this._transactionMode = value;
    }
    static _throwNoDatabase() {
        return (0, Exceptions_1.throwError)("InvalidOperationException", "Cannot open a Session without specifying a name of a database " +
            "to operate on. Database name can be passed as an argument when Session is" +
            " being opened or default database can be defined using 'DocumentStore.setDatabase()' method");
    }
}
exports.InMemoryDocumentSessionOperations = InMemoryDocumentSessionOperations;
InMemoryDocumentSessionOperations._instancesCounter = 0;
class DocumentsByEntityHolder {
    constructor() {
        this._documentsByEntity = new Map();
    }
    get size() {
        return this._documentsByEntity.size + (this._onBeforeStoreDocumentsByEntity ? this._onBeforeStoreDocumentsByEntity.size : 0);
    }
    remove(entity) {
        this._documentsByEntity.delete(entity);
        if (this._onBeforeStoreDocumentsByEntity) {
            this._onBeforeStoreDocumentsByEntity.delete(entity);
        }
    }
    evict(entity) {
        if (this._prepareEntitiesPuts) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Cannot Evict entity during OnBeforeStore");
        }
        this._documentsByEntity.delete(entity);
    }
    put(entity, documentInfo) {
        if (!this._prepareEntitiesPuts) {
            this._documentsByEntity.set(entity, documentInfo);
            return;
        }
        this._createOnBeforeStoreDocumentsByEntityIfNeeded();
        this._onBeforeStoreDocumentsByEntity.set(entity, documentInfo);
    }
    _createOnBeforeStoreDocumentsByEntityIfNeeded() {
        if (this._onBeforeStoreDocumentsByEntity) {
            return;
        }
        this._onBeforeStoreDocumentsByEntity = new Map();
    }
    clear() {
        this._documentsByEntity.clear();
        if (this._onBeforeStoreDocumentsByEntity) {
            this._onBeforeStoreDocumentsByEntity.clear();
        }
    }
    get(entity) {
        const documentInfo = this._documentsByEntity.get(entity);
        if (documentInfo) {
            return documentInfo;
        }
        if (this._onBeforeStoreDocumentsByEntity) {
            return this._onBeforeStoreDocumentsByEntity.get(entity);
        }
        return null;
    }
    [Symbol.iterator]() {
        const self = this;
        const generator = function* () {
            const firstIterator = self._documentsByEntity.entries();
            for (const item of firstIterator) {
                const mapped = {
                    key: item[0],
                    value: item[1],
                    executeOnBeforeStore: true
                };
                yield mapped;
            }
            if (!self._onBeforeStoreDocumentsByEntity) {
                return;
            }
            for (const item of self._onBeforeStoreDocumentsByEntity.entries()) {
                const mapped = {
                    key: item[0],
                    value: item[1],
                    executeOnBeforeStore: false
                };
                yield mapped;
            }
        };
        return generator();
    }
    prepareEntitiesPuts() {
        this._prepareEntitiesPuts = true;
        return {
            dispose() {
                this._prepareEntitiesPuts = false;
            }
        };
    }
}
exports.DocumentsByEntityHolder = DocumentsByEntityHolder;
class DeletedEntitiesHolder {
    constructor() {
        this._deletedEntities = new Set();
    }
    isEmpty() {
        return this.size === 0;
    }
    get size() {
        return this._deletedEntities.size + (this._onBeforeDeletedEntities ? this._onBeforeDeletedEntities.size : 0);
    }
    add(entity) {
        if (this._prepareEntitiesDeletes) {
            if (!this._onBeforeDeletedEntities) {
                this._onBeforeDeletedEntities = new Set();
            }
            this._onBeforeDeletedEntities.add(entity);
            return;
        }
        this._deletedEntities.add(entity);
    }
    remove(entity) {
        this._deletedEntities.delete(entity);
        if (this._onBeforeDeletedEntities) {
            this._onBeforeDeletedEntities.delete(entity);
        }
    }
    evict(entity) {
        if (this._prepareEntitiesDeletes) {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Cannot Evict entity during OnBeforeDelete");
        }
        this._deletedEntities.delete(entity);
    }
    contains(entity) {
        if (this._deletedEntities.has(entity)) {
            return true;
        }
        if (!this._onBeforeDeletedEntities) {
            return false;
        }
        return this._onBeforeDeletedEntities.has(entity);
    }
    clear() {
        this._deletedEntities.clear();
        if (this._onBeforeDeletedEntities) {
            this._onBeforeDeletedEntities.clear();
        }
    }
    [Symbol.iterator]() {
        const self = this;
        const generator = function* () {
            const deletedIterator = self._deletedEntities.values();
            for (const item of deletedIterator) {
                const mapped = {
                    entity: item,
                    executeOnBeforeDelete: true
                };
                yield mapped;
            }
            if (!self._onBeforeDeletedEntities) {
                return;
            }
            for (const item of self._onBeforeDeletedEntities.values()) {
                const mapped = {
                    entity: item,
                    executeOnBeforeDelete: false
                };
                yield mapped;
            }
        };
        return generator();
    }
    prepareEntitiesDeletes() {
        this._prepareEntitiesDeletes = true;
        return {
            dispose() {
                this._prepareEntitiesDeletes = false;
            }
        };
    }
}
exports.DeletedEntitiesHolder = DeletedEntitiesHolder;
