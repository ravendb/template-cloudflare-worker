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
exports.streamResultsIntoStream = exports.getDocumentResultsPipeline = exports.getDocumentResultsAsObjects = void 0;
const RavenCommandResponsePipeline_1 = require("../../../Http/RavenCommandResponsePipeline");
const Pick_1 = require("stream-json/filters/Pick");
const StreamArray_1 = require("stream-json/streamers/StreamArray");
const Stringer_1 = require("stream-json/Stringer");
const TransformKeysJsonStream_1 = require("./TransformKeysJsonStream");
const TransformJsonKeysProfiles_1 = require("./TransformJsonKeysProfiles");
function getDocumentResultsAsObjects(conventions) {
    return RavenCommandResponsePipeline_1.RavenCommandResponsePipeline.create()
        .parseJsonAsync([
        new TransformKeysJsonStream_1.TransformKeysJsonStream((0, TransformJsonKeysProfiles_1.getTransformJsonKeysProfile)("DocumentLoad", conventions)),
        (0, Pick_1.pick)({ filter: "results" }),
        (0, StreamArray_1.streamArray)()
    ]);
}
exports.getDocumentResultsAsObjects = getDocumentResultsAsObjects;
function getDocumentResultsPipeline(conventions) {
    return RavenCommandResponsePipeline_1.RavenCommandResponsePipeline.create()
        .parseJsonAsync([
        new TransformKeysJsonStream_1.TransformKeysJsonStream((0, TransformJsonKeysProfiles_1.getTransformJsonKeysProfile)("DocumentLoad", conventions)),
        (0, Stringer_1.stringer)({ useValues: true })
    ]);
}
exports.getDocumentResultsPipeline = getDocumentResultsPipeline;
function streamResultsIntoStream(bodyStream, conventions, writable) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            getDocumentResultsPipeline(conventions)
                .stream(bodyStream, writable, (err) => {
                err ? reject(err) : resolve();
            });
        });
    });
}
exports.streamResultsIntoStream = streamResultsIntoStream;
