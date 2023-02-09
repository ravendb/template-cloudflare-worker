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
exports.TimeSeriesOperations = void 0;
const TypeUtil_1 = require("../../Utility/TypeUtil");
const ConfigureTimeSeriesValueNamesOperation_1 = require("../Operations/TimeSeries/ConfigureTimeSeriesValueNamesOperation");
const Exceptions_1 = require("../../Exceptions");
const TimeSeriesPolicy_1 = require("../Operations/TimeSeries/TimeSeriesPolicy");
const ConfigureTimeSeriesPolicyOperation_1 = require("../Operations/TimeSeries/ConfigureTimeSeriesPolicyOperation");
const StringUtil_1 = require("../../Utility/StringUtil");
const RawTimeSeriesPolicy_1 = require("../Operations/TimeSeries/RawTimeSeriesPolicy");
const ConfigureRawTimeSeriesPolicyOperation_1 = require("../Operations/TimeSeries/ConfigureRawTimeSeriesPolicyOperation");
const RemoveTimeSeriesPolicyOperation_1 = require("../Operations/TimeSeries/RemoveTimeSeriesPolicyOperation");
const TimeSeriesValuesHelper_1 = require("../Session/TimeSeries/TimeSeriesValuesHelper");
class TimeSeriesOperations {
    constructor(store, database) {
        this._store = store;
        this._database = database || store.database;
        this._executor = this._store.maintenance.forDatabase(database);
    }
    register(collectionClassOrCollection, timeSeriesEntryClassOrName, nameOrValuesName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (TypeUtil_1.TypeUtil.isString(collectionClassOrCollection)) {
                return this._registerInternal(collectionClassOrCollection, timeSeriesEntryClassOrName, nameOrValuesName);
            }
            else {
                const collectionClass = collectionClassOrCollection;
                if (TypeUtil_1.TypeUtil.isString(timeSeriesEntryClassOrName)) {
                    const collection = this._store.conventions.findCollectionName(collectionClass);
                    yield this._registerInternal(collection, timeSeriesEntryClassOrName, nameOrValuesName);
                }
                else {
                    let name = nameOrValuesName;
                    if (!name) {
                        name = TimeSeriesOperations.getTimeSeriesName(timeSeriesEntryClassOrName, this._store.conventions);
                    }
                    const mapping = TimeSeriesValuesHelper_1.TimeSeriesValuesHelper.getFieldsMapping(timeSeriesEntryClassOrName);
                    if (!mapping) {
                        (0, Exceptions_1.throwError)("InvalidOperationException", TimeSeriesOperations.getTimeSeriesName(timeSeriesEntryClassOrName, this._store.conventions) + " must contain valid mapping");
                    }
                    const collection = this._store.conventions.findCollectionName(collectionClass);
                    const valueNames = mapping.map(x => x.name);
                    yield this._registerInternal(collection, name, valueNames);
                }
            }
        });
    }
    _registerInternal(collection, name, valueNames) {
        return __awaiter(this, void 0, void 0, function* () {
            const parameters = {
                collection,
                timeSeries: name,
                valueNames,
                update: true
            };
            const command = new ConfigureTimeSeriesValueNamesOperation_1.ConfigureTimeSeriesValueNamesOperation(parameters);
            yield this._executor.send(command);
        });
    }
    setPolicy(collectionNameOrClass, name, aggregation, retention) {
        return __awaiter(this, void 0, void 0, function* () {
            const collection = TypeUtil_1.TypeUtil.isString(collectionNameOrClass) ? collectionNameOrClass : this._store.conventions.findCollectionName(collectionNameOrClass);
            const p = new TimeSeriesPolicy_1.TimeSeriesPolicy(name, aggregation, retention);
            yield this._executor.send(new ConfigureTimeSeriesPolicyOperation_1.ConfigureTimeSeriesPolicyOperation(collection, p));
        });
    }
    setRawPolicy(collectionOrClass, retention) {
        return __awaiter(this, void 0, void 0, function* () {
            const collection = TypeUtil_1.TypeUtil.isString(collectionOrClass) ? collectionOrClass : this._store.conventions.findCollectionName(collectionOrClass);
            const p = new RawTimeSeriesPolicy_1.RawTimeSeriesPolicy(retention);
            yield this._executor.send(new ConfigureRawTimeSeriesPolicyOperation_1.ConfigureRawTimeSeriesPolicyOperation(collection, p));
        });
    }
    removePolicy(clazzOrCollection, name) {
        return __awaiter(this, void 0, void 0, function* () {
            const collection = TypeUtil_1.TypeUtil.isString(clazzOrCollection) ? clazzOrCollection : this._store.conventions.findCollectionName(clazzOrCollection);
            yield this._executor.send(new RemoveTimeSeriesPolicyOperation_1.RemoveTimeSeriesPolicyOperation(collection, name));
        });
    }
    static getTimeSeriesName(clazz, conventions) {
        return conventions.findCollectionName(clazz);
    }
    forDatabase(database) {
        if (StringUtil_1.StringUtil.equalsIgnoreCase(database, this._database)) {
            return this;
        }
        return new TimeSeriesOperations(this._store, database);
    }
}
exports.TimeSeriesOperations = TimeSeriesOperations;
