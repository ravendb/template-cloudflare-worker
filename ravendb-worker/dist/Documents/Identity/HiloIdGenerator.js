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
exports.HiloIdGenerator = void 0;
const DateUtil_1 = require("../../Utility/DateUtil");
const StringUtil_1 = require("../../Utility/StringUtil");
const HiloReturnCommand_1 = require("./Commands/HiloReturnCommand");
const NextHiloCommand_1 = require("./Commands/NextHiloCommand");
const HiloRangeValue_1 = require("./HiloRangeValue");
const Lazy_1 = require("../Lazy");
class HiloIdGenerator {
    constructor(tag, store, dbName, identityPartsSeparator) {
        this._prefix = null;
        this._lastBatchSize = 0;
        this._serverTag = null;
        this._lastRangeAt = DateUtil_1.DateUtil.zeroDate();
        this._range = new HiloRangeValue_1.HiloRangeValue();
        this._conventions = store.conventions;
        this._tag = tag;
        this._store = store;
        this._dbName = dbName;
        this._identityPartsSeparator = identityPartsSeparator;
    }
    generateDocumentId(entity) {
        return __awaiter(this, void 0, void 0, function* () {
            const nextId = yield this.nextId();
            return this._getDocumentIdFromId(nextId);
        });
    }
    _getDocumentIdFromId(nextId) {
        return this._prefix + nextId + "-" + this._serverTag;
    }
    nextId() {
        return __awaiter(this, void 0, void 0, function* () {
            while (true) {
                const current = this._nextRangeTask;
                const range = this._range;
                const id = range.increment();
                if (id <= range.maxId) {
                    return id;
                }
                try {
                    yield current.getValue();
                    if (range !== this._range) {
                        continue;
                    }
                }
                catch (e) {
                }
                const maybeNextTask = new Lazy_1.Lazy(() => this._getNextRange());
                let changed = false;
                if (this._nextRangeTask === current) {
                    changed = true;
                    this._nextRangeTask = maybeNextTask;
                }
                if (changed) {
                    yield maybeNextTask.getValue();
                    continue;
                }
                try {
                    yield this._nextRangeTask.getValue();
                }
                catch (e) {
                }
            }
        });
    }
    returnUnusedRange() {
        const range = this._range;
        const executor = this._store.getRequestExecutor(this._dbName);
        return executor.execute(new HiloReturnCommand_1.HiloReturnCommand(this._tag, range.current, range.maxId));
    }
    _getNextRange() {
        return __awaiter(this, void 0, void 0, function* () {
            const hiloCmd = new NextHiloCommand_1.NextHiloCommand(this._tag, this._lastBatchSize, this._lastRangeAt, this._identityPartsSeparator, this._range.maxId, this._store.conventions);
            yield this._store.getRequestExecutor(this._dbName).execute(hiloCmd);
            const result = hiloCmd.result;
            this._prefix = result.prefix;
            this._lastBatchSize = result.lastSize;
            this._serverTag = result.serverTag || null;
            this._lastRangeAt = result.lastRangeAt;
            this._range = new HiloRangeValue_1.HiloRangeValue(result.low, result.high);
        });
    }
    _assembleDocumentId(currentRangeValue) {
        const prefix = (this._prefix || "");
        const serverTag = this._serverTag;
        if (serverTag) {
            return StringUtil_1.StringUtil.format("{0}{1}-{2}", prefix, currentRangeValue, serverTag);
        }
        return StringUtil_1.StringUtil.format("{0}{1}", prefix, currentRangeValue);
    }
    get range() {
        return this._range;
    }
    set range(value) {
        this._range = value;
    }
}
exports.HiloIdGenerator = HiloIdGenerator;
