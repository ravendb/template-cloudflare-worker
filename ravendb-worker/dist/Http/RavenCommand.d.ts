/// <reference types="node" />
import { ServerNode } from "./ServerNode";
import { HttpCache } from "../Http/HttpCache";
import * as stream from "readable-stream";
import { Response } from "node-fetch";
import { HttpRequestParameters, HttpResponse } from "../Primitives/Http";
import { IRavenObject } from "../Types/IRavenObject";
import { HeadersBuilder } from "../Utility/HttpUtil";
import { TypeInfo } from "../Mapping/ObjectMapper";
import { JsonSerializer } from "../Mapping/Json/Serializer";
import { RavenCommandResponsePipeline } from "./RavenCommandResponsePipeline";
import { DocumentConventions } from "../Documents/Conventions/DocumentConventions";
import * as http from "http";
import { ObjectTypeDescriptor } from "../Types";
export declare type RavenCommandResponse = string | Response;
export declare type RavenCommandResponseType = "Empty" | "Object" | "Raw";
export declare type ResponseDisposeHandling = "Automatic" | "Manually";
export interface IRavenResponse extends IRavenObject {
}
export declare abstract class RavenCommand<TResult> {
    result: TResult;
    statusCode: number;
    failedNodes: Map<ServerNode, Error>;
    protected _responseType: RavenCommandResponseType;
    timeout: number | undefined;
    protected _canCache: boolean;
    protected _canCacheAggressively: boolean;
    protected _selectedNodeTag: string;
    protected _numberOfAttempts: number;
    failoverTopologyEtag: number;
    abstract get isReadRequest(): boolean;
    get responseType(): RavenCommandResponseType;
    get canCache(): boolean;
    get canCacheAggressively(): boolean;
    get selectedNodeTag(): string;
    get numberOfAttempts(): number;
    set numberOfAttempts(value: number);
    constructor(copy?: RavenCommand<TResult>);
    abstract createRequest(node: ServerNode): HttpRequestParameters;
    protected get _serializer(): JsonSerializer;
    setResponseFromCache(cachedValue: string): Promise<void>;
    protected _defaultPipeline<T = TResult>(bodyCallback?: (body: string) => void): RavenCommandResponsePipeline<T>;
    setResponseAsync(bodyStream: stream.Stream, fromCache: boolean): Promise<string>;
    send(agent: http.Agent, requestOptions: HttpRequestParameters): Promise<{
        response: HttpResponse;
        bodyStream: stream.Readable;
    }>;
    private static maybeWrapBody;
    setResponseRaw(response: HttpResponse, body: string): void;
    protected _urlEncode(value: any): string;
    static ensureIsNotNullOrEmpty(value: string, name: string): void;
    isFailedWithNode(node: ServerNode): boolean;
    processResponse(cache: HttpCache, response: HttpResponse, bodyStream: stream.Readable, url: string): Promise<ResponseDisposeHandling>;
    protected _cacheResponse(cache: HttpCache, url: string, response: HttpResponse, responseJson: string): void;
    protected _addChangeVectorIfNotNull(changeVector: string, req: HttpRequestParameters): void;
    protected _reviveResultTypes<TResponse extends object>(raw: object, conventions: DocumentConventions, typeInfo?: TypeInfo, knownTypes?: Map<string, ObjectTypeDescriptor>): TResponse;
    protected _parseResponseDefaultAsync(bodyStream: stream.Stream): Promise<string>;
    protected _headers(): HeadersBuilder;
    protected _throwInvalidResponse(): void;
    protected static _throwInvalidResponse(cause: Error): void;
    onResponseFailure(response: HttpResponse): void;
    protected _pipeline<TPipelineResult>(): RavenCommandResponsePipeline<TPipelineResult>;
}
