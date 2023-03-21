import { Request, RequestInit, Response } from "node-fetch";
export declare type HttpRequestParameters = RequestInit & {
    uri: string;
    fetcher?: any;
};
export declare type HttpRequestParametersWithoutUri = RequestInit & {
    fetcher?: any;
};
export declare type HttpResponse = Response;
export declare type HttpRequest = Request;
