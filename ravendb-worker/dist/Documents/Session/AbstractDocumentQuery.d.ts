/// <reference types="node" />
import { Lazy } from "../Lazy";
import { QueryOperation } from "./Operations/QueryOperation";
import { HighlightingToken } from "./Tokens/HighlightingToken";
import { FieldsToFetchToken } from "./Tokens/FieldsToFetchToken";
import { DeclareToken } from "./Tokens/DeclareToken";
import { LoadToken } from "./Tokens/LoadToken";
import { FromToken } from "./Tokens/FromToken";
import { InMemoryDocumentSessionOperations } from "./InMemoryDocumentSessionOperations";
import { QueryStatistics } from "./QueryStatistics";
import { IDocumentSession } from "./IDocumentSession";
import { QueryOperator } from "../Queries/QueryOperator";
import { IndexQuery } from "../Queries/IndexQuery";
import { IAbstractDocumentQuery } from "./IAbstractDocumentQuery";
import { GroupBy } from "../Queries/GroupBy";
import { ExplanationToken } from "../Session/Tokens/ExplanationToken";
import { QueryToken } from "./Tokens/QueryToken";
import { WhereParams } from "./WhereParams";
import { MethodCall } from "./MethodCall";
import { CounterIncludesToken } from "./Tokens/CounterIncludesToken";
import { QueryResult } from "../Queries/QueryResult";
import { DocumentType } from "../DocumentAbstractions";
import { QueryEventsEmitter } from "./QueryEvents";
import { EventEmitter } from "events";
import { DocumentConventions } from "../Conventions/DocumentConventions";
import { OrderingType } from "./OrderingType";
import { SearchOperator } from "../Queries/SearchOperator";
import { SpatialUnits, SpatialRelation } from "../Indexes/Spatial";
import { DynamicSpatialField } from "../Queries/Spatial/DynamicSpatialField";
import { SpatialCriteria } from "../Queries/Spatial/SpatialCriteria";
import { ValueCallback } from "../../Types/Callbacks";
import { FacetBase } from "../Queries/Facets/FacetBase";
import { MoreLikeThisScope } from "../Queries/MoreLikeThis/MoreLikeThisScope";
import { LazyQueryOperation } from "../Session/Operations/Lazy/LazyQueryOperation";
import { SuggestionBase } from "../Queries/Suggestions/SuggestionBase";
import { QueryData } from "../Queries/QueryData";
import { QueryTimings } from "../Queries/Timings/QueryTimings";
import { Explanations } from "../Queries/Explanation/Explanations";
import { Highlightings } from "../Queries/Highlighting/Hightlightings";
import { HighlightingParameters } from "../Queries/Highlighting/HighlightingParameters";
import { QueryHighlightings } from "../Queries/Highlighting/QueryHighlightings";
import { ExplanationOptions } from "../Queries/Explanation/ExplanationOptions";
import { CountersByDocId } from "./CounterInternalTypes";
import { IncludeBuilderBase } from "./Loaders/IncludeBuilderBase";
import { TimeSeriesIncludesToken } from "./Tokens/TimeSeriesIncludesToken";
import { CompareExchangeValueIncludesToken } from "./Tokens/CompareExchangeValueIncludesToken";
import { ITimeSeriesQueryBuilder } from "../Queries/TimeSeries/ITimeSeriesQueryBuilder";
import { ProjectionBehavior } from "../Queries/ProjectionBehavior";
import { IAbstractDocumentQueryImpl } from "./IAbstractDocumentQueryImpl";
import { RevisionIncludesToken } from "./Tokens/RevisionIncludesToken";
export declare abstract class AbstractDocumentQuery<T extends object, TSelf extends AbstractDocumentQuery<T, TSelf>> extends EventEmitter implements QueryEventsEmitter, IAbstractDocumentQuery<T>, IAbstractDocumentQueryImpl<T> {
    protected _clazz: DocumentType<T>;
    private _aliasToGroupByFieldName;
    protected _defaultOperator: QueryOperator;
    protected _rootTypes: Set<DocumentType>;
    protected _negate: boolean;
    private readonly _indexName;
    private readonly _collectionName;
    private _currentClauseDepth;
    protected _queryRaw: string;
    get indexName(): string;
    get collectionName(): string;
    protected _queryParameters: {
        [key: string]: object;
    };
    protected _isIntersect: boolean;
    protected _isGroupBy: boolean;
    protected _theSession: InMemoryDocumentSessionOperations;
    protected _pageSize: number;
    protected _selectTokens: QueryToken[];
    protected _fromToken: FromToken;
    protected _declareTokens: DeclareToken[];
    protected _loadTokens: LoadToken[];
    fieldsToFetchToken: FieldsToFetchToken;
    _isProjectInto: boolean;
    protected _whereTokens: QueryToken[];
    protected _groupByTokens: QueryToken[];
    protected _orderByTokens: QueryToken[];
    protected _withTokens: QueryToken[];
    protected _graphRawQuery: QueryToken;
    protected _start: number;
    private readonly _conventions;
    protected _timeout: number;
    protected _theWaitForNonStaleResults: boolean;
    protected _documentIncludes: Set<string>;
    private _statsCallback;
    protected _queryStats: QueryStatistics;
    protected _disableEntitiesTracking: boolean;
    protected _disableCaching: boolean;
    protected projectionBehavior: ProjectionBehavior;
    private _parameterPrefix;
    private _includesAlias;
    protected _highlightingTokens: HighlightingToken[];
    protected _queryHighlightings: QueryHighlightings;
    protected _queryTimings: QueryTimings;
    protected _explanations: Explanations;
    protected _explanationToken: ExplanationToken;
    get isDistinct(): boolean;
    get theWaitForNonStaleResults(): boolean;
    get timeout(): number;
    get queryParameters(): {
        [key: string]: object;
    };
    get selectTokens(): QueryToken[];
    get isProjectInto(): boolean;
    set isProjectInto(value: boolean);
    get conventions(): DocumentConventions;
    get session(): IDocumentSession;
    isDynamicMapReduce(): boolean;
    private _isInMoreLikeThis;
    private _getDefaultTimeout;
    protected constructor(clazz: DocumentType<T>, session: InMemoryDocumentSessionOperations, indexName: string, collectionName: string, isGroupBy: boolean, declareTokens: DeclareToken[], loadTokens: LoadToken[]);
    protected constructor(clazz: DocumentType<T>, session: InMemoryDocumentSessionOperations, indexName: string, collectionName: string, isGroupBy: boolean, declareTokens: DeclareToken[], loadTokens: LoadToken[], fromAlias: string, isProjectInto: boolean);
    private _getCurrentWhereTokens;
    private _ensureValidFieldName;
    private _appendOperatorIfNeeded;
    private _transformCollection;
    private _negateIfNeeded;
    _usingDefaultOperator(operator: any): void;
    _waitForNonStaleResults(waitTimeout?: number): void;
    protected _getLazyQueryOperation(): LazyQueryOperation<T>;
    initializeQueryOperation(): QueryOperation;
    private _transformValue;
    private _stringifyParameter;
    private _addQueryParameter;
    protected static _getSourceAliasIfExists<TResult extends object>(documentType: DocumentType<TResult>, queryData: QueryData, fields: string[], sourceAlias: (value: string) => void): void;
    protected _createTimeSeriesQueryData(timeSeriesQuery: (builder: ITimeSeriesQueryBuilder) => void): QueryData;
    protected _updateFieldsToFetchToken(fieldsToFetch: FieldsToFetchToken): void;
    getIndexQuery(): IndexQuery;
    getProjectionFields(): string[];
    _randomOrdering(): void;
    _randomOrdering(seed?: string): void;
    _projection(projectionBehavior: ProjectionBehavior): void;
    protected addGroupByAlias(fieldName: string, projectedName: string): void;
    private _assertNoRawQuery;
    _graphQuery(query: string): void;
    addParameter(name: string, value: any): void;
    _groupBy(fieldName: string, ...fieldNames: string[]): void;
    _groupBy(field: GroupBy, ...fields: GroupBy[]): void;
    _groupByKey(fieldName: string): void;
    _groupByKey(fieldName: string, projectedName: string): void;
    _groupBySum(fieldName: string): void;
    _groupBySum(fieldName: string, projectedName: string): void;
    _groupByCount(): void;
    _groupByCount(projectedName: string): void;
    _whereTrue(): void;
    _moreLikeThis(): MoreLikeThisScope;
    _include(path: string): void;
    _include(includes: IncludeBuilderBase): void;
    _take(count: number): void;
    _skip(count: number): void;
    _whereLucene(fieldName: string, whereClause: string, exact: boolean): void;
    _openSubclause(): void;
    _closeSubclause(): void;
    _whereEquals(fieldName: string, method: MethodCall): void;
    _whereEquals(fieldName: string, method: MethodCall, exact: boolean): void;
    _whereEquals(fieldName: string, value: any): void;
    _whereEquals(fieldName: string, value: any, exact: boolean): void;
    _whereEquals(whereParams: WhereParams): void;
    private _ifValueIsMethod;
    _whereNotEquals(fieldName: string, value: any): void;
    _whereNotEquals(fieldName: string, value: any, exact: boolean): void;
    _whereNotEquals(fieldName: string, method: MethodCall): void;
    _whereNotEquals(fieldName: string, method: MethodCall, exact: boolean): void;
    _whereNotEquals(whereParams: WhereParams): void;
    _negateNext(): void;
    _whereIn(fieldName: string, values: any[]): void;
    _whereIn(fieldName: string, values: any[], exact: boolean): void;
    _whereStartsWith(fieldName: string, value: any, exact?: boolean): void;
    _whereEndsWith(fieldName: string, value: any, exact?: boolean): void;
    _whereBetween(fieldName: string, start: any, end: any): void;
    _whereBetween(fieldName: string, start: any, end: any, exact: boolean): void;
    _whereGreaterThan(fieldName: string, value: any): void;
    _whereGreaterThan(fieldName: string, value: any, exact: boolean): void;
    _whereGreaterThanOrEqual(fieldName: string, value: any): void;
    _whereGreaterThanOrEqual(fieldName: string, value: any, exact: boolean): void;
    _whereLessThan(fieldName: string, value: any): void;
    _whereLessThan(fieldName: string, value: any, exact: boolean): void;
    _whereLessThanOrEqual(fieldName: string, value: any): void;
    _whereLessThanOrEqual(fieldName: string, value: any, exact: boolean): void;
    _whereRegex(fieldName: string, pattern: string): void;
    _andAlso(wrapPreviousQueryClauses?: boolean): void;
    _orElse(): void;
    _boost(boost: number): void;
    _fuzzy(fuzzy: number): void;
    _proximity(proximity: number): void;
    _orderBy(field: string): void;
    _orderBy(field: string, ordering: OrderingType): void;
    _orderBy(field: string, options: {
        sorterName: string;
    }): any;
    _orderByDescending(field: string): void;
    _orderByDescending(field: string, ordering: OrderingType): void;
    _orderByDescending(field: string, options: {
        sorterName: string;
    }): any;
    _orderByScore(): void;
    _orderByScoreDescending(): void;
    _statistics(statsCallback: (stats: QueryStatistics) => void): void;
    protected _generateIndexQuery(query: string): IndexQuery;
    _search(fieldName: string, searchTerms: string): void;
    _search(fieldName: string, searchTerms: string, operator: SearchOperator): void;
    toString(compatibilityMode?: boolean): string;
    private _buildGraphQuery;
    private _buildWith;
    private _buildPagination;
    private _buildInclude;
    private _writeIncludeTokens;
    _intersect(): void;
    _whereExists(fieldName: string): void;
    _containsAny(fieldName: string, values: any[]): void;
    _containsAll(fieldName: string, values: any[]): void;
    addRootType(clazz: DocumentType): void;
    _distinct(): void;
    private _updateStatsAndHighlightingsAndExplanations;
    private _buildSelect;
    private _buildFrom;
    private _buildDeclare;
    private _buildLoad;
    private _buildWhere;
    private _buildGroupBy;
    private _buildOrderBy;
    private static _unpackCollection;
    protected _queryOperation: QueryOperation;
    queryOperation(): QueryOperation;
    _noTracking(): void;
    _noCaching(): void;
    _includeTimings(timingsCallback: (timings: QueryTimings) => void): void;
    _highlight(parameters: HighlightingParameters, highlightingsCallback: ValueCallback<Highlightings>): void;
    protected _withinRadiusOf(fieldName: string, radius: number, latitude: number, longitude: number, radiusUnits: SpatialUnits, distErrorPercent: number): void;
    protected _spatialByShapeWkt(fieldName: string, shapeWkt: string, relation: SpatialRelation, units: SpatialUnits, distErrorPercent: number): void;
    _spatial(dynamicField: DynamicSpatialField, criteria: SpatialCriteria): void;
    _spatial(fieldName: string, criteria: SpatialCriteria): void;
    _orderByDistance(field: DynamicSpatialField, latitude: number, longitude: number): void;
    _orderByDistance(field: DynamicSpatialField, shapeWkt: string): void;
    _orderByDistance(fieldName: string, latitude: number, longitude: number): void;
    _orderByDistance(fieldName: string, latitude: number, longitude: number, roundFactor: number): void;
    _orderByDistance(fieldName: string, shapeWkt: string): void;
    _orderByDistance(fieldName: string, shapeWkt: string, roundFactor: number): void;
    _orderByDistanceDescending(field: DynamicSpatialField, latitude: number, longitude: number): void;
    _orderByDistanceDescending(field: DynamicSpatialField, shapeWkt: string): void;
    _orderByDistanceDescending(fieldName: string, latitude: number, longitude: number): void;
    _orderByDistanceDescending(fieldName: string, latitude: number, longitude: number, roundFactor: number): void;
    _orderByDistanceDescending(fieldName: string, shapeWkt: string): void;
    _orderByDistanceDescending(fieldName: string, shapeWkt: string, roundFactor: number): void;
    private _assertIsDynamicQuery;
    protected _initSync(): Promise<void>;
    private _executeActualQuery;
    iterator(): Promise<IterableIterator<T>>;
    all(): Promise<T[]>;
    getQueryResult(): Promise<QueryResult>;
    first(): Promise<T>;
    firstOrNull(): Promise<T | null>;
    single(): Promise<T>;
    singleOrNull(): Promise<T | null>;
    count(): Promise<number>;
    private _executeQueryOperation;
    private _executeQueryOperationInternal;
    longCount(): Promise<number>;
    any(): Promise<boolean>;
    _aggregateBy(facet: FacetBase): void;
    _aggregateUsing(facetSetupDocumentId: string): void;
    lazily(): Lazy<T[]>;
    countLazily(): Lazy<number>;
    _suggestUsing(suggestion: SuggestionBase): void;
    private _getOptionsParameterName;
    private _assertCanSuggest;
    _includeExplanations(options: ExplanationOptions, explanationsCallback: ValueCallback<Explanations>): void;
    protected _timeSeriesIncludesTokens: TimeSeriesIncludesToken[];
    protected _counterIncludesTokens: CounterIncludesToken[];
    protected _compareExchangeValueIncludesTokens: CompareExchangeValueIncludesToken[];
    protected _revisionsIncludesTokens: RevisionIncludesToken[];
    protected _includeCounters(alias: string, counterToIncludeByDocId: CountersByDocId): void;
    private _includeTimeSeries;
    getQueryType(): DocumentType<T>;
    getGraphRawQuery(): QueryToken;
    addFromAliasToWhereTokens(fromAlias: string): void;
    addAliasToIncludesTokens(fromAlias: string): string;
    private _includeRevisionsByDate;
    private _includeRevisionsByChangeVector;
    get parameterPrefix(): string;
    set parameterPrefix(prefix: string);
}