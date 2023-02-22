"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentQuery = exports.NESTED_OBJECT_TYPES_PROJECTION_FIELD = void 0;
const AbstractDocumentQuery_1 = require("./AbstractDocumentQuery");
const Exceptions_1 = require("../../Exceptions");
const Constants_1 = require("../../Constants");
const QueryData_1 = require("../Queries/QueryData");
const GroupByDocumentQuery_1 = require("./GroupByDocumentQuery");
const FieldsToFetchToken_1 = require("./Tokens/FieldsToFetchToken");
const SpatialCriteriaFactory_1 = require("../Queries/Spatial/SpatialCriteriaFactory");
const TypeUtil_1 = require("../../Utility/TypeUtil");
const FacetBuilder_1 = require("../Queries/Facets/FacetBuilder");
const AggregationDocumentQuery_1 = require("../Queries/Facets/AggregationDocumentQuery");
const MoreLikeThisBase_1 = require("../Queries/MoreLikeThis/MoreLikeThisBase");
const MoreLikeThisUsingDocument_1 = require("../Queries/MoreLikeThis/MoreLikeThisUsingDocument");
const MoreLikeThisBuilder_1 = require("../Queries/MoreLikeThis/MoreLikeThisBuilder");
const MoreLikeThisUsingDocumentForDocumentQuery_1 = require("../Queries/MoreLikeThis/MoreLikeThisUsingDocumentForDocumentQuery");
const SuggestionBase_1 = require("../Queries/Suggestions/SuggestionBase");
const SuggestionDocumentQuery_1 = require("../Queries/Suggestions/SuggestionDocumentQuery");
const SuggestionBuilder_1 = require("../Queries/Suggestions/SuggestionBuilder");
const QueryIncludeBuilder_1 = require("./Loaders/QueryIncludeBuilder");
exports.NESTED_OBJECT_TYPES_PROJECTION_FIELD = "__PROJECTED_NESTED_OBJECT_TYPES__";
class DocumentQuery extends AbstractDocumentQuery_1.AbstractDocumentQuery {
    constructor(documentType, session, indexName, collectionName, isGroupBy, declareTokens, loadTokens, fromAlias, isProjectInto) {
        super(documentType, session, indexName, collectionName, isGroupBy, declareTokens, loadTokens, fromAlias, isProjectInto);
    }
    selectFields(propertiesOrQueryData, projectionType, projectionBehavior) {
        projectionBehavior !== null && projectionBehavior !== void 0 ? projectionBehavior : (projectionBehavior = "Default");
        if (projectionType) {
            this._theSession.conventions.tryRegisterJsType(projectionType);
        }
        if (TypeUtil_1.TypeUtil.isString(propertiesOrQueryData)) {
            propertiesOrQueryData = [propertiesOrQueryData];
        }
        if (Array.isArray(propertiesOrQueryData)) {
            if (projectionType) {
                return this._selectFieldsByProjectionType(propertiesOrQueryData, projectionType, projectionBehavior);
            }
            const queryData = new QueryData_1.QueryData(propertiesOrQueryData, propertiesOrQueryData);
            queryData.isProjectInto = true;
            queryData.projectionBehavior = projectionBehavior;
            return this.selectFields(queryData, projectionType);
        }
        else {
            propertiesOrQueryData.isProjectInto = true;
            const queryData = propertiesOrQueryData;
            if (!queryData.isCustomFunction) {
                queryData.fields = [...queryData.fields, `${Constants_1.CONSTANTS.Documents.Metadata.KEY}.${Constants_1.CONSTANTS.Documents.Metadata.NESTED_OBJECT_TYPES}`];
                queryData.projections = [...queryData.projections, Constants_1.CONSTANTS.Documents.Metadata.NESTED_OBJECT_TYPES_PROJECTION_FIELD];
            }
            queryData.projectionBehavior = projectionBehavior;
            return this.createDocumentQueryInternal(projectionType, queryData);
        }
    }
    _selectFieldsByProjectionType(properties, projectionType, projectionBehavior) {
        if (!properties || !properties.length) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Fields cannot be null or empty.");
        }
        try {
            const projections = properties;
            const fields = properties.map(x => x);
            const queryData = new QueryData_1.QueryData(fields, projections);
            queryData.projectionBehavior = projectionBehavior;
            return this.selectFields(queryData, projectionType);
        }
        catch (err) {
            (0, Exceptions_1.throwError)("RavenException", "Unable to project to type: " + projectionType, err);
        }
    }
    selectTimeSeries(timeSeriesQuery, projectionClass) {
        const queryData = this._createTimeSeriesQueryData(timeSeriesQuery);
        return this.selectFields(queryData, projectionClass);
    }
    distinct() {
        this._distinct();
        return this;
    }
    orderByScore() {
        this._orderByScore();
        return this;
    }
    orderByScoreDescending() {
        this._orderByScoreDescending();
        return this;
    }
    includeExplanations(optionsOrExplanationsCallback, explanationsCallback) {
        if (arguments.length === 1) {
            return this.includeExplanations(null, optionsOrExplanationsCallback);
        }
        this._includeExplanations(optionsOrExplanationsCallback, explanationsCallback);
        return this;
    }
    timings(timings) {
        this._includeTimings(timings);
        return this;
    }
    waitForNonStaleResults(waitTimeout = null) {
        this._waitForNonStaleResults(waitTimeout);
        return this;
    }
    addParameter(name, value) {
        super.addParameter(name, value);
        return this;
    }
    addOrder(fieldName, descending, ordering = "String") {
        if (descending) {
            this.orderByDescending(fieldName, ordering);
        }
        else {
            this.orderBy(fieldName, ordering);
        }
        return this;
    }
    openSubclause() {
        this._openSubclause();
        return this;
    }
    closeSubclause() {
        this._closeSubclause();
        return this;
    }
    negateNext() {
        this._negateNext();
        return this;
    }
    search(fieldName, searchTerms, operator) {
        this._search(fieldName, searchTerms, operator);
        return this;
    }
    intersect() {
        this._intersect();
        return this;
    }
    containsAny(fieldName, values) {
        this._containsAny(fieldName, values);
        return this;
    }
    containsAll(fieldName, values) {
        this._containsAll(fieldName, values);
        return this;
    }
    statistics(stats) {
        this._statistics(stats);
        return this;
    }
    usingDefaultOperator(queryOperator) {
        this._usingDefaultOperator(queryOperator);
        return this;
    }
    noTracking() {
        this._noTracking();
        return this;
    }
    noCaching() {
        this._noCaching();
        return this;
    }
    include(pathOrIncludes) {
        if (TypeUtil_1.TypeUtil.isFunction(pathOrIncludes)) {
            const includesBuilder = new QueryIncludeBuilder_1.QueryIncludeBuilder(this.conventions);
            pathOrIncludes(includesBuilder);
            this._include(includesBuilder);
        }
        else if (TypeUtil_1.TypeUtil.isString(pathOrIncludes)) {
            this._include(pathOrIncludes);
        }
        else {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "include() accepts either string or function.");
        }
        return this;
    }
    not() {
        this.negateNext();
        return this;
    }
    take(count) {
        this._take(count);
        return this;
    }
    skip(count) {
        this._skip(count);
        return this;
    }
    whereLucene(fieldName, whereClause, exact) {
        this._whereLucene(fieldName, whereClause, exact);
        return this;
    }
    whereEquals(...args) {
        this._whereEquals(...args);
        return this;
    }
    whereNotEquals(...args) {
        this._whereNotEquals(...args);
        return this;
    }
    whereIn(...args) {
        this._whereIn(...args);
        return this;
    }
    whereStartsWith(fieldName, value, exact) {
        this._whereStartsWith(fieldName, value, exact);
        return this;
    }
    whereEndsWith(fieldName, value, exact) {
        this._whereEndsWith(fieldName, value, exact);
        return this;
    }
    whereBetween(...args) {
        this._whereBetween(...args);
        return this;
    }
    whereGreaterThan(...args) {
        this._whereGreaterThan(...args);
        return this;
    }
    whereGreaterThanOrEqual(...args) {
        this._whereGreaterThanOrEqual(...args);
        return this;
    }
    whereLessThan(...args) {
        this._whereLessThan(...args);
        return this;
    }
    whereLessThanOrEqual(...args) {
        this._whereLessThanOrEqual(...args);
        return this;
    }
    whereExists(fieldName) {
        this._whereExists(fieldName);
        return this;
    }
    whereRegex(fieldName, pattern) {
        this._whereRegex(fieldName, pattern);
        return this;
    }
    andAlso(wrapPreviousQueryClauses) {
        this._andAlso(wrapPreviousQueryClauses);
        return this;
    }
    orElse() {
        this._orElse();
        return this;
    }
    boost(boost) {
        this._boost(boost);
        return this;
    }
    fuzzy(fuzzy) {
        this._fuzzy(fuzzy);
        return this;
    }
    proximity(proximity) {
        this._proximity(proximity);
        return this;
    }
    randomOrdering(seed) {
        this._randomOrdering(seed);
        return this;
    }
    groupBy(...args) {
        this._groupBy(...args);
        return new GroupByDocumentQuery_1.GroupByDocumentQuery(this);
    }
    ofType(tResultClass) {
        if (tResultClass) {
            this._theSession.conventions.tryRegisterJsType(tResultClass);
        }
        return this.createDocumentQueryInternal(tResultClass);
    }
    orderBy(...args) {
        this._orderBy(...args);
        return this;
    }
    orderByDescending(...args) {
        this._orderByDescending(...args);
        return this;
    }
    createDocumentQueryInternal(resultClass, queryData) {
        let newFieldsToFetch;
        if (queryData && queryData.fields.length > 0) {
            let { fields } = queryData;
            if (!this._isGroupBy) {
                const identityProperty = this.conventions.getIdentityProperty(resultClass);
                if (identityProperty) {
                    fields = queryData.fields.map(p => p === identityProperty ? Constants_1.CONSTANTS.Documents.Indexing.Fields.DOCUMENT_ID_FIELD_NAME : p);
                }
            }
            let sourceAliasReference;
            DocumentQuery._getSourceAliasIfExists(resultClass, queryData, fields, s => sourceAliasReference = s);
            newFieldsToFetch = FieldsToFetchToken_1.FieldsToFetchToken.create(fields, queryData.projections, queryData.isCustomFunction, sourceAliasReference);
        }
        else {
            newFieldsToFetch = null;
        }
        if (newFieldsToFetch) {
            this._updateFieldsToFetchToken(newFieldsToFetch);
        }
        const query = new DocumentQuery(resultClass, this._theSession, this.indexName, this.collectionName, this._isGroupBy, queryData ? queryData.declareTokens : null, queryData ? queryData.loadTokens : null, queryData ? queryData.fromAlias : null, queryData ? queryData.isProjectInto : null);
        query._queryRaw = this._queryRaw;
        query._pageSize = this._pageSize;
        query._selectTokens = this._selectTokens;
        query.fieldsToFetchToken = this.fieldsToFetchToken;
        query._whereTokens = this._whereTokens;
        query._orderByTokens = this._orderByTokens;
        query._groupByTokens = this._groupByTokens;
        query._queryParameters = this._queryParameters;
        query._start = this._start;
        query._timeout = this._timeout;
        query._queryStats = this._queryStats;
        query._theWaitForNonStaleResults = this._theWaitForNonStaleResults;
        query._negate = this._negate;
        query._documentIncludes = new Set(this._documentIncludes);
        query._counterIncludesTokens = this._counterIncludesTokens;
        query._timeSeriesIncludesTokens = this._timeSeriesIncludesTokens;
        query._revisionsIncludesTokens = this._revisionsIncludesTokens;
        query._compareExchangeValueIncludesTokens = this._compareExchangeValueIncludesTokens;
        query._rootTypes = new Set([this._clazz]);
        for (const listener of query.listeners("beforeQuery")) {
            query.on("beforeQuery", listener);
        }
        for (const listener of query.listeners("afterQuery")) {
            query.on("afterQuery", listener);
        }
        for (const listener of query.listeners("afterStreamExecuted")) {
            query.on("afterStreamExecuted", listener);
        }
        query._explanations = this._explanations;
        query._explanationToken = this._explanationToken;
        query._queryTimings = this._queryTimings;
        query._queryHighlightings = this._queryHighlightings;
        query._highlightingTokens = this._highlightingTokens;
        query._disableEntitiesTracking = this._disableEntitiesTracking;
        query._disableCaching = this._disableCaching;
        query.projectionBehavior = queryData ? queryData.projectionBehavior : this.projectionBehavior;
        query._isIntersect = this._isIntersect;
        query._defaultOperator = this._defaultOperator;
        return query;
    }
    aggregateBy(facetOrFacetBuilder, ...facets) {
        if (TypeUtil_1.TypeUtil.isNullOrUndefined(facetOrFacetBuilder)) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Facet or facet builder cannot be null.");
        }
        const argType = typeof facetOrFacetBuilder;
        if (argType === "function") {
            const ff = new FacetBuilder_1.FacetBuilder();
            facetOrFacetBuilder(ff);
            return this.aggregateBy(ff.getFacet());
        }
        for (const facet of [facetOrFacetBuilder, ...facets]) {
            this._aggregateBy(facet);
        }
        return new AggregationDocumentQuery_1.AggregationDocumentQuery(this);
    }
    aggregateUsing(facetSetupDocumentId) {
        this._aggregateUsing(facetSetupDocumentId);
        return new AggregationDocumentQuery_1.AggregationDocumentQuery(this);
    }
    highlight(parameters, hightlightingsCallback) {
        this._highlight(parameters, hightlightingsCallback);
        return this;
    }
    spatial(fieldNameOrField, clause) {
        const criteria = clause(SpatialCriteriaFactory_1.SpatialCriteriaFactory.INSTANCE);
        this._spatial(fieldNameOrField, criteria);
        return this;
    }
    withinRadiusOf(fieldName, radius, latitude, longitude, radiusUnits = null, distanceErrorPct = Constants_1.CONSTANTS.Documents.Indexing.Spatial.DEFAULT_DISTANCE_ERROR_PCT) {
        this._withinRadiusOf(fieldName, radius, latitude, longitude, radiusUnits, distanceErrorPct);
        return this;
    }
    relatesToShape(fieldName, shapeWkt, relation, distanceErrorPctOrUnits, distanceErrorPct) {
        let units;
        if (TypeUtil_1.TypeUtil.isNullOrUndefined(distanceErrorPct)) {
            if (TypeUtil_1.TypeUtil.isString(distanceErrorPctOrUnits)) {
                units = distanceErrorPctOrUnits;
                distanceErrorPct = Constants_1.CONSTANTS.Documents.Indexing.Spatial.DEFAULT_DISTANCE_ERROR_PCT;
            }
            else {
                units = null;
                distanceErrorPct = distanceErrorPctOrUnits;
            }
        }
        else {
            units = distanceErrorPctOrUnits;
        }
        this._spatialByShapeWkt(fieldName, shapeWkt, relation, units, distanceErrorPct);
        return this;
    }
    orderByDistance(...args) {
        this._orderByDistance(...args);
        return this;
    }
    orderByDistanceDescending(...args) {
        this._orderByDistanceDescending(...args);
        return this;
    }
    moreLikeThis(moreLikeThisBaseOrBuilder) {
        if (moreLikeThisBaseOrBuilder instanceof MoreLikeThisBase_1.MoreLikeThisBase) {
            const mlt = this._moreLikeThis();
            try {
                mlt.withOptions(moreLikeThisBaseOrBuilder.options);
                if (moreLikeThisBaseOrBuilder instanceof MoreLikeThisUsingDocument_1.MoreLikeThisUsingDocument) {
                    mlt.withDocument(moreLikeThisBaseOrBuilder.documentJson);
                }
            }
            finally {
                mlt.dispose();
            }
        }
        else {
            const f = new MoreLikeThisBuilder_1.MoreLikeThisBuilder();
            moreLikeThisBaseOrBuilder(f);
            const moreLikeThis = this._moreLikeThis();
            try {
                moreLikeThis.withOptions(f.getMoreLikeThis().options);
                const innerMoreLikeThis = f.getMoreLikeThis();
                if (innerMoreLikeThis instanceof MoreLikeThisUsingDocument_1.MoreLikeThisUsingDocument) {
                    moreLikeThis.withDocument(innerMoreLikeThis.documentJson);
                }
                else if (innerMoreLikeThis instanceof MoreLikeThisUsingDocumentForDocumentQuery_1.MoreLikeThisUsingDocumentForDocumentQuery) {
                    innerMoreLikeThis.forDocumentQuery(this);
                }
            }
            finally {
                moreLikeThis.dispose();
            }
        }
        return this;
    }
    suggestUsing(suggestBaseOrBuilder) {
        if (suggestBaseOrBuilder instanceof SuggestionBase_1.SuggestionBase) {
            this._suggestUsing(suggestBaseOrBuilder);
            return new SuggestionDocumentQuery_1.SuggestionDocumentQuery(this);
        }
        else {
            const f = new SuggestionBuilder_1.SuggestionBuilder();
            suggestBaseOrBuilder(f);
            this.suggestUsing(f.suggestion);
            return new SuggestionDocumentQuery_1.SuggestionDocumentQuery(this);
        }
    }
}
exports.DocumentQuery = DocumentQuery;