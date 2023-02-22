"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseConnectionState = void 0;
const events_1 = require("events");
const Exceptions_1 = require("../../Exceptions");
const PromiseUtil = require("../../Utility/PromiseUtil");
const TypeUtil_1 = require("../../Utility/TypeUtil");
class DatabaseConnectionState {
    constructor(onConnect, onDisconnect) {
        this._emitter = new events_1.EventEmitter();
        this._value = 0;
        this.onConnect = onConnect;
        this._onDisconnect = onDisconnect;
        this._value = 0;
        this._emitter.setMaxListeners(50);
        this._firstSet = PromiseUtil.defer();
    }
    addOnError(handler) {
        this._emitter.addListener(DatabaseConnectionState.ERROR_EVENT, handler);
    }
    removeOnError(handler) {
        this._emitter.removeListener(DatabaseConnectionState.ERROR_EVENT, handler);
    }
    set(connection) {
        if (!this._firstSet.promise.isFulfilled()) {
            connection
                .then(() => {
                this._firstSet.resolve(undefined);
            })
                .catch(error => {
                this._firstSet.reject(error);
            });
        }
        else {
            connection.catch(TypeUtil_1.TypeUtil.NOOP);
        }
        this._connected = connection;
    }
    inc() {
        this._value++;
    }
    dec() {
        this._value--;
        if (!this._value) {
            this.set(this._onDisconnect());
        }
    }
    error(e) {
        this.set(Promise.reject(e));
        this.lastError = e;
        this._emitter.emit(DatabaseConnectionState.ERROR_EVENT, e);
    }
    ensureSubscribedNow() {
        return this._connected || Promise.resolve(this._firstSet.promise);
    }
    dispose() {
        this.set(Promise.reject((0, Exceptions_1.getError)("InvalidOperationException", "Object was disposed")));
        this._emitter.removeAllListeners("Document");
        this._emitter.removeAllListeners("Index");
        this._emitter.removeAllListeners("Operation");
        this._emitter.removeAllListeners("Counter");
        this._emitter.removeAllListeners("TimeSeries");
        this._emitter.removeAllListeners(DatabaseConnectionState.ERROR_EVENT);
    }
    addOnChangeNotification(type, handler) {
        this._emitter.addListener(type, handler);
    }
    removeOnChangeNotification(type, handler) {
        this._emitter.removeListener(type, handler);
    }
    send(type, change) {
        this._emitter.emit(type, change);
    }
}
exports.DatabaseConnectionState = DatabaseConnectionState;
DatabaseConnectionState.ERROR_EVENT = "error";