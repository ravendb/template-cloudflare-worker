"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacetAggregationToken = exports.FacetToken = void 0;
const QueryToken_1 = require("./QueryToken");
const index_1 = require("../../../Exceptions/index");
const StringUtil_1 = require("../../../Utility/StringUtil");
const Facet_1 = require("../../Queries/Facets/Facet");
const Facets_1 = require("../../Queries/Facets");
const GenericRangeFacet_1 = require("../../Queries/Facets/GenericRangeFacet");
const RangeFacet_1 = require("../../Queries/Facets/RangeFacet");
const QueryFieldUtil_1 = require("../../Queries/QueryFieldUtil");
class FacetToken extends QueryToken_1.QueryToken {
    constructor(opts) {
        super();
        if (!opts) {
            (0, index_1.throwError)("InvalidArgumentException", "FacetToken options cannot be null.");
        }
        if (opts.hasOwnProperty("facetSetupDocumentId")) {
            this._facetSetupDocumentId = opts.facetSetupDocumentId;
        }
        else if (opts.hasOwnProperty("aggregateByFieldName")
            || opts.hasOwnProperty("alias")) {
            this._aggregateByFieldName =
                opts.aggregateByFieldName;
            this._alias =
                opts.alias;
            this._ranges =
                opts.ranges;
            this._optionsParameterName =
                opts.optionsParameterName;
            this._aggregations = [];
        }
        else {
            (0, index_1.throwError)("InvalidArgumentException", "Invalid facet token arguments.");
        }
    }
    getName() {
        return this._alias || this._aggregateByFieldName;
    }
    static create(facetSetupDocumentIdOrFacet, addQueryParameter) {
        if (!facetSetupDocumentIdOrFacet) {
            (0, index_1.throwError)("InvalidArgumentException", "Need to supply either facetSetupDocumentId or a Facet instance.");
        }
        if (typeof facetSetupDocumentIdOrFacet === "string") {
            if (StringUtil_1.StringUtil.isNullOrWhitespace(facetSetupDocumentIdOrFacet)) {
                (0, index_1.throwError)("InvalidArgumentException", "facetSetupDocumentId cannot be null");
            }
            return new FacetToken({ facetSetupDocumentId: facetSetupDocumentIdOrFacet });
        }
        const facet = facetSetupDocumentIdOrFacet;
        if (facetSetupDocumentIdOrFacet instanceof Facet_1.Facet) {
            const optionsParameterName = FacetToken._getOptionsParameterName(facet, addQueryParameter);
            const token = new FacetToken({
                aggregateByFieldName: QueryFieldUtil_1.QueryFieldUtil.escapeIfNecessary(facet.fieldName),
                alias: QueryFieldUtil_1.QueryFieldUtil.escapeIfNecessary(facet.displayFieldName),
                optionsParameterName
            });
            FacetToken._applyAggregations(facet, token);
            return token;
        }
        if (facet instanceof RangeFacet_1.RangeFacet) {
            const optionsParameterName = FacetToken._getOptionsParameterName(facet, addQueryParameter);
            const token = new FacetToken({
                alias: QueryFieldUtil_1.QueryFieldUtil.escapeIfNecessary(facet.displayFieldName),
                ranges: facet.ranges,
                optionsParameterName
            });
            FacetToken._applyAggregations(facet, token);
            return token;
        }
        if (facet instanceof GenericRangeFacet_1.GenericRangeFacet) {
            const optionsParameterName = FacetToken._getOptionsParameterName(facet, addQueryParameter);
            const ranges = [];
            for (const rangeBuilder of facet.ranges) {
                ranges.push(GenericRangeFacet_1.GenericRangeFacet.parse(rangeBuilder, addQueryParameter));
            }
            const token = new FacetToken({
                alias: QueryFieldUtil_1.QueryFieldUtil.escapeIfNecessary(facet.displayFieldName),
                ranges,
                optionsParameterName
            });
            FacetToken._applyAggregations(facet, token);
            return token;
        }
        return facet.toFacetToken(addQueryParameter);
    }
    writeTo(writer) {
        writer.append("facet(");
        if (this._facetSetupDocumentId) {
            writer.append(`id('${this._facetSetupDocumentId}'))`);
            return;
        }
        let firstArgument = false;
        if (this._aggregateByFieldName) {
            writer.append(this._aggregateByFieldName);
        }
        else if (this._ranges) {
            let firstInRange = true;
            for (const range of this._ranges) {
                if (!firstInRange) {
                    writer.append(", ");
                }
                firstInRange = false;
                writer.append(range);
            }
        }
        else {
            firstArgument = true;
        }
        for (const aggregation of this._aggregations) {
            if (!firstArgument) {
                writer.append(", ");
            }
            firstArgument = false;
            aggregation.writeTo(writer);
        }
        if (this._optionsParameterName) {
            writer.append(`, $${this._optionsParameterName}`);
        }
        writer.append(")");
        if (!this._alias || this._alias === this._aggregateByFieldName) {
            return;
        }
        writer.append(` as ${this._alias}`);
    }
    static _applyAggregations(facet, token) {
        for (const [aggregationKey, aggregationValue] of facet.aggregations.entries()) {
            for (const value of aggregationValue) {
                let aggregationToken;
                switch (aggregationKey) {
                    case "Max":
                        aggregationToken = FacetAggregationToken.max(value.name, value.displayName);
                        break;
                    case "Min":
                        aggregationToken = FacetAggregationToken.min(value.name, value.displayName);
                        break;
                    case "Average":
                        aggregationToken = FacetAggregationToken.average(value.name, value.displayName);
                        break;
                    case "Sum":
                        aggregationToken = FacetAggregationToken.sum(value.name, value.displayName);
                        break;
                    default:
                        (0, index_1.throwError)("NotImplementedException", "Unsupported aggregation method: " + aggregationKey);
                }
                token._aggregations.push(aggregationToken);
            }
        }
    }
    static _getOptionsParameterName(facet, addQueryParameter) {
        return facet.options && facet.options !== Facets_1.FacetOptions.getDefaultOptions()
            ? addQueryParameter(facet.options)
            : null;
    }
}
exports.FacetToken = FacetToken;
class FacetAggregationToken extends QueryToken_1.QueryToken {
    constructor(fieldName, fieldDisplayName, aggregation) {
        super();
        this._fieldName = fieldName;
        this._fieldDisplayName = fieldDisplayName;
        this._aggregation = aggregation;
    }
    writeTo(writer) {
        switch (this._aggregation) {
            case "Max":
                writer
                    .append("max(")
                    .append(this._fieldName)
                    .append(")");
                break;
            case "Min":
                writer
                    .append("min(")
                    .append(this._fieldName)
                    .append(")");
                break;
            case "Average":
                writer
                    .append("avg(")
                    .append(this._fieldName)
                    .append(")");
                break;
            case "Sum":
                writer
                    .append("sum(")
                    .append(this._fieldName)
                    .append(")");
                break;
            default:
                (0, index_1.throwError)("InvalidArgumentException", "Invalid aggregation mode: " + this._aggregation);
        }
        if (StringUtil_1.StringUtil.isNullOrWhitespace(this._fieldDisplayName)) {
            return;
        }
        writer.append(" as ");
        QueryToken_1.QueryToken.writeField(writer, this._fieldDisplayName);
    }
    static max(fieldName, fieldDisplayName) {
        if (StringUtil_1.StringUtil.isNullOrWhitespace(fieldName)) {
            (0, index_1.throwError)("InvalidArgumentException", "FieldName can not be null");
        }
        return new FacetAggregationToken(fieldName, fieldDisplayName, "Max");
    }
    static min(fieldName, fieldDisplayName) {
        if (StringUtil_1.StringUtil.isNullOrWhitespace(fieldName)) {
            (0, index_1.throwError)("InvalidArgumentException", "FieldName can not be null");
        }
        return new FacetAggregationToken(fieldName, fieldDisplayName, "Min");
    }
    static average(fieldName, fieldDisplayName) {
        if (StringUtil_1.StringUtil.isNullOrWhitespace(fieldName)) {
            (0, index_1.throwError)("InvalidArgumentException", "FieldName can not be null");
        }
        return new FacetAggregationToken(fieldName, fieldDisplayName, "Average");
    }
    static sum(fieldName, fieldDisplayName) {
        if (StringUtil_1.StringUtil.isNullOrWhitespace(fieldName)) {
            (0, index_1.throwError)("InvalidArgumentException", "FieldName can not be null");
        }
        return new FacetAggregationToken(fieldName, fieldDisplayName, "Sum");
    }
}
exports.FacetAggregationToken = FacetAggregationToken;