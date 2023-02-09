import { Request, RequestInit, Response, default as fetch } from "node-fetch";
export declare type HttpRequestParameters = RequestInit & {
    uri: string;
    fetcher?: typeof fetch;
};
export declare type HttpRequestParametersWithoutUri = RequestInit & {
    fetcher?: typeof fetch;
};
export declare type HttpResponse = Response;
export declare type HttpRequest = Request;
