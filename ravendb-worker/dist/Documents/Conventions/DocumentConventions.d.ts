import { TypesAwareObjectMapper } from "../../Mapping/ObjectMapper";
import { DocumentType } from "../DocumentAbstractions";
import { ObjectTypeDescriptor, Field } from "../../Types";
import { ClientConfiguration } from "../Operations/Configuration/ClientConfiguration";
import { ReadBalanceBehavior } from "../../Http/ReadBalanceBehavior";
import { DateUtil } from "../../Utility/DateUtil";
import { CasingConvention, ObjectChangeCaseOptions } from "../../Utility/ObjectUtil";
import { LoadBalanceBehavior } from "../../Http/LoadBalanceBehavior";
import { BulkInsertConventions } from "./BulkInsertConventions";
import { InMemoryDocumentSessionOperations } from "../Session/InMemoryDocumentSessionOperations";
export declare type IdConvention = (databaseName: string, entity: object) => Promise<string>;
export declare type IValueForQueryConverter<T> = (fieldName: Field<T>, value: T, forRange: boolean, stringValue: (value: any) => void) => boolean;
export declare class DocumentConventions {
    private static _defaults;
    static defaultForServerConventions: DocumentConventions;
    static get defaultConventions(): DocumentConventions;
    private static _cachedDefaultTypeCollectionNames;
    private readonly _listOfQueryValueToObjectConverters;
    private _registeredIdConventions;
    private _registeredIdPropertyNames;
    private _frozen;
    private _originalConfiguration;
    private _identityPartsSeparator;
    private _disableTopologyUpdates;
    private _disableAtomicDocumentWritesInClusterWideTransaction;
    private _shouldIgnoreEntityChanges;
    private _transformClassCollectionNameToDocumentIdPrefix;
    private _documentIdGenerator;
    private _loadBalancerPerSessionContextSelector;
    private _findCollectionName;
    private _identityProperty;
    private _findJsTypeName;
    private _findJsType;
    private _useOptimisticConcurrency;
    private _throwIfQueryPageSizeIsNotSet;
    private _maxNumberOfRequestsPerSession;
    private _requestTimeout;
    private _firstBroadcastAttemptTimeout;
    private _secondBroadcastAttemptTimeout;
    private _waitForIndexesAfterSaveChangesTimeout;
    private _waitForReplicationAfterSaveChangesTimeout;
    private _waitForNonStaleResultsTimeout;
    private _loadBalancerContextSeed;
    private _loadBalanceBehavior;
    private _readBalanceBehavior;
    private _maxHttpCacheSize;
    private readonly _knownEntityTypes;
    private _localEntityFieldNameConvention;
    private _remoteEntityFieldNameConvention;
    private _objectMapper;
    private _customFetch;
    private _dateUtil;
    private _syncJsonParseLimit;
    private _useCompression;
    private _sendApplicationIdentifier;
    private readonly _bulkInsert;
    get bulkInsert(): BulkInsertConventions;
    constructor();
    get requestTimeout(): number;
    set requestTimeout(requestTimeout: number);
    get sendApplicationIdentifier(): boolean;
    set sendApplicationIdentifier(sendApplicationIdentifier: boolean);
    get secondBroadcastAttemptTimeout(): number;
    set secondBroadcastAttemptTimeout(secondBroadcastAttemptTimeout: number);
    get firstBroadcastAttemptTimeout(): number;
    set firstBroadcastAttemptTimeout(firstBroadcastAttemptTimeout: number);
    get objectMapper(): TypesAwareObjectMapper;
    set objectMapper(value: TypesAwareObjectMapper);
    get customFetch(): any;
    set customFetch(customFetch: any);
    get syncJsonParseLimit(): number;
    set syncJsonParseLimit(value: number);
    get dateUtil(): DateUtil;
    get readBalanceBehavior(): ReadBalanceBehavior;
    set readBalanceBehavior(value: ReadBalanceBehavior);
    get loadBalancerContextSeed(): number;
    set loadBalancerContextSeed(seed: number);
    get loadBalanceBehavior(): LoadBalanceBehavior;
    set loadBalanceBehavior(loadBalanceBehavior: LoadBalanceBehavior);
    get loadBalancerPerSessionContextSelector(): (databaseName: string) => string;
    set loadBalancerPerSessionContextSelector(selector: (databaseName: string) => string);
    get entityFieldNameConvention(): CasingConvention;
    set entityFieldNameConvention(val: CasingConvention);
    get remoteEntityFieldNameConvention(): CasingConvention;
    set remoteEntityFieldNameConvention(val: CasingConvention);
    set useOptimisticConcurrency(val: boolean);
    get useOptimisticConcurrency(): boolean;
    deserializeEntityFromJson(documentType: ObjectTypeDescriptor, document: object): object;
    get maxNumberOfRequestsPerSession(): number;
    set maxNumberOfRequestsPerSession(value: number);
    get maxHttpCacheSize(): number;
    set maxHttpCacheSize(value: number);
    get hasExplicitlySetCompressionUsage(): boolean;
    get waitForIndexesAfterSaveChangesTimeout(): number;
    set waitForIndexesAfterSaveChangesTimeout(value: number);
    get waitForNonStaleResultsTimeout(): number;
    set waitForNonStaleResultsTimeout(value: number);
    get waitForReplicationAfterSaveChangesTimeout(): number;
    set waitForReplicationAfterSaveChangesTimeout(value: number);
    get useCompression(): boolean;
    set useCompression(value: boolean);
    private _dateUtilOpts;
    get storeDatesInUtc(): boolean;
    set storeDatesInUtc(value: boolean);
    get storeDatesWithTimezoneInfo(): boolean;
    set storeDatesWithTimezoneInfo(value: boolean);
    isThrowIfQueryPageSizeIsNotSet(): boolean;
    setThrowIfQueryPageSizeIsNotSet(throwIfQueryPageSizeIsNotSet: boolean): void;
    isUseOptimisticConcurrency(): boolean;
    setUseOptimisticConcurrency(useOptimisticConcurrency: boolean): void;
    get identityProperty(): string;
    set identityProperty(val: string);
    get findJsType(): (id: string, doc: object) => ObjectTypeDescriptor<object>;
    set findJsType(value: (id: string, doc: object) => ObjectTypeDescriptor<object>);
    get findJsTypeName(): (ctorOrTypeChecker: ObjectTypeDescriptor<object>) => string;
    set findJsTypeName(value: (ctorOrTypeChecker: ObjectTypeDescriptor<object>) => string);
    get findCollectionName(): (constructorOrTypeChecker: ObjectTypeDescriptor<object>) => string;
    set findCollectionName(value: (constructorOrTypeChecker: ObjectTypeDescriptor<object>) => string);
    get documentIdGenerator(): IdConvention;
    set documentIdGenerator(value: IdConvention);
    get identityPartsSeparator(): string;
    set identityPartsSeparator(value: string);
    get shouldIgnoreEntityChanges(): (sessionOperations: InMemoryDocumentSessionOperations, entity: object, documentId: string) => boolean;
    set shouldIgnoreEntityChanges(shouldIgnoreEntityChanges: (sessionOperations: InMemoryDocumentSessionOperations, entity: object, documentId: string) => boolean);
    get disableTopologyUpdates(): boolean;
    set disableTopologyUpdates(value: boolean);
    get throwIfQueryPageSizeIsNotSet(): boolean;
    set throwIfQueryPageSizeIsNotSet(value: boolean);
    get transformClassCollectionNameToDocumentIdPrefix(): (maybeClassCollectionName: string) => string;
    set transformClassCollectionNameToDocumentIdPrefix(value: (maybeClassCollectionName: string) => string);
    static defaultGetCollectionName(ctorOrTypeChecker: ObjectTypeDescriptor): string;
    getCollectionNameForType(ctorOrTypeChecker: ObjectTypeDescriptor): string;
    getCollectionNameForEntity(entity: object): string;
    private _findCollectionNameForObjectLiteral;
    get findCollectionNameForObjectLiteral(): (entity: object) => string;
    set findCollectionNameForObjectLiteral(value: (entity: object) => string);
    getTypeDescriptorByEntity<T extends object>(entity: T): ObjectTypeDescriptor<T>;
    getEntityTypeDescriptor<T extends object>(entity: T): ObjectTypeDescriptor<T>;
    generateDocumentId(database: string, entity: object): Promise<string>;
    registerIdConvention<TEntity>(ctorOrTypeChecker: ObjectTypeDescriptor, idConvention: IdConvention): DocumentConventions;
    registerEntityIdPropertyName(ctorOrTypeChecker: ObjectTypeDescriptor, idProperty: string): void;
    getJsType(id: string, document: object): ObjectTypeDescriptor;
    getJsTypeName(entityType: ObjectTypeDescriptor): string;
    get disableAtomicDocumentWritesInClusterWideTransaction(): boolean;
    set disableAtomicDocumentWritesInClusterWideTransaction(disableAtomicDocumentWritesInClusterWideTransaction: boolean);
    clone(): DocumentConventions;
    getIdentityProperty(documentType: DocumentType): string;
    updateFrom(configuration: ClientConfiguration): void;
    static defaultTransformCollectionNameToDocumentIdPrefix(collectionName: string): string;
    tryConvertValueToObjectForQuery(fieldName: string, value: any, forRange: boolean, strValue: (value: any) => void): boolean;
    freeze(): void;
    private _assertNotFrozen;
    get knownEntityTypesByName(): Map<string, ObjectTypeDescriptor<object>>;
    get knownEntityTypes(): ObjectTypeDescriptor<object>[];
    registerJsType(entityType: ObjectTypeDescriptor): this;
    registerJsType(entityType: ObjectTypeDescriptor, name: string): this;
    registerEntityType(entityType: ObjectTypeDescriptor): this;
    registerEntityType(entityType: ObjectTypeDescriptor, name: string): this;
    tryRegisterJsType(docType: DocumentType): this;
    tryRegisterEntityType(docType: DocumentType): this;
    getJsTypeByDocumentType<T extends object>(documentType: DocumentType<T>): ObjectTypeDescriptor<T>;
    getJsTypeByDocumentType<T extends object>(typeName: string): ObjectTypeDescriptor<T>;
    transformObjectKeysToRemoteFieldNameConvention(obj: object, opts?: ObjectChangeCaseOptions): object;
    transformObjectKeysToLocalFieldNameConvention(obj: object, opts?: ObjectChangeCaseOptions): object;
    validate(): void;
}
