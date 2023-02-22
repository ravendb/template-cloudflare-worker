import { Lazy } from "../Lazy";
import { DocumentConventions } from "../Conventions/DocumentConventions";
import { IDisposable } from "../../Types/Contracts";
import { DocumentType } from "../DocumentAbstractions";
import { ClassConstructor, EntitiesCollectionObject, ObjectTypeDescriptor } from "../../Types";
import { IAdvancedSessionOperations } from "./IAdvancedSessionOperations";
import { ILoaderWithInclude } from "./Loaders/ILoaderWithInclude";
import { DocumentQueryOptions } from "./QueryOptions";
import { IDocumentQuery } from "./IDocumentQuery";
import { IIncludeBuilder } from "./Loaders/IIncludeBuilder";
import { ISessionDocumentCounters } from "./ISessionDocumentCounters";
import { ISessionDocumentTimeSeries } from "./ISessionDocumentTimeSeries";
import { ISessionDocumentTypedTimeSeries } from "./ISessionDocumentTypedTimeSeries";
import { ISessionDocumentRollupTypedTimeSeries } from "./ISessionDocumentRollupTypedTimeSeries";
import { InMemoryDocumentSessionOperations } from "./InMemoryDocumentSessionOperations";
import { SessionOptions } from "./SessionOptions";
import { DocumentStoreBase } from "../DocumentStoreBase";
import { RequestExecutor } from "../../Http/RequestExecutor";
import { AbstractCommonApiForIndexes } from "../Indexes/AbstractCommonApiForIndexes";
import { AbstractTimeSeriesRange } from "../Operations/TimeSeries/AbstractTimeSeriesRange";
export declare class SessionInfo {
    private static _clientSessionIdCounter;
    private _sessionId;
    private _sessionIdUsed;
    private readonly _loadBalancerContextSeed;
    private _canUseLoadBalanceBehavior;
    private readonly _session;
    lastClusterTransactionIndex: number;
    noCaching: boolean;
    constructor(session: InMemoryDocumentSessionOperations, options: SessionOptions, documentStore: DocumentStoreBase);
    incrementRequestCount(): void;
    setContext(sessionKey: string): void;
    private _setContextInternal;
    getCurrentSessionNode(requestExecutor: RequestExecutor): Promise<import("../..").ServerNode>;
    getSessionId(): number;
    canUseLoadBalanceBehavior(): boolean;
}
export declare type ConcurrencyCheckMode = "Auto" | "Forced" | "Disabled";
export interface IDocumentSession extends IDisposable {
    advanced: IAdvancedSessionOperations;
    load<TEntity extends object>(id: string): Promise<TEntity | null>;
    load<TEntity extends object>(id: string, documentType?: DocumentType<TEntity>): Promise<TEntity | null>;
    load<TEntity extends object>(id: string, options?: LoadOptions<TEntity>): Promise<TEntity | null>;
    load<TEntity extends object>(ids: string[]): Promise<EntitiesCollectionObject<TEntity>>;
    load<TEntity extends object>(ids: string[], documentType?: DocumentType<TEntity>): Promise<EntitiesCollectionObject<TEntity>>;
    load<TEntity extends object>(ids: string[], options?: LoadOptions<TEntity>): Promise<EntitiesCollectionObject<TEntity>>;
    delete<TEntity extends object>(id: string): Promise<void>;
    delete<TEntity extends object>(id: string, expectedChangeVector: string): Promise<void>;
    delete<TEntity extends object>(entity: TEntity): Promise<void>;
    store<TEntity extends object>(document: TEntity): Promise<void>;
    store<TEntity extends object>(document: TEntity, id?: string): Promise<void>;
    store<TEntity extends object>(document: TEntity, id?: string, documentType?: DocumentType<TEntity>): Promise<void>;
    store<TEntity extends object>(document: TEntity, id?: string, options?: StoreOptions<TEntity>): Promise<void>;
    include(path: string): ILoaderWithInclude;
    saveChanges(): Promise<void>;
    query<T extends object>(opts: DocumentQueryOptions<T>): IDocumentQuery<T>;
    query<T extends object>(documentType: DocumentType<T>): IDocumentQuery<T>;
    query<T extends object>(documentType: DocumentType<T>, index: new () => AbstractCommonApiForIndexes): IDocumentQuery<T>;
    countersFor(documentId: string): ISessionDocumentCounters;
    countersFor(entity: object): ISessionDocumentCounters;
    timeSeriesFor(documentId: string, name: string): ISessionDocumentTimeSeries;
    timeSeriesFor(entity: any, name: string): ISessionDocumentTimeSeries;
    timeSeriesFor<T extends object>(documentId: string, clazz: ObjectTypeDescriptor<T>): ISessionDocumentTypedTimeSeries<T>;
    timeSeriesFor<T extends object>(documentId: string, name: string, clazz: ObjectTypeDescriptor<T>): ISessionDocumentTypedTimeSeries<T>;
    timeSeriesFor<T extends object>(entity: object, clazz: ObjectTypeDescriptor<T>): ISessionDocumentTypedTimeSeries<T>;
    timeSeriesFor<T extends object>(entity: object, name: string, clazz: ObjectTypeDescriptor<T>): ISessionDocumentTypedTimeSeries<T>;
    timeSeriesRollupFor<T extends object>(entity: object, policy: string, clazz: ClassConstructor<T>): ISessionDocumentRollupTypedTimeSeries<T>;
    timeSeriesRollupFor<T extends object>(entity: object, policy: string, raw: string, clazz: ClassConstructor<T>): ISessionDocumentRollupTypedTimeSeries<T>;
    timeSeriesRollupFor<T extends object>(documentId: string, policy: string, clazz: ClassConstructor<T>): ISessionDocumentRollupTypedTimeSeries<T>;
    timeSeriesRollupFor<T extends object>(documentId: string, policy: string, raw: string, clazz: ClassConstructor<T>): ISessionDocumentRollupTypedTimeSeries<T>;
}
export interface StoreOptions<T extends object> {
    documentType?: DocumentType<T>;
    changeVector?: string;
}
export interface LoadOptions<T extends object> {
    documentType?: DocumentType<T>;
    includes?: string[] | ((includesBuilder: IIncludeBuilder) => void);
    expectedChangeVector?: string;
}
export interface SessionLoadStartingWithOptions<T extends object> extends StartingWithOptions {
    matches?: string;
    start?: number;
    pageSize?: number;
    exclude?: string;
    startAfter?: string;
    documentType?: DocumentType<T>;
    streamResults?: boolean;
}
export interface StartingWithOptions {
    matches?: string;
    start?: number;
    pageSize?: number;
    exclude?: string;
    startAfter?: string;
}
export interface SessionLoadInternalParameters<TResult extends object> {
    includes?: string[];
    documentType?: DocumentType<TResult>;
    counterIncludes?: string[];
    includeAllCounters?: boolean;
    timeSeriesIncludes?: AbstractTimeSeriesRange[];
    compareExchangeValueIncludes?: string[];
    revisionIncludesByChangeVector?: string[];
    revisionsToIncludeByDateTime?: Date;
}
export interface IDocumentSessionImpl extends IDocumentSession {
    conventions: DocumentConventions;
    loadInternal<TResult extends object>(ids: string[], opts: SessionLoadInternalParameters<TResult>): Promise<EntitiesCollectionObject<TResult>>;
    lazyLoadInternal<TResult extends object>(ids: string[], includes: string[], clazz: ObjectTypeDescriptor<TResult>): Lazy<EntitiesCollectionObject<TResult>>;
}