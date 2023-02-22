"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeSeriesPolicy = void 0;
const TimeValue_1 = require("../../../Primitives/TimeValue");
const StringUtil_1 = require("../../../Utility/StringUtil");
const Exceptions_1 = require("../../../Exceptions");
const RawTimeSeriesTypes_1 = require("./RawTimeSeriesTypes");
class TimeSeriesPolicy {
    constructor(name, aggregationTime, retentionTime) {
        retentionTime = retentionTime || TimeValue_1.TimeValue.MAX_VALUE;
        if (StringUtil_1.StringUtil.isNullOrEmpty(name)) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Name cannot be null or empty");
        }
        if (aggregationTime.compareTo(TimeValue_1.TimeValue.ZERO) <= 0) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Aggregation time must be greater than zero");
        }
        if (retentionTime.compareTo(TimeValue_1.TimeValue.ZERO) <= 0) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Retention time must be greater than zero");
        }
        this.retentionTime = retentionTime;
        this.aggregationTime = aggregationTime;
        this.name = name;
    }
    getTimeSeriesName(rawName) {
        return rawName + RawTimeSeriesTypes_1.TIME_SERIES_ROLLUP_SEPARATOR + this.name;
    }
    serialize() {
        return {
            Name: this.name,
            RetentionTime: this.retentionTime ? this.retentionTime.serialize() : null,
            AggregationTime: this.aggregationTime ? this.aggregationTime.serialize() : null
        };
    }
    static parse(policy) {
        return new TimeSeriesPolicy(policy.Name, TimeValue_1.TimeValue.parse(policy.AggregationTime), TimeValue_1.TimeValue.parse(policy.RetentionTime));
    }
}
exports.TimeSeriesPolicy = TimeSeriesPolicy;