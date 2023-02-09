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
exports.PromiseStatusTracker = exports.AsyncTimeout = exports.timeout = exports.delay = exports.defer = exports.raceToResolution = void 0;
const BluebirdPromise = require("bluebird");
const Exceptions_1 = require("../Exceptions");
function raceToResolution(promises, onErrorCallback) {
    const indexPromises = promises.map((p, index) => p.catch(() => {
        throw index;
    }));
    return BluebirdPromise.race(indexPromises).catch(index => {
        const p = promises.splice(index, 1)[0];
        p.catch(err => {
            if (onErrorCallback) {
                onErrorCallback(err);
            }
        });
        return raceToResolution(promises);
    });
}
exports.raceToResolution = raceToResolution;
function defer() {
    let resolve;
    let reject;
    const promise = new BluebirdPromise(function (res, rej) {
        resolve = res;
        reject = rej;
    });
    return {
        resolve,
        reject,
        promise
    };
}
exports.defer = defer;
function delay(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(resolve => setTimeout(resolve, ms));
    });
}
exports.delay = delay;
function timeout(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(reject => setTimeout(() => reject((0, Exceptions_1.getError)("TimeoutException", `Timeout after ${ms} ms.`)), ms));
    });
}
exports.timeout = timeout;
class AsyncTimeout {
    constructor(ms, op) {
        this._timedOut = false;
        this._op = op;
        this._promise = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
        this._timer = setTimeout(() => {
            this._timedOut = true;
            this._reject(this._getTimeoutError(ms));
        }, ms);
    }
    get promise() {
        return this._promise;
    }
    get timedOut() {
        return this._timedOut;
    }
    _getTimeoutError(ms) {
        const opText = this._op ? `Operation '${this._op}'` : `Operation`;
        const timeoutError = (0, Exceptions_1.getError)("TimeoutError", `${opText} timed out after ${ms} ms.`);
        return timeoutError;
    }
    cancel() {
        if (this._timer) {
            clearTimeout(this._timer);
        }
        this._resolve();
    }
}
exports.AsyncTimeout = AsyncTimeout;
class PromiseStatusTracker {
    constructor(promise) {
        if (!promise) {
            throw new Error("Promise to track cannot be null.");
        }
        this._status = "PENDING";
        this._promise = promise;
        this._promise
            .then(() => this._status = "RESOLVED")
            .catch(() => this._status = "REJECTED");
    }
    static track(promise) {
        return new PromiseStatusTracker(promise);
    }
    isFullfilled() {
        return this._status === "REJECTED" || this._status === "RESOLVED";
    }
    isResolved() {
        return this._status === "RESOLVED";
    }
    isRejected() {
        return this._status === "REJECTED";
    }
}
exports.PromiseStatusTracker = PromiseStatusTracker;
