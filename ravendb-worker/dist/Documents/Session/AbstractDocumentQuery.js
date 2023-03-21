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
exports.AbstractDocumentQuery = void 0;
const QueryOperation_1 = require("./Operations/QueryOperation");
const GroupByCountToken_1 = require("./Tokens/GroupByCountToken");
const GroupByToken_1 = require("./Tokens/GroupByToken");
const HighlightingToken_1 = require("./Tokens/HighlightingToken");
const FieldsToFetchToken_1 = require("./Tokens/FieldsToFetchToken");
const FromToken_1 = require("./Tokens/FromToken");
const DistinctToken_1 = require("./Tokens/DistinctToken");
const QueryStatistics_1 = require("./QueryStatistics");
const Exceptions_1 = require("../../Exceptions");
const IndexQuery_1 = require("../Queries/IndexQuery");
const GroupBy_1 = require("../Queries/GroupBy");
const GroupByKeyToken_1 = require("../Session/Tokens/GroupByKeyToken");
const GroupBySumToken_1 = require("../Session/Tokens/GroupBySumToken");
const ExplanationToken_1 = require("../Session/Tokens/ExplanationToken");
const TimingsToken_1 = require("../Session/Tokens/TimingsToken");
const TrueToken_1 = require("../Session/Tokens/TrueToken");
const WhereToken_1 = require("../Session/Tokens/WhereToken");
const QueryFieldUtil_1 = require("../Queries/QueryFieldUtil");
const CloseSubclauseToken_1 = require("./Tokens/CloseSubclauseToken");
const OpenSubclauseToken_1 = require("./Tokens/OpenSubclauseToken");
const NegateToken_1 = require("./Tokens/NegateToken");
const WhereParams_1 = require("./WhereParams");
const TypeUtil_1 = require("../../Utility/TypeUtil");
const DateUtil_1 = require("../../Utility/DateUtil");
const MethodCall_1 = require("./MethodCall");
const QueryOperatorToken_1 = require("./Tokens/QueryOperatorToken");
const OrderByToken_1 = require("./Tokens/OrderByToken");
const FacetToken_1 = require("./Tokens/FacetToken");
const CounterIncludesToken_1 = require("./Tokens/CounterIncludesToken");
const events_1 = require("events");
const StringUtil_1 = require("../../Utility/StringUtil");
const IntersectMarkerToken_1 = require("./Tokens/IntersectMarkerToken");
const DocumentConventions_1 = require("../Conventions/DocumentConventions");
const Constants_1 = require("../../Constants");
const DocumentQueryHelper_1 = require("./DocumentQueryHelper");
const ShapeToken_1 = require("./Tokens/ShapeToken");
const SessionEvents_1 = require("./SessionEvents");
const CmpXchg_1 = require("./CmpXchg");
const DocumentQueryCustomization_1 = require("./DocumentQueryCustomization");
const MoreLikeThisScope_1 = require("../Queries/MoreLikeThis/MoreLikeThisScope");
const MoreLikeThisToken_1 = require("./Tokens/MoreLikeThisToken");
const LazyQueryOperation_1 = require("../Session/Operations/Lazy/LazyQueryOperation");
const SuggestToken_1 = require("./Tokens/SuggestToken");
const SuggestionWithTerm_1 = require("../Queries/Suggestions/SuggestionWithTerm");
const SuggestionWithTerms_1 = require("../Queries/Suggestions/SuggestionWithTerms");
const QueryData_1 = require("../Queries/QueryData");
const QueryTimings_1 = require("../Queries/Timings/QueryTimings");
const Explanations_1 = require("../Queries/Explanation/Explanations");
const HighlightingOptions_1 = require("../Queries/Highlighting/HighlightingOptions");
const QueryHighlightings_1 = require("../Queries/Highlighting/QueryHighlightings");
const os = require("os");
const GraphQueryToken_1 = require("./Tokens/GraphQueryToken");
const IncludesUtil_1 = require("./IncludesUtil");
const TimeSeriesIncludesToken_1 = require("./Tokens/TimeSeriesIncludesToken");
const CompareExchangeValueIncludesToken_1 = require("./Tokens/CompareExchangeValueIncludesToken");
const TimeSeriesQueryBuilder_1 = require("../Queries/TimeSeries/TimeSeriesQueryBuilder");
const StringBuilder_1 = require("../../Utility/StringBuilder");
const RevisionIncludesToken_1 = require("./Tokens/RevisionIncludesToken");
class AbstractDocumentQuery extends events_1.EventEmitter {
    constructor(clazz, session, indexName, collectionName, isGroupBy, declareTokens, loadTokens, fromAlias = null, isProjectInto = false) {
        super();
        this._aliasToGroupByFieldName = {};
        this._defaultOperator = "AND";
        this._rootTypes = new Set();
        this._queryParameters = {};
        this._selectTokens = [];
        this._whereTokens = [];
        this._groupByTokens = [];
        this._orderByTokens = [];
        this._withTokens = [];
        this._documentIncludes = new Set();
        this._statsCallback = TypeUtil_1.TypeUtil.NOOP;
        this._queryStats = new QueryStatistics_1.QueryStatistics();
        this._parameterPrefix = "p";
        this._highlightingTokens = [];
        this._queryHighlightings = new QueryHighlightings_1.QueryHighlightings();
        this._clazz = clazz;
        this._rootTypes.add(clazz);
        this._isGroupBy = isGroupBy;
        this._indexName = indexName;
        this._collectionName = collectionName;
        this._fromToken = FromToken_1.FromToken.create(indexName, collectionName, fromAlias);
        this._declareTokens = declareTokens;
        this._loadTokens = loadTokens;
        this._theSession = session;
        this.on("afterQueryExecuted", (result) => {
            this._updateStatsAndHighlightingsAndExplanations(result);
        });
        this._conventions = !session ?
            new DocumentConventions_1.DocumentConventions() :
            session.conventions;
        this._isProjectInto = isProjectInto || false;
    }
    get indexName() {
        return this._indexName;
    }
    get collectionName() {
        return this._collectionName;
    }
    get isDistinct() {
        return this._selectTokens
            && this._selectTokens.length
            && this._selectTokens[0] instanceof DistinctToken_1.DistinctToken;
    }
    get theWaitForNonStaleResults() {
        return this._theWaitForNonStaleResults;
    }
    get timeout() {
        return this._timeout;
    }
    get queryParameters() {
        return this._queryParameters;
    }
    get selectTokens() {
        return this._selectTokens;
    }
    get isProjectInto() {
        return this._isProjectInto;
    }
    set isProjectInto(value) {
        this._isProjectInto = value;
    }
    get conventions() {
        return this._conventions;
    }
    get session() {
        return this._theSession;
    }
    isDynamicMapReduce() {
        return this._groupByTokens && !!this._groupByTokens.length;
    }
    _getDefaultTimeout() {
        return this._conventions.waitForNonStaleResultsTimeout;
    }
    _getCurrentWhereTokens() {
        if (!this._isInMoreLikeThis) {
            return this._whereTokens;
        }
        if (!this._whereTokens || !this._whereTokens.length) {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Cannot get MoreLikeThisToken because there are no where token specified.");
        }
        const lastToken = this._whereTokens[this._whereTokens.length - 1];
        if (lastToken instanceof MoreLikeThisToken_1.MoreLikeThisToken) {
            return lastToken.whereTokens;
        }
        else {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Last token is not MoreLikeThisToken");
        }
    }
    _ensureValidFieldName(fieldName, isNestedPath) {
        if (!this._theSession
            || !this._theSession.conventions
            || isNestedPath
            || this._isGroupBy) {
            return QueryFieldUtil_1.QueryFieldUtil.escapeIfNecessary(fieldName, isNestedPath);
        }
        for (const rootType of this._rootTypes) {
            const identityProperty = this._theSession.conventions.getIdentityProperty(rootType);
            if (identityProperty && identityProperty === fieldName) {
                return Constants_1.CONSTANTS.Documents.Indexing.Fields.DOCUMENT_ID_FIELD_NAME;
            }
        }
        return QueryFieldUtil_1.QueryFieldUtil.escapeIfNecessary(fieldName);
    }
    _appendOperatorIfNeeded(tokens) {
        this._assertNoRawQuery();
        if (!tokens || !tokens.length) {
            return;
        }
        const lastToken = tokens[tokens.length - 1];
        if (!(lastToken instanceof WhereToken_1.WhereToken) && !(lastToken instanceof CloseSubclauseToken_1.CloseSubclauseToken)) {
            return;
        }
        let lastWhere = null;
        for (let i = tokens.length - 1; i >= 0; i--) {
            if (tokens[i] instanceof WhereToken_1.WhereToken) {
                lastWhere = tokens[i];
                break;
            }
        }
        let token = this._defaultOperator === "AND"
            ? QueryOperatorToken_1.QueryOperatorToken.AND
            : QueryOperatorToken_1.QueryOperatorToken.OR;
        if (lastWhere
            && lastWhere.options.searchOperator) {
            token = QueryOperatorToken_1.QueryOperatorToken.OR;
        }
        tokens.push(token);
    }
    _transformCollection(fieldName, values) {
        const result = [];
        for (const value of values) {
            if (Array.isArray(value)) {
                result.push(...this._transformCollection(fieldName, value));
            }
            else {
                const nestedWhereParams = new WhereParams_1.WhereParams();
                nestedWhereParams.allowWildcards = true;
                nestedWhereParams.fieldName = fieldName;
                nestedWhereParams.value = value;
                result.push(this._transformValue(nestedWhereParams));
            }
        }
        return result;
    }
    _negateIfNeeded(tokens, fieldName) {
        if (!this._negate) {
            return;
        }
        this._negate = false;
        if (!tokens || !tokens.length || tokens[tokens.length - 1] instanceof OpenSubclauseToken_1.OpenSubclauseToken) {
            if (fieldName) {
                this._whereExists(fieldName);
            }
            else {
                this._whereTrue();
            }
            this._andAlso();
        }
        tokens.push(NegateToken_1.NegateToken.INSTANCE);
    }
    _usingDefaultOperator(operator) {
        if (!this._whereTokens || !!this._whereTokens.length) {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Default operator can only be set before any where clause is added.");
        }
        this._defaultOperator = operator;
    }
    _waitForNonStaleResults(waitTimeout) {
        if (this._theWaitForNonStaleResults) {
            if (!this._timeout || waitTimeout && this._timeout < waitTimeout) {
                this._timeout = waitTimeout;
            }
            return;
        }
        this._theWaitForNonStaleResults = true;
        this._timeout = waitTimeout || this._getDefaultTimeout();
    }
    _getLazyQueryOperation() {
        if (!this._queryOperation) {
            this._queryOperation = this.initializeQueryOperation();
        }
        const clazz = this._conventions.getJsTypeByDocumentType(this._clazz);
        return new LazyQueryOperation_1.LazyQueryOperation(this._theSession, this._queryOperation, this, clazz);
    }
    initializeQueryOperation() {
        const beforeQueryEventArgs = new SessionEvents_1.SessionBeforeQueryEventArgs(this._theSession, new DocumentQueryCustomization_1.DocumentQueryCustomization(this));
        this._theSession.emit("beforeQuery", beforeQueryEventArgs);
        const indexQuery = this.getIndexQuery();
        return new QueryOperation_1.QueryOperation(this._theSession, this._indexName, indexQuery, this.fieldsToFetchToken, this._disableEntitiesTracking, false, false, this._isProjectInto);
    }
    _transformValue(whereParams, forRange = false) {
        if (TypeUtil_1.TypeUtil.isNullOrUndefined(whereParams.value)) {
            return null;
        }
        if ("" === whereParams.value) {
            return "";
        }
        let objectValue = null;
        if (this._conventions.tryConvertValueToObjectForQuery(whereParams.fieldName, whereParams.value, forRange, s => objectValue = s)) {
            return objectValue;
        }
        const value = whereParams.value;
        return this._stringifyParameter(value);
    }
    _stringifyParameter(value) {
        if (TypeUtil_1.TypeUtil.isDate(value)) {
            return DateUtil_1.DateUtil.utc.stringify(value);
        }
        if (TypeUtil_1.TypeUtil.isString(value)) {
            return value;
        }
        if (TypeUtil_1.TypeUtil.isNumber(value)) {
            return value;
        }
        if (value === false || value === true) {
            return value;
        }
        return value || null;
    }
    _addQueryParameter(value) {
        const parameterName = this.parameterPrefix + Object.keys(this._queryParameters).length;
        this._queryParameters[parameterName] = this._stringifyParameter(value);
        return parameterName;
    }
    static _getSourceAliasIfExists(documentType, queryData, fields, sourceAlias) {
        sourceAlias(null);
        if (fields.length !== 1 || !fields[0]) {
            return;
        }
        const indexOf = fields[0].indexOf(".");
        if (indexOf === -1) {
            return;
        }
        const possibleAlias = fields[0].substring(0, indexOf);
        if (queryData.fromAlias && queryData.fromAlias === possibleAlias) {
            sourceAlias(possibleAlias);
            return;
        }
        if (!queryData.loadTokens || queryData.loadTokens.length === 0) {
            return;
        }
        if (!queryData.loadTokens.find(x => x.alias === possibleAlias)) {
            return;
        }
        sourceAlias(possibleAlias);
    }
    _createTimeSeriesQueryData(timeSeriesQuery) {
        const builder = new TimeSeriesQueryBuilder_1.TimeSeriesQueryBuilder();
        timeSeriesQuery(builder);
        const fields = [Constants_1.TIME_SERIES.SELECT_FIELD_NAME + "(" + builder.queryText + ")"];
        const projections = [Constants_1.TIME_SERIES.QUERY_FUNCTION];
        return new QueryData_1.QueryData(fields, projections);
    }
    _updateFieldsToFetchToken(fieldsToFetch) {
        this.fieldsToFetchToken = fieldsToFetch;
        if (this._selectTokens && !this._selectTokens.length) {
            this._selectTokens.push(fieldsToFetch);
        }
        else {
            const fetchToken = [...this._selectTokens]
                .filter(x => x instanceof FieldsToFetchToken_1.FieldsToFetchToken)[0];
            if (fetchToken) {
                const idx = this._selectTokens.indexOf(fetchToken);
                this._selectTokens[idx] = fieldsToFetch;
            }
            else {
                this._selectTokens.push(fieldsToFetch);
            }
        }
    }
    getIndexQuery() {
        let serverVersion = null;
        if (this._theSession && this._theSession.requestExecutor) {
            serverVersion = this._theSession.requestExecutor.lastServerVersion;
        }
        const compatibilityMode = serverVersion && serverVersion.localeCompare("4.2") < 0;
        const query = this.toString(compatibilityMode);
        const indexQuery = this._generateIndexQuery(query);
        this.emit("beforeQueryExecuted", indexQuery);
        return indexQuery;
    }
    getProjectionFields() {
        return this.fieldsToFetchToken &&
            this.fieldsToFetchToken.projections
            ? [...this.fieldsToFetchToken.projections]
            : [];
    }
    _randomOrdering(seed) {
        this._assertNoRawQuery();
        this._noCaching();
        if (!seed) {
            this._orderByTokens.push(OrderByToken_1.OrderByToken.random);
            return;
        }
        this._orderByTokens.push(OrderByToken_1.OrderByToken.createRandom(seed));
    }
    _projection(projectionBehavior) {
        this.projectionBehavior = projectionBehavior;
    }
    addGroupByAlias(fieldName, projectedName) {
        this._aliasToGroupByFieldName[projectedName] = fieldName;
    }
    _assertNoRawQuery() {
        if (this._queryRaw) {
            (0, Exceptions_1.throwError)("InvalidOperationException", "RawQuery was called, cannot modify this query by calling on "
                + "operations that would modify the query (such as Where, Select, OrderBy, GroupBy, etc)");
        }
    }
    _graphQuery(query) {
        this._graphRawQuery = new GraphQueryToken_1.GraphQueryToken(query);
    }
    addParameter(name, value) {
        name = name.replace(/^\$/, "");
        if (Object.keys(this._queryParameters).indexOf(name) !== -1) {
            (0, Exceptions_1.throwError)("InvalidOperationException", "The parameter " + name + " was already added");
        }
        this._queryParameters[name] = value;
    }
    _groupBy(fieldOrFieldName, ...fieldsOrFieldNames) {
        if (typeof (fieldOrFieldName) === "string") {
            const mapping = fieldsOrFieldNames.map(x => GroupBy_1.GroupBy.field(x));
            this._groupBy(GroupBy_1.GroupBy.field(fieldOrFieldName), ...mapping);
            return;
        }
        if (!this._fromToken.isDynamic) {
            (0, Exceptions_1.throwError)("InvalidOperationException", "groupBy only works with dynamic queries");
        }
        this._assertNoRawQuery();
        this._isGroupBy = true;
        const fieldName = this._ensureValidFieldName(fieldOrFieldName.field, false);
        this._groupByTokens.push(GroupByToken_1.GroupByToken.create(fieldName, fieldOrFieldName.method));
        if (!fieldsOrFieldNames || !fieldsOrFieldNames.length) {
            return;
        }
        for (const item of fieldsOrFieldNames) {
            fieldOrFieldName = this._ensureValidFieldName(item.field, false);
            this._groupByTokens.push(GroupByToken_1.GroupByToken.create(fieldOrFieldName, item.method));
        }
    }
    _groupByKey(fieldName, projectedName = null) {
        this._assertNoRawQuery();
        this._isGroupBy = true;
        if (projectedName && this._aliasToGroupByFieldName[projectedName]) {
            const aliasedFieldName = this._aliasToGroupByFieldName[projectedName];
            if (!fieldName || fieldName.toLocaleLowerCase() === (projectedName || "").toLocaleLowerCase()) {
                fieldName = aliasedFieldName;
            }
        }
        else if (fieldName
            && Object.keys(this._aliasToGroupByFieldName)
                .reduce((result, next) => result || next === fieldName, false)) {
            fieldName = this._aliasToGroupByFieldName[fieldName];
        }
        this._selectTokens.push(GroupByKeyToken_1.GroupByKeyToken.create(fieldName, projectedName));
    }
    _groupBySum(fieldName, projectedName = null) {
        this._assertNoRawQuery();
        this._isGroupBy = true;
        fieldName = this._ensureValidFieldName(fieldName, false);
        this._selectTokens.push(GroupBySumToken_1.GroupBySumToken.create(fieldName, projectedName));
    }
    _groupByCount(projectedName = null) {
        this._assertNoRawQuery();
        this._isGroupBy = true;
        this._selectTokens.push(GroupByCountToken_1.GroupByCountToken.create(projectedName));
    }
    _whereTrue() {
        const tokens = this._getCurrentWhereTokens();
        this._appendOperatorIfNeeded(tokens);
        this._negateIfNeeded(tokens, null);
        tokens.push(TrueToken_1.TrueToken.INSTANCE);
    }
    _moreLikeThis() {
        this._appendOperatorIfNeeded(this._whereTokens);
        const token = new MoreLikeThisToken_1.MoreLikeThisToken();
        this._whereTokens.push(token);
        this._isInMoreLikeThis = true;
        return new MoreLikeThisScope_1.MoreLikeThisScope(token, v => this._addQueryParameter(v), () => this._isInMoreLikeThis = false);
    }
    _include(pathOrIncludes) {
        if (!pathOrIncludes) {
            return;
        }
        if (TypeUtil_1.TypeUtil.isString(pathOrIncludes)) {
            this._documentIncludes.add(pathOrIncludes);
            return;
        }
        const { documentsToInclude } = pathOrIncludes;
        if (documentsToInclude) {
            for (const doc of documentsToInclude) {
                this._documentIncludes.add(doc);
            }
        }
        this._includeCounters(pathOrIncludes.alias, pathOrIncludes.countersToIncludeBySourcePath);
        if (pathOrIncludes.timeSeriesToIncludeBySourceAlias) {
            this._includeTimeSeries(pathOrIncludes.alias, pathOrIncludes.timeSeriesToIncludeBySourceAlias);
        }
        if (pathOrIncludes.revisionsToIncludeByDateTime) {
            this._includeRevisionsByDate(pathOrIncludes.revisionsToIncludeByDateTime);
        }
        if (pathOrIncludes.revisionsToIncludeByChangeVector) {
            this._includeRevisionsByChangeVector(pathOrIncludes.revisionsToIncludeByChangeVector);
        }
        if (pathOrIncludes.compareExchangeValuesToInclude) {
            this._compareExchangeValueIncludesTokens = [];
            for (const compareExchangeValue of pathOrIncludes.compareExchangeValuesToInclude) {
                this._compareExchangeValueIncludesTokens.push(CompareExchangeValueIncludesToken_1.CompareExchangeValueIncludesToken.create(compareExchangeValue));
            }
        }
    }
    _take(count) {
        this._pageSize = count;
    }
    _skip(count) {
        this._start = count;
    }
    _whereLucene(fieldName, whereClause, exact) {
        fieldName = this._ensureValidFieldName(fieldName, false);
        const tokens = this._getCurrentWhereTokens();
        this._appendOperatorIfNeeded(tokens);
        this._negateIfNeeded(tokens, fieldName);
        const options = exact ? new WhereToken_1.WhereOptions({ exact }) : null;
        const whereToken = WhereToken_1.WhereToken.create("Lucene", fieldName, this._addQueryParameter(whereClause), options);
        tokens.push(whereToken);
    }
    _openSubclause() {
        this._currentClauseDepth++;
        const tokens = this._getCurrentWhereTokens();
        this._appendOperatorIfNeeded(tokens);
        this._negateIfNeeded(tokens, null);
        tokens.push(OpenSubclauseToken_1.OpenSubclauseToken.create());
    }
    _closeSubclause() {
        this._currentClauseDepth--;
        const tokens = this._getCurrentWhereTokens();
        tokens.push(CloseSubclauseToken_1.CloseSubclauseToken.create());
    }
    _whereEquals(fieldNameOrWhereParams, value, exact = false) {
        if (!TypeUtil_1.TypeUtil.isObject(fieldNameOrWhereParams)) {
            const params = new WhereParams_1.WhereParams();
            params.fieldName = fieldNameOrWhereParams;
            params.value = value;
            params.exact = exact;
            this._whereEquals(params);
            return;
        }
        const whereParams = fieldNameOrWhereParams;
        if (this._negate) {
            this._negate = false;
            this._whereNotEquals(whereParams);
            return;
        }
        whereParams.fieldName = this._ensureValidFieldName(whereParams.fieldName, whereParams.nestedPath);
        const tokens = this._getCurrentWhereTokens();
        this._appendOperatorIfNeeded(tokens);
        if (this._ifValueIsMethod("Equals", whereParams, tokens)) {
            return;
        }
        const transformToEqualValue = this._transformValue(whereParams);
        const addQueryParameter = this._addQueryParameter(transformToEqualValue);
        const whereToken = WhereToken_1.WhereToken.create("Equals", whereParams.fieldName, addQueryParameter, new WhereToken_1.WhereOptions({
            exact: whereParams.exact
        }));
        tokens.push(whereToken);
    }
    _ifValueIsMethod(op, whereParams, tokens) {
        if (whereParams.value instanceof MethodCall_1.MethodCall) {
            const mc = whereParams.value;
            const args = mc.args.map(() => null);
            for (let i = 0; i < mc.args.length; i++) {
                args[i] = this._addQueryParameter(mc.args[i]);
            }
            let token;
            const type = mc.constructor.name;
            if (CmpXchg_1.CmpXchg.name === type) {
                token = WhereToken_1.WhereToken.create(op, whereParams.fieldName, null, new WhereToken_1.WhereOptions({
                    methodType: "CmpXchg",
                    parameters: args,
                    property: mc.accessPath,
                    exact: whereParams.exact
                }));
            }
            else {
                (0, Exceptions_1.throwError)("InvalidArgumentException", `Unknown method ${type}.`);
            }
            tokens.push(token);
            return true;
        }
        return false;
    }
    _whereNotEquals(fieldNameOrWhereParams, value, exact = false) {
        let whereParams;
        if (TypeUtil_1.TypeUtil.isString(fieldNameOrWhereParams)) {
            whereParams = new WhereParams_1.WhereParams();
            whereParams.fieldName = fieldNameOrWhereParams;
            whereParams.value = value;
            whereParams.exact = exact;
            return this._whereNotEquals(whereParams);
        }
        whereParams = fieldNameOrWhereParams;
        if (this._negate) {
            this._negate = false;
            this._whereEquals(whereParams);
            return;
        }
        const transformToEqualValue = this._transformValue(whereParams);
        const tokens = this._getCurrentWhereTokens();
        this._appendOperatorIfNeeded(tokens);
        whereParams.fieldName = this._ensureValidFieldName(whereParams.fieldName, whereParams.nestedPath);
        if (this._ifValueIsMethod("NotEquals", whereParams, tokens)) {
            return;
        }
        const whereToken = WhereToken_1.WhereToken.create("NotEquals", whereParams.fieldName, this._addQueryParameter(transformToEqualValue), new WhereToken_1.WhereOptions(whereParams.exact));
        tokens.push(whereToken);
    }
    _negateNext() {
        this._negate = !this._negate;
    }
    _whereIn(fieldName, values, exact = false) {
        fieldName = this._ensureValidFieldName(fieldName, false);
        const tokens = this._getCurrentWhereTokens();
        this._appendOperatorIfNeeded(tokens);
        this._negateIfNeeded(tokens, fieldName);
        const whereToken = WhereToken_1.WhereToken.create("In", fieldName, this._addQueryParameter(this._transformCollection(fieldName, AbstractDocumentQuery._unpackCollection(values))));
        tokens.push(whereToken);
    }
    _whereStartsWith(fieldName, value, exact = false) {
        const whereParams = new WhereParams_1.WhereParams();
        whereParams.fieldName = fieldName;
        whereParams.value = value;
        whereParams.allowWildcards = true;
        const transformToEqualValue = this._transformValue(whereParams);
        const tokens = this._getCurrentWhereTokens();
        this._appendOperatorIfNeeded(tokens);
        whereParams.fieldName = this._ensureValidFieldName(whereParams.fieldName, whereParams.nestedPath);
        this._negateIfNeeded(tokens, whereParams.fieldName);
        const whereToken = WhereToken_1.WhereToken.create("StartsWith", whereParams.fieldName, this._addQueryParameter(transformToEqualValue), new WhereToken_1.WhereOptions({
            exact
        }));
        tokens.push(whereToken);
    }
    _whereEndsWith(fieldName, value, exact = false) {
        const whereParams = new WhereParams_1.WhereParams();
        whereParams.fieldName = fieldName;
        whereParams.value = value;
        whereParams.allowWildcards = true;
        const transformToEqualValue = this._transformValue(whereParams);
        const tokens = this._getCurrentWhereTokens();
        this._appendOperatorIfNeeded(tokens);
        whereParams.fieldName = this._ensureValidFieldName(whereParams.fieldName, whereParams.nestedPath);
        this._negateIfNeeded(tokens, whereParams.fieldName);
        const whereToken = WhereToken_1.WhereToken.create("EndsWith", whereParams.fieldName, this._addQueryParameter(transformToEqualValue), new WhereToken_1.WhereOptions({
            exact
        }));
        tokens.push(whereToken);
    }
    _whereBetween(fieldName, start, end, exact = false) {
        fieldName = this._ensureValidFieldName(fieldName, false);
        const tokens = this._getCurrentWhereTokens();
        this._appendOperatorIfNeeded(tokens);
        this._negateIfNeeded(tokens, fieldName);
        const startParams = new WhereParams_1.WhereParams();
        startParams.value = start;
        startParams.fieldName = fieldName;
        const endParams = new WhereParams_1.WhereParams();
        endParams.value = end;
        endParams.fieldName = fieldName;
        const fromParameterName = this._addQueryParameter(!start ? "*" : this._transformValue(startParams, true));
        const toParameterName = this._addQueryParameter(!end ? "NULL" : this._transformValue(endParams, true));
        const whereToken = WhereToken_1.WhereToken.create("Between", fieldName, null, new WhereToken_1.WhereOptions({
            exact,
            from: fromParameterName,
            to: toParameterName
        }));
        tokens.push(whereToken);
    }
    _whereGreaterThan(fieldName, value, exact = false) {
        fieldName = this._ensureValidFieldName(fieldName, false);
        const tokens = this._getCurrentWhereTokens();
        this._appendOperatorIfNeeded(tokens);
        this._negateIfNeeded(tokens, fieldName);
        const whereParams = new WhereParams_1.WhereParams();
        whereParams.value = value;
        whereParams.fieldName = fieldName;
        const parameter = this._addQueryParameter(!value ? "*" : this._transformValue(whereParams, true));
        const whereToken = WhereToken_1.WhereToken.create("GreaterThan", fieldName, parameter, new WhereToken_1.WhereOptions({ exact }));
        tokens.push(whereToken);
    }
    _whereGreaterThanOrEqual(fieldName, value, exact = false) {
        fieldName = this._ensureValidFieldName(fieldName, false);
        const tokens = this._getCurrentWhereTokens();
        this._appendOperatorIfNeeded(tokens);
        this._negateIfNeeded(tokens, fieldName);
        const whereParams = new WhereParams_1.WhereParams();
        whereParams.value = value;
        whereParams.fieldName = fieldName;
        const parameter = this._addQueryParameter(!value ? "*" : this._transformValue(whereParams, true));
        const whereToken = WhereToken_1.WhereToken.create("GreaterThanOrEqual", fieldName, parameter, new WhereToken_1.WhereOptions({ exact }));
        tokens.push(whereToken);
    }
    _whereLessThan(fieldName, value, exact = false) {
        fieldName = this._ensureValidFieldName(fieldName, false);
        const tokens = this._getCurrentWhereTokens();
        this._appendOperatorIfNeeded(tokens);
        this._negateIfNeeded(tokens, fieldName);
        const whereParams = new WhereParams_1.WhereParams();
        whereParams.value = value;
        whereParams.fieldName = fieldName;
        const parameter = this._addQueryParameter(!value ? "NULL" : this._transformValue(whereParams, true));
        const whereToken = WhereToken_1.WhereToken.create("LessThan", fieldName, parameter, new WhereToken_1.WhereOptions({ exact }));
        tokens.push(whereToken);
    }
    _whereLessThanOrEqual(fieldName, value, exact = false) {
        fieldName = this._ensureValidFieldName(fieldName, false);
        const tokens = this._getCurrentWhereTokens();
        this._appendOperatorIfNeeded(tokens);
        this._negateIfNeeded(tokens, fieldName);
        const whereParams = new WhereParams_1.WhereParams();
        whereParams.value = value;
        whereParams.fieldName = fieldName;
        const parameter = this._addQueryParameter(!value ? "NULL" : this._transformValue(whereParams, true));
        const whereToken = WhereToken_1.WhereToken.create("LessThanOrEqual", fieldName, parameter, new WhereToken_1.WhereOptions({ exact }));
        tokens.push(whereToken);
    }
    _whereRegex(fieldName, pattern) {
        fieldName = this._ensureValidFieldName(fieldName, false);
        const tokens = this._getCurrentWhereTokens();
        this._appendOperatorIfNeeded(tokens);
        this._negateIfNeeded(tokens, fieldName);
        const whereParams = new WhereParams_1.WhereParams();
        whereParams.value = pattern;
        whereParams.fieldName = fieldName;
        const parameter = this._addQueryParameter(this._transformValue(whereParams));
        const whereToken = WhereToken_1.WhereToken.create("Regex", fieldName, parameter);
        tokens.push(whereToken);
    }
    _andAlso(wrapPreviousQueryClauses = false) {
        const tokens = this._getCurrentWhereTokens();
        if (!tokens || !tokens.length) {
            return;
        }
        if (tokens[tokens.length - 1] instanceof QueryOperatorToken_1.QueryOperatorToken) {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Cannot add AND, previous token was already an operator token.");
        }
        if (wrapPreviousQueryClauses) {
            tokens.unshift(OpenSubclauseToken_1.OpenSubclauseToken.create());
            tokens.push(CloseSubclauseToken_1.CloseSubclauseToken.create());
            tokens.push(QueryOperatorToken_1.QueryOperatorToken.AND);
        }
        else {
            tokens.push(QueryOperatorToken_1.QueryOperatorToken.AND);
        }
    }
    _orElse() {
        const tokens = this._getCurrentWhereTokens();
        if (!tokens && !tokens.length) {
            return;
        }
        if (tokens[tokens.length - 1] instanceof QueryOperatorToken_1.QueryOperatorToken) {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Cannot add OR, previous token was already an operator token.");
        }
        tokens.push(QueryOperatorToken_1.QueryOperatorToken.OR);
    }
    _boost(boost) {
        if (boost === 1.0) {
            return;
        }
        if (boost < 0.0) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Boost factor must be a non-negative number");
        }
        const tokens = this._getCurrentWhereTokens();
        let last = tokens.length ? tokens[tokens.length - 1] : null;
        if (last instanceof WhereToken_1.WhereToken) {
            last.options.boost = boost;
        }
        else if (last instanceof CloseSubclauseToken_1.CloseSubclauseToken) {
            const parameter = this._addQueryParameter(boost);
            const close = last;
            let index = tokens.indexOf(last);
            while (last && index > 0) {
                index--;
                last = tokens[index];
                if (last instanceof OpenSubclauseToken_1.OpenSubclauseToken) {
                    last.boostParameterName = parameter;
                    close.boostParameterName = parameter;
                    return;
                }
            }
        }
        else {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Cannot apply boost");
        }
    }
    _fuzzy(fuzzy) {
        const tokens = this._getCurrentWhereTokens();
        if (!tokens && !tokens.length) {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Fuzzy can only be used right after where clause.");
        }
        const whereToken = tokens[tokens.length - 1];
        if (!(whereToken instanceof WhereToken_1.WhereToken)) {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Fuzzy can only be used right after where clause.");
        }
        if (whereToken.whereOperator !== "Equals") {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Fuzzy can only be used right after where clause with equals operator");
        }
        if (fuzzy < 0.0 || fuzzy > 1.0) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Fuzzy distance must be between 0.0 and 1.0.");
        }
        whereToken.options.fuzzy = fuzzy;
    }
    _proximity(proximity) {
        const tokens = this._getCurrentWhereTokens();
        if (!tokens && !tokens.length) {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Proximity can only be used right after search clause.");
        }
        const whereToken = tokens[tokens.length - 1];
        if (!(whereToken instanceof WhereToken_1.WhereToken)) {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Proximity can only be used right after search clause.");
        }
        if (whereToken.whereOperator !== "Search") {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Fuzzy can only be used right after where clause with equals operator");
        }
        if (proximity < 1) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Proximity distance must be a positive number.");
        }
        whereToken.options.proximity = proximity;
    }
    _orderBy(field, orderingOrOptions = "String") {
        if (TypeUtil_1.TypeUtil.isString(orderingOrOptions)) {
            this._assertNoRawQuery();
            const f = this._ensureValidFieldName(field, false);
            this._orderByTokens.push(OrderByToken_1.OrderByToken.createAscending(f, { ordering: orderingOrOptions }));
        }
        else {
            const sorterName = orderingOrOptions.sorterName;
            if (StringUtil_1.StringUtil.isNullOrEmpty(sorterName)) {
                (0, Exceptions_1.throwError)("InvalidArgumentException", "SorterName cannot be null or empty");
            }
            this._assertNoRawQuery();
            const f = this._ensureValidFieldName(field, false);
            this._orderByTokens.push(OrderByToken_1.OrderByToken.createAscending(f, orderingOrOptions));
        }
    }
    _orderByDescending(field, orderingOrOptions = "String") {
        if (TypeUtil_1.TypeUtil.isString(orderingOrOptions)) {
            this._assertNoRawQuery();
            const f = this._ensureValidFieldName(field, false);
            this._orderByTokens.push(OrderByToken_1.OrderByToken.createDescending(f, { ordering: orderingOrOptions }));
        }
        else {
            const sorterName = orderingOrOptions.sorterName;
            if (StringUtil_1.StringUtil.isNullOrEmpty(sorterName)) {
                (0, Exceptions_1.throwError)("InvalidArgumentException", "SorterName cannot be null or empty");
            }
            this._assertNoRawQuery();
            const f = this._ensureValidFieldName(field, false);
            this._orderByTokens.push(OrderByToken_1.OrderByToken.createDescending(f, orderingOrOptions));
        }
    }
    _orderByScore() {
        this._assertNoRawQuery();
        this._orderByTokens.push(OrderByToken_1.OrderByToken.scoreAscending);
    }
    _orderByScoreDescending() {
        this._assertNoRawQuery();
        this._orderByTokens.push(OrderByToken_1.OrderByToken.scoreDescending);
    }
    _statistics(statsCallback) {
        statsCallback(this._queryStats);
    }
    _generateIndexQuery(query) {
        const indexQuery = new IndexQuery_1.IndexQuery();
        indexQuery.query = query;
        indexQuery.start = this._start;
        indexQuery.waitForNonStaleResults = this._theWaitForNonStaleResults;
        indexQuery.waitForNonStaleResultsTimeout = this._timeout;
        indexQuery.queryParameters = this._queryParameters;
        indexQuery.disableCaching = this._disableCaching;
        indexQuery.projectionBehavior = this.projectionBehavior;
        if (this._pageSize) {
            indexQuery.pageSize = this._pageSize;
        }
        return indexQuery;
    }
    _search(fieldName, searchTerms, operator = "OR") {
        const tokens = this._getCurrentWhereTokens();
        this._appendOperatorIfNeeded(tokens);
        fieldName = this._ensureValidFieldName(fieldName, false);
        this._negateIfNeeded(tokens, fieldName);
        const whereToken = WhereToken_1.WhereToken.create("Search", fieldName, this._addQueryParameter(searchTerms), new WhereToken_1.WhereOptions({ search: operator }));
        tokens.push(whereToken);
    }
    toString(compatibilityMode = false) {
        if (this._queryRaw) {
            return this._queryRaw;
        }
        if (this._currentClauseDepth) {
            (0, Exceptions_1.throwError)("InvalidOperationException", "A clause was not closed correctly within this query, current clause depth = "
                + this._currentClauseDepth);
        }
        const queryText = new StringBuilder_1.StringBuilder();
        this._buildDeclare(queryText);
        if (this._graphRawQuery) {
            this._buildWith(queryText);
            this._buildGraphQuery(queryText);
        }
        else {
            this._buildFrom(queryText);
        }
        this._buildGroupBy(queryText);
        this._buildWhere(queryText);
        this._buildOrderBy(queryText);
        this._buildLoad(queryText);
        this._buildSelect(queryText);
        this._buildInclude(queryText);
        if (!compatibilityMode) {
            this._buildPagination(queryText);
        }
        return queryText.toString();
    }
    _buildGraphQuery(queryText) {
        this._graphRawQuery.writeTo(queryText);
    }
    _buildWith(queryText) {
        for (const withToken of this._withTokens) {
            withToken.writeTo(queryText);
            queryText.append(os.EOL);
        }
    }
    _buildPagination(queryText) {
        if (this._start > 0 || !TypeUtil_1.TypeUtil.isNullOrUndefined(this._pageSize)) {
            queryText
                .append(" limit $")
                .append(this._addQueryParameter(this._start))
                .append(", $")
                .append(this._addQueryParameter(this._pageSize));
        }
    }
    _buildInclude(queryText) {
        if (!this._documentIncludes.size
            && !this._highlightingTokens.length
            && !this._explanationToken
            && !this._queryTimings
            && !this._counterIncludesTokens
            && !this._revisionsIncludesTokens
            && !this._timeSeriesIncludesTokens
            && !this._compareExchangeValueIncludesTokens) {
            return;
        }
        queryText.append(" include ");
        const firstRef = {
            value: true
        };
        for (const include of this._documentIncludes) {
            if (!firstRef.value) {
                queryText.append(",");
            }
            firstRef.value = false;
            let escapedInclude;
            if (IncludesUtil_1.IncludesUtil.requiresQuotes(include, x => escapedInclude = x)) {
                queryText.append("'");
                queryText.append(escapedInclude);
                queryText.append("'");
            }
            else {
                queryText.append(include);
            }
        }
        this._writeIncludeTokens(this._counterIncludesTokens, firstRef, queryText);
        this._writeIncludeTokens(this._timeSeriesIncludesTokens, firstRef, queryText);
        this._writeIncludeTokens(this._revisionsIncludesTokens, firstRef, queryText);
        this._writeIncludeTokens(this._compareExchangeValueIncludesTokens, firstRef, queryText);
        this._writeIncludeTokens(this._highlightingTokens, firstRef, queryText);
        if (this._explanationToken) {
            if (!firstRef.value) {
                queryText.append(",");
            }
            firstRef.value = false;
            this._explanationToken.writeTo(queryText);
        }
        if (this._queryTimings) {
            if (!firstRef.value) {
                queryText.append(",");
            }
            firstRef.value = false;
            TimingsToken_1.TimingsToken.instance.writeTo(queryText);
        }
    }
    _writeIncludeTokens(tokens, firstRef, queryText) {
        if (!tokens) {
            return;
        }
        for (const token of tokens) {
            if (!firstRef.value) {
                queryText.append(",");
            }
            firstRef.value = false;
            token.writeTo(queryText);
        }
    }
    _intersect() {
        const tokens = this._getCurrentWhereTokens();
        if (tokens.length > 0) {
            const last = tokens[tokens.length - 1];
            if (last instanceof WhereToken_1.WhereToken || last instanceof CloseSubclauseToken_1.CloseSubclauseToken) {
                this._isIntersect = true;
                tokens.push(IntersectMarkerToken_1.IntersectMarkerToken.INSTANCE);
                return;
            }
        }
        (0, Exceptions_1.throwError)("InvalidOperationException", "Cannot add INTERSECT at this point.");
    }
    _whereExists(fieldName) {
        fieldName = this._ensureValidFieldName(fieldName, false);
        const tokens = this._getCurrentWhereTokens();
        this._appendOperatorIfNeeded(tokens);
        this._negateIfNeeded(tokens, null);
        tokens.push(WhereToken_1.WhereToken.create("Exists", fieldName, null));
    }
    _containsAny(fieldName, values) {
        fieldName = this._ensureValidFieldName(fieldName, false);
        const tokens = this._getCurrentWhereTokens();
        this._appendOperatorIfNeeded(tokens);
        this._negateIfNeeded(tokens, fieldName);
        const array = this._transformCollection(fieldName, AbstractDocumentQuery._unpackCollection(values));
        const whereToken = WhereToken_1.WhereToken.create("In", fieldName, this._addQueryParameter(array), new WhereToken_1.WhereOptions({ exact: false }));
        tokens.push(whereToken);
    }
    _containsAll(fieldName, values) {
        fieldName = this._ensureValidFieldName(fieldName, false);
        const tokens = this._getCurrentWhereTokens();
        this._appendOperatorIfNeeded(tokens);
        this._negateIfNeeded(tokens, fieldName);
        const array = this._transformCollection(fieldName, AbstractDocumentQuery._unpackCollection(values));
        if (!array.length) {
            tokens.push(TrueToken_1.TrueToken.INSTANCE);
            return;
        }
        const whereToken = WhereToken_1.WhereToken.create("AllIn", fieldName, this._addQueryParameter(array));
        tokens.push(whereToken);
    }
    addRootType(clazz) {
        this._rootTypes.add(clazz);
    }
    _distinct() {
        if (this.isDistinct) {
            (0, Exceptions_1.throwError)("InvalidOperationException", "This is already a distinct query.");
        }
        if (!this._selectTokens.length) {
            this._selectTokens.push(DistinctToken_1.DistinctToken.INSTANCE);
        }
        else {
            this._selectTokens.unshift(DistinctToken_1.DistinctToken.INSTANCE);
        }
    }
    _updateStatsAndHighlightingsAndExplanations(queryResult) {
        this._queryStats.updateQueryStats(queryResult);
        this._queryHighlightings.update(queryResult);
        if (this._explanations) {
            this._explanations.update(queryResult);
        }
        if (this._queryTimings) {
            this._queryTimings.update(queryResult);
        }
    }
    _buildSelect(writer) {
        if (!this._selectTokens || !this._selectTokens.length) {
            return;
        }
        writer.append(" select ");
        if (this._selectTokens.length === 1 && this._selectTokens[0] instanceof DistinctToken_1.DistinctToken) {
            this._selectTokens[0].writeTo(writer);
            writer.append(" *");
            return;
        }
        for (let i = 0; i < this._selectTokens.length; i++) {
            const token = this._selectTokens[i];
            if (i > 0 && !(this._selectTokens[i - 1] instanceof DistinctToken_1.DistinctToken)) {
                writer.append(",");
            }
            DocumentQueryHelper_1.DocumentQueryHelper.addSpaceIfNeeded(i > 0 ? this._selectTokens[i - 1] : null, token, writer);
            token.writeTo(writer);
        }
    }
    _buildFrom(writer) {
        this._fromToken.writeTo(writer);
    }
    _buildDeclare(writer) {
        if (!this._declareTokens) {
            return;
        }
        for (const token of this._declareTokens) {
            token.writeTo(writer);
        }
    }
    _buildLoad(writer) {
        if (!this._loadTokens || !this._loadTokens.length) {
            return;
        }
        writer.append(" load ");
        for (let i = 0; i < this._loadTokens.length; i++) {
            if (i !== 0) {
                writer.append(", ");
            }
            this._loadTokens[i].writeTo(writer);
        }
    }
    _buildWhere(writer) {
        if (!this._whereTokens || !this._whereTokens.length) {
            return;
        }
        writer
            .append(" where ");
        if (this._isIntersect) {
            writer
                .append("intersect(");
        }
        for (let i = 0; i < this._whereTokens.length; i++) {
            DocumentQueryHelper_1.DocumentQueryHelper.addSpaceIfNeeded(i > 0 ? this._whereTokens[i - 1] : null, this._whereTokens[i], writer);
            this._whereTokens[i].writeTo(writer);
        }
        if (this._isIntersect) {
            writer.append(") ");
        }
    }
    _buildGroupBy(writer) {
        if (!this._groupByTokens || !this._groupByTokens.length) {
            return;
        }
        writer
            .append(" group by ");
        let isFirst = true;
        for (const token of this._groupByTokens) {
            if (!isFirst) {
                writer.append(", ");
            }
            token.writeTo(writer);
            isFirst = false;
        }
    }
    _buildOrderBy(writer) {
        if (!this._orderByTokens || !this._orderByTokens.length) {
            return;
        }
        writer
            .append(" order by ");
        let isFirst = true;
        for (const token of this._orderByTokens) {
            if (!isFirst) {
                writer.append(", ");
            }
            token.writeTo(writer);
            isFirst = false;
        }
    }
    static _unpackCollection(items) {
        const results = [];
        for (const item of items) {
            if (Array.isArray(item)) {
                results.push(...AbstractDocumentQuery._unpackCollection(item));
            }
            else {
                results.push(item);
            }
        }
        return results;
    }
    queryOperation() {
        return this._queryOperation;
    }
    _noTracking() {
        this._disableEntitiesTracking = true;
    }
    _noCaching() {
        this._disableCaching = true;
    }
    _includeTimings(timingsCallback) {
        if (this._queryTimings) {
            timingsCallback(this._queryTimings);
            return;
        }
        this._queryTimings = new QueryTimings_1.QueryTimings();
        timingsCallback(this._queryTimings);
    }
    _highlight(parameters, highlightingsCallback) {
        highlightingsCallback(this._queryHighlightings.add(parameters.fieldName));
        const optionsParameterName = parameters
            ? this._addQueryParameter((0, HighlightingOptions_1.extractHighlightingOptionsFromParameters)(parameters))
            : null;
        const token = HighlightingToken_1.HighlightingToken.create(parameters.fieldName, parameters.fragmentLength, parameters.fragmentCount, optionsParameterName);
        this._highlightingTokens.push(token);
    }
    _withinRadiusOf(fieldName, radius, latitude, longitude, radiusUnits, distErrorPercent) {
        fieldName = this._ensureValidFieldName(fieldName, false);
        const tokens = this._getCurrentWhereTokens();
        this._appendOperatorIfNeeded(tokens);
        this._negateIfNeeded(tokens, fieldName);
        const whereToken = WhereToken_1.WhereToken.create("SpatialWithin", fieldName, null, new WhereToken_1.WhereOptions({
            shape: ShapeToken_1.ShapeToken.circle(this._addQueryParameter(radius), this._addQueryParameter(latitude), this._addQueryParameter(longitude), radiusUnits),
            distance: distErrorPercent
        }));
        tokens.push(whereToken);
    }
    _spatialByShapeWkt(fieldName, shapeWkt, relation, units, distErrorPercent) {
        fieldName = this._ensureValidFieldName(fieldName, false);
        const tokens = this._getCurrentWhereTokens();
        this._appendOperatorIfNeeded(tokens);
        this._negateIfNeeded(tokens, fieldName);
        const wktToken = ShapeToken_1.ShapeToken.wkt(this._addQueryParameter(shapeWkt), units);
        let whereOperator;
        switch (relation) {
            case "Within":
                whereOperator = "SpatialWithin";
                break;
            case "Contains":
                whereOperator = "SpatialContains";
                break;
            case "Disjoint":
                whereOperator = "SpatialDisjoint";
                break;
            case "Intersects":
                whereOperator = "SpatialIntersects";
                break;
            default:
                (0, Exceptions_1.throwError)("InvalidArgumentException", `relation: ${relation}.`);
        }
        tokens.push(WhereToken_1.WhereToken.create(whereOperator, fieldName, null, new WhereToken_1.WhereOptions({
            shape: wktToken,
            distance: distErrorPercent
        })));
    }
    _spatial(fieldNameOrDynamicSpatialField, criteria) {
        let tokens;
        if (typeof (fieldNameOrDynamicSpatialField) === "string") {
            const fieldName = this._ensureValidFieldName(fieldNameOrDynamicSpatialField, false);
            tokens = this._getCurrentWhereTokens();
            this._appendOperatorIfNeeded(tokens);
            this._negateIfNeeded(tokens, fieldName);
            tokens.push(criteria.toQueryToken(fieldName, (o) => this._addQueryParameter(o)));
            return;
        }
        const dynamicField = fieldNameOrDynamicSpatialField;
        this._assertIsDynamicQuery(dynamicField, "spatial");
        tokens = this._getCurrentWhereTokens();
        this._appendOperatorIfNeeded(tokens);
        this._negateIfNeeded(tokens, null);
        tokens.push(criteria.toQueryToken(dynamicField.toField((fName, isNestedPath) => this._ensureValidFieldName(fName, isNestedPath)), (o) => this._addQueryParameter(o)));
    }
    _orderByDistance(fieldNameOrField, shapeWktOrLatitude, longitudeOrRoundFactor, roundFactor) {
        if (TypeUtil_1.TypeUtil.isString(fieldNameOrField)) {
            if (TypeUtil_1.TypeUtil.isString(shapeWktOrLatitude)) {
                const roundFactorParameterName = longitudeOrRoundFactor ? this._addQueryParameter(longitudeOrRoundFactor) : null;
                this._orderByTokens.push(OrderByToken_1.OrderByToken.createDistanceAscending(fieldNameOrField, this._addQueryParameter(shapeWktOrLatitude), roundFactorParameterName));
            }
            else {
                const roundFactorParameterName = roundFactor ? this._addQueryParameter(roundFactor) : null;
                this._orderByTokens.push(OrderByToken_1.OrderByToken.createDistanceAscending(fieldNameOrField, this._addQueryParameter(shapeWktOrLatitude), this._addQueryParameter(longitudeOrRoundFactor), roundFactorParameterName));
            }
            return;
        }
        const field = fieldNameOrField;
        this._assertIsDynamicQuery(field, "orderByDistance");
        if (!fieldNameOrField) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Field cannot be null.");
        }
        if (TypeUtil_1.TypeUtil.isString(shapeWktOrLatitude)) {
            this._orderByDistance("'" + field.toField((f, isNestedPath) => this._ensureValidFieldName(f, isNestedPath)) + "'", shapeWktOrLatitude);
        }
        else {
            this._orderByDistance("'" + field.toField((f, isNestedPath) => this._ensureValidFieldName(f, isNestedPath)) + "'", shapeWktOrLatitude, longitudeOrRoundFactor, field.roundFactor);
        }
    }
    _orderByDistanceDescending(fieldNameOrField, shapeWktOrLatitude, longitudeOrRoundFactor, roundFactor) {
        if (TypeUtil_1.TypeUtil.isString(fieldNameOrField)) {
            if (TypeUtil_1.TypeUtil.isString(shapeWktOrLatitude)) {
                const roundFactorParameterName = longitudeOrRoundFactor ? this._addQueryParameter(longitudeOrRoundFactor) : null;
                this._orderByTokens.push(OrderByToken_1.OrderByToken.createDistanceDescending(fieldNameOrField, this._addQueryParameter(shapeWktOrLatitude), roundFactorParameterName));
            }
            else {
                const roundFactorParameterName = roundFactor ? this._addQueryParameter(roundFactor) : null;
                this._orderByTokens.push(OrderByToken_1.OrderByToken.createDistanceDescending(fieldNameOrField, this._addQueryParameter(shapeWktOrLatitude), this._addQueryParameter(longitudeOrRoundFactor), roundFactorParameterName));
            }
            return;
        }
        const field = fieldNameOrField;
        this._assertIsDynamicQuery(field, "orderByDistance");
        if (!fieldNameOrField) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Field cannot be null.");
        }
        if (TypeUtil_1.TypeUtil.isString(shapeWktOrLatitude)) {
            this._orderByDistanceDescending("'" + field.toField((f, isNestedPath) => this._ensureValidFieldName(f, isNestedPath)) + "'", shapeWktOrLatitude);
        }
        else {
            this._orderByDistanceDescending("'" + field.toField((f, isNestedPath) => this._ensureValidFieldName(f, isNestedPath)) + "'", shapeWktOrLatitude, longitudeOrRoundFactor, field.roundFactor);
        }
    }
    _assertIsDynamicQuery(dynamicField, methodName) {
        if (!this._fromToken.isDynamic) {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Cannot execute query method '" + methodName +
                "'. Field '" + dynamicField.toField(this._ensureValidFieldName) +
                "' cannot be used when static index '" +
                this._fromToken.indexName + "' is queried. " +
                "Dynamic spatial fields can only be used with dynamic queries, " +
                " for static index queries please use valid spatial fields defined in index definition.");
        }
    }
    _initSync() {
        if (this._queryOperation) {
            return Promise.resolve();
        }
        this._queryOperation = this.initializeQueryOperation();
        return this._executeActualQuery();
    }
    _executeActualQuery() {
        return __awaiter(this, void 0, void 0, function* () {
            const command = this._queryOperation.createRequest();
            yield this._theSession.requestExecutor.execute(command, this._theSession.sessionInfo);
            this._queryOperation.setResult(command.result);
            this.emit("afterQueryExecuted", this._queryOperation.getCurrentQueryResults());
        });
    }
    iterator() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._initSync();
            const results = this._queryOperation.complete(this._clazz);
            return results[Symbol.iterator]();
        });
    }
    all() {
        return __awaiter(this, void 0, void 0, function* () {
            const results = yield this.iterator();
            return [...results];
        });
    }
    getQueryResult() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._initSync();
            return this._queryOperation.getCurrentQueryResults().createSnapshot();
        });
    }
    first() {
        return __awaiter(this, void 0, void 0, function* () {
            const entries = yield this._executeQueryOperation(1);
            if (entries.length === 0) {
                (0, Exceptions_1.throwError)("InvalidOperationException", "Expected at least one result.");
            }
            return entries[0];
        });
    }
    firstOrNull() {
        return __awaiter(this, void 0, void 0, function* () {
            const entries = yield this._executeQueryOperation(1);
            return entries[0] || null;
        });
    }
    single() {
        return __awaiter(this, void 0, void 0, function* () {
            const entries = yield this._executeQueryOperation(2);
            if (entries.length !== 1) {
                (0, Exceptions_1.throwError)("InvalidOperationException", `Expected single result, but got ${entries.length ? "more than that" : 0}.`);
            }
            return entries[0];
        });
    }
    singleOrNull() {
        return __awaiter(this, void 0, void 0, function* () {
            const entries = yield this._executeQueryOperation(2);
            if (entries.length === 2) {
                (0, Exceptions_1.throwError)("InvalidOperationException", `Expected single result, but got more than that.`);
            }
            return entries.length === 1 ? entries[0] : null;
        });
    }
    count() {
        return __awaiter(this, void 0, void 0, function* () {
            this._take(0);
            const queryResult = yield this.getQueryResult();
            return queryResult.totalResults;
        });
    }
    _executeQueryOperation(take) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._executeQueryOperationInternal(take);
            return this.queryOperation().complete(this._clazz);
        });
    }
    _executeQueryOperationInternal(take) {
        return __awaiter(this, void 0, void 0, function* () {
            if ((take || take === 0) && (!this._pageSize || this._pageSize > take)) {
                this._take(take);
            }
            yield this._initSync();
        });
    }
    longCount() {
        return __awaiter(this, void 0, void 0, function* () {
            this._take(0);
            const queryResult = yield this.getQueryResult();
            return queryResult.longTotalResults;
        });
    }
    any() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isDistinct) {
                const result = yield this._executeQueryOperation(1);
                return !!result[0];
            }
            this._take(0);
            const queryResult = yield this.getQueryResult();
            return queryResult.totalResults > 0;
        });
    }
    _aggregateBy(facet) {
        for (const token of this._selectTokens) {
            if (token instanceof FacetToken_1.FacetToken) {
                continue;
            }
            (0, Exceptions_1.throwError)("InvalidOperationException", "Aggregation query can select only facets while it got " + token.constructor.name + " token");
        }
        const facetToken = FacetToken_1.FacetToken.create(facet, (val) => this._addQueryParameter(val));
        this._selectTokens.push(facetToken);
    }
    _aggregateUsing(facetSetupDocumentId) {
        this._selectTokens.push(FacetToken_1.FacetToken.create(facetSetupDocumentId));
    }
    lazily() {
        const lazyQueryOperation = this._getLazyQueryOperation();
        return this._theSession
            .addLazyOperation(lazyQueryOperation);
    }
    countLazily() {
        if (!this._queryOperation) {
            this._take(0);
            this._queryOperation = this.initializeQueryOperation();
        }
        const clazz = this._conventions.getJsTypeByDocumentType(this._clazz);
        const lazyQueryOperation = new LazyQueryOperation_1.LazyQueryOperation(this._theSession, this._queryOperation, this, clazz);
        return this._theSession.addLazyCountOperation(lazyQueryOperation);
    }
    _suggestUsing(suggestion) {
        if (!suggestion) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "suggestion cannot be null");
        }
        this._assertCanSuggest(suggestion);
        let token = null;
        if (suggestion instanceof SuggestionWithTerm_1.SuggestionWithTerm) {
            const term = suggestion;
            token = SuggestToken_1.SuggestToken.create(term.field, term.displayField, this._addQueryParameter(term.term), this._getOptionsParameterName(term.options));
        }
        else if (suggestion instanceof SuggestionWithTerms_1.SuggestionWithTerms) {
            const terms = suggestion;
            token = SuggestToken_1.SuggestToken.create(terms.field, terms.displayField, this._addQueryParameter(terms.terms), this._getOptionsParameterName(terms.options));
        }
        else {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Unknown type of suggestion: " + suggestion);
        }
        this._selectTokens.push(token);
    }
    _getOptionsParameterName(options) {
        let optionsParameterName = null;
        if (options) {
            optionsParameterName = this._addQueryParameter(options);
        }
        return optionsParameterName;
    }
    _assertCanSuggest(suggestion) {
        if (this._whereTokens.length) {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Cannot add suggest when WHERE statements are present.");
        }
        if (this._selectTokens.length) {
            const lastToken = this._selectTokens[this._selectTokens.length - 1];
            if (lastToken instanceof SuggestToken_1.SuggestToken) {
                if (lastToken.fieldName === suggestion.field) {
                    (0, Exceptions_1.throwError)("InvalidOperationException", "Cannot add suggest for the same field again.");
                }
            }
            else {
                (0, Exceptions_1.throwError)("InvalidOperationException", "Cannot add suggest when SELECT statements are present.");
            }
        }
        if (this._orderByTokens.length) {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Cannot add suggest when ORDER BY statements are present.");
        }
    }
    _includeExplanations(options, explanationsCallback) {
        if (this._explanationToken) {
            (0, Exceptions_1.throwError)("InvalidOperationException", "Duplicate IncludeExplanations method calls are forbidden.");
        }
        const optionsParameterName = options
            ? this._addQueryParameter(options)
            : null;
        this._explanationToken = ExplanationToken_1.ExplanationToken.create(optionsParameterName);
        this._explanations = new Explanations_1.Explanations();
        explanationsCallback(this._explanations);
    }
    _includeCounters(alias, counterToIncludeByDocId) {
        if (!counterToIncludeByDocId || !counterToIncludeByDocId.size) {
            return;
        }
        this._counterIncludesTokens = [];
        this._includesAlias = alias;
        for (const [key, val] of counterToIncludeByDocId.entries()) {
            if (val[0]) {
                this._counterIncludesTokens.push(CounterIncludesToken_1.CounterIncludesToken.all(key));
                continue;
            }
            const valArr = [...val[1]];
            if (!valArr || !valArr.length) {
                continue;
            }
            for (const name of val[1]) {
                this._counterIncludesTokens.push(CounterIncludesToken_1.CounterIncludesToken.create(key, name));
            }
        }
    }
    _includeTimeSeries(alias, timeSeriesToInclude) {
        if (!timeSeriesToInclude || !timeSeriesToInclude.size) {
            return;
        }
        this._timeSeriesIncludesTokens = [];
        if (!this._includesAlias) {
            this._includesAlias = alias;
        }
        for (const kvp of timeSeriesToInclude.entries()) {
            for (const range of kvp[1].values()) {
                this._timeSeriesIncludesTokens.push(TimeSeriesIncludesToken_1.TimeSeriesIncludesToken.create(kvp[0], range));
            }
        }
    }
    getQueryType() {
        return this._clazz;
    }
    getGraphRawQuery() {
        return this._graphRawQuery;
    }
    addFromAliasToWhereTokens(fromAlias) {
        if (!fromAlias) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Alias cannot be null or empty.");
        }
        const tokens = this._getCurrentWhereTokens();
        for (const token of tokens) {
            if (token instanceof WhereToken_1.WhereToken) {
                token.addAlias(fromAlias);
            }
        }
    }
    addAliasToIncludesTokens(fromAlias) {
        if (!this._includesAlias) {
            return fromAlias;
        }
        if (!fromAlias) {
            fromAlias = this._includesAlias;
            this.addFromAliasToWhereTokens(fromAlias);
        }
        if (this._counterIncludesTokens) {
            for (const counterIncludesToken of this._counterIncludesTokens) {
                counterIncludesToken.addAliasToPath(fromAlias);
            }
        }
        if (this._timeSeriesIncludesTokens) {
            for (const token of this._timeSeriesIncludesTokens) {
                token.addAliasToPath(fromAlias);
            }
        }
        return fromAlias;
    }
    _includeRevisionsByDate(dateTime) {
        if (!this._revisionsIncludesTokens) {
            this._revisionsIncludesTokens = [];
        }
        this._revisionsIncludesTokens.push(RevisionIncludesToken_1.RevisionIncludesToken.createForDate(dateTime));
    }
    _includeRevisionsByChangeVector(revisionsToIncludeByChangeVector) {
        if (!this._revisionsIncludesTokens) {
            this._revisionsIncludesTokens = [];
        }
        for (const changeVector of revisionsToIncludeByChangeVector) {
            this._revisionsIncludesTokens.push(RevisionIncludesToken_1.RevisionIncludesToken.createForPath(changeVector));
        }
    }
    get parameterPrefix() {
        return this._parameterPrefix;
    }
    set parameterPrefix(prefix) {
        this._parameterPrefix = prefix;
    }
}
exports.AbstractDocumentQuery = AbstractDocumentQuery;
