import { ILazyOperation } from "./ILazyOperation";
import { GetRevisionOperation } from "../GetRevisionOperation";
import { QueryResult } from "../../../Queries/QueryResult";
import { GetRequest } from "../../../Commands/MultiGet/GetRequest";
import { GetResponse } from "../../../Commands/MultiGet/GetResponse";
import { DocumentType } from "../../../DocumentAbstractions";
export declare type Mode = "Single" | "Multi" | "Map" | "ListOfMetadata";
export declare class LazyRevisionOperation<T extends object> implements ILazyOperation {
    private readonly _clazz;
    private readonly _getRevisionOperation;
    private _mode;
    private _result;
    private _queryResult;
    private _requiresRetry;
    constructor(clazz: DocumentType<T>, getRevisionOperation: GetRevisionOperation, mode: Mode);
    get result(): any;
    set result(result: any);
    get queryResult(): QueryResult;
    set queryResult(queryResult: QueryResult);
    get requiresRetry(): boolean;
    set requiresRetry(result: boolean);
    createRequest(): GetRequest;
    handleResponseAsync(response: GetResponse): Promise<void>;
}