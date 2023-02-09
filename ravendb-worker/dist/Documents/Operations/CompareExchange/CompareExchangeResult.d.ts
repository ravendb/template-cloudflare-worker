import { DocumentConventions } from "../../Conventions/DocumentConventions";
import { CompareExchangeResultClass } from "../../../Types";
export interface CompareExchangeResultResponse {
    index: number;
    successful: boolean;
    value: {
        object: object;
    };
}
export declare class CompareExchangeResult<T> {
    value: T;
    index: number;
    successful: boolean;
    static parseFromObject<T>({ index, value, successful }: CompareExchangeResultResponse, conventions: DocumentConventions, clazz?: CompareExchangeResultClass<T>): CompareExchangeResult<T>;
    static parseFromString<T>(responseString: string, conventions: DocumentConventions, clazz?: CompareExchangeResultClass<T>): CompareExchangeResult<T>;
    private static _create;
}
