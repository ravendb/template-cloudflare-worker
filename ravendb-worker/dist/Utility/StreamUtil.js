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
exports.printStreamTraffic = exports.stringToReadable = exports.bufferToReadable = exports.readToEnd = exports.readToBuffer = exports.reduceStreamToPromise = exports.pipelineAsync = exports.finishedAsync = void 0;
const stream = require("readable-stream");
const promisify = require("util.promisify");
exports.finishedAsync = promisify(stream.finished);
exports.pipelineAsync = promisify(stream.pipeline);
function reduceStreamToPromise(readable, dataCallback, seed) {
    if (dataCallback) {
        readable.on("data", data => seed = dataCallback(seed, data));
    }
    return (0, exports.finishedAsync)(readable)
        .then(() => seed);
}
exports.reduceStreamToPromise = reduceStreamToPromise;
function readToBuffer(stream) {
    return __awaiter(this, void 0, void 0, function* () {
        const chunks = [];
        stream
            .on("data", data => chunks.push(data));
        yield (0, exports.finishedAsync)(stream);
        return Buffer.concat(chunks);
    });
}
exports.readToBuffer = readToBuffer;
function readToEnd(readable) {
    return __awaiter(this, void 0, void 0, function* () {
        const chunks = [];
        readable.on("data", chunk => chunks.push(chunk));
        yield (0, exports.finishedAsync)(readable);
        return Buffer.concat(chunks).toString('utf-8');
    });
}
exports.readToEnd = readToEnd;
function bufferToReadable(b) {
    const result = new stream.Readable();
    result.push(b);
    result.push(null);
    return result;
}
exports.bufferToReadable = bufferToReadable;
function stringToReadable(s) {
    const result = new stream.Readable();
    result.push(s);
    result.push(null);
    return result;
}
exports.stringToReadable = stringToReadable;
function printStreamTraffic(str) {
    str.on("data", d => console.log("READ", d.toString()));
    const orgWrite = str.write;
    str.write = (...args) => {
        console.log("WRITE", args[0]);
        return orgWrite.call(str, ...args);
    };
}
exports.printStreamTraffic = printStreamTraffic;
