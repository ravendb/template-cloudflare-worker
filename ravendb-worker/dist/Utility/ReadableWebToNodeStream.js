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
exports.ReadableWebToNodeStream = void 0;
const readable_stream_1 = require("readable-stream");
class ReadableWebToNodeStream extends readable_stream_1.Readable {
    constructor(stream) {
        super();
        this.bytesRead = 0;
        this.released = false;
        this.reader = stream.getReader();
    }
    _read() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.released) {
                this.push(null);
                return;
            }
            this.pendingRead = this.reader.read();
            const data = yield this.pendingRead;
            delete this.pendingRead;
            if (data.done || this.released) {
                this.push(null);
            }
            else {
                this.bytesRead += data.value.length;
                this.push(data.value);
            }
        });
    }
    waitForReadToComplete() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.pendingRead) {
                yield this.pendingRead;
            }
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.syncAndRelease();
        });
    }
    syncAndRelease() {
        return __awaiter(this, void 0, void 0, function* () {
            this.released = true;
            yield this.waitForReadToComplete();
            yield this.reader.releaseLock();
        });
    }
}
exports.ReadableWebToNodeStream = ReadableWebToNodeStream;
