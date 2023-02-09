/// <reference types="node" />
import { EventEmitter } from "events";
import { ObjectKeyCaseTransformStreamOptions } from "../Mapping/Json/Streams/ObjectKeyCaseTransformStream";
import { ObjectKeyCaseTransformProfile } from "../Mapping/Json/Conventions";
import { CasingConvention } from "../Utility/ObjectUtil";
import * as stream from "readable-stream";
import { CollectResultStreamOptions } from "../Mapping/Json/Streams/CollectResultStream";
import { TransformJsonKeysStreamOptions } from "../Mapping/Json/Streams/TransformKeysJsonStream";
import { TransformJsonKeysProfile } from "../Mapping/Json/Streams/TransformJsonKeysProfiles";
import { DocumentConventions } from "../Documents/Conventions/DocumentConventions";
import { ErrorFirstCallback } from "../Types/Callbacks";
export interface RavenCommandResponsePipelineOptions<TResult> {
    collectBody?: boolean | ((body: string) => void);
    jsonAsync?: {
        filters: any[];
    };
    jsonSync?: boolean;
    streamKeyCaseTransform?: ObjectKeyCaseTransformStreamOptions;
    collectResult: CollectResultStreamOptions<TResult>;
    transform?: stream.Stream;
    transformKeys?: TransformJsonKeysStreamOptions;
}
export declare class RavenCommandResponsePipeline<TStreamResult> extends EventEmitter {
    private readonly _opts;
    private _body;
    private constructor();
    static create<TResult>(): RavenCommandResponsePipeline<TResult>;
    parseJsonAsync(filters?: any[]): this;
    parseJsonSync(): this;
    collectBody(callback?: (body: string) => void): this;
    jsonKeysTransform(): this;
    jsonKeysTransform(profile: TransformJsonKeysProfile, conventions: DocumentConventions): this;
    jsonKeysTransform(profile: TransformJsonKeysProfile): this;
    jsonKeysTransform(opts: TransformJsonKeysStreamOptions): this;
    objectKeysTransform(defaultTransform: CasingConvention, profile?: ObjectKeyCaseTransformProfile): this;
    objectKeysTransform(opts: ObjectKeyCaseTransformStreamOptions): this;
    collectResult(reduce: (result: TStreamResult, next: object) => TStreamResult, init: TStreamResult): RavenCommandResponsePipeline<TStreamResult>;
    collectResult(opts: CollectResultStreamOptions<TStreamResult>): RavenCommandResponsePipeline<TStreamResult>;
    stream(src: stream.Stream): stream.Readable;
    stream(src: stream.Stream, dst: stream.Writable, callback: ErrorFirstCallback<void>): stream.Stream;
    private _appendBody;
    private _buildUp;
    process(src: stream.Stream): Promise<TStreamResult>;
}
