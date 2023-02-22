import { DocumentConventions } from "../Documents/Conventions/DocumentConventions";
import { MetadataObject } from "../Documents/Session/MetadataObject";
import { CompareExchangeResultItem } from "../Documents/Operations/CompareExchange/CompareExchangeValueResultParser";
import { CounterDetail } from "../Documents/Operations/Counters/CounterDetail";
import { AttachmentDetails } from "../Documents/Attachments";
export declare class ObjectUtil {
    static clone(o: any): any;
    static deepJsonClone(o: any): any;
    static deepLiteralClone(item: any): any;
    static mapToLiteral<TValue>(input: Map<string, TValue>): {
        [key: string]: TValue;
    };
    static mapToLiteral<TValue, TResult>(input: Map<string, TValue>, valueTransformFunc: (value: string, key: TValue) => TResult): {
        [key: string]: TResult;
    };
    static transformObjectKeys(obj: object, opts?: ObjectChangeCaseOptions): object;
    static transformDocumentKeys(obj: any, conventions: DocumentConventions): any;
    static transformMetadataKeys(metadata: MetadataObject, conventions: DocumentConventions): MetadataObject;
    static mapAttachmentDetailsToLocalObject(json: any): AttachmentDetails;
    static mapCompareExchangeToLocalObject(json: Record<string, any>): Record<string, CompareExchangeResultItem>;
    static mapTimeSeriesIncludesToLocalObject(json: Record<string, Record<string, any[]>>): Record<string, Record<string, {
        from: string;
        to: string;
        entries: {
            timestamp: string;
            tag: string;
            values: number[];
            isRollup: boolean;
            value: number;
            asTypedEntry: {};
        }[];
        totalResults: number;
        includes: any;
    }[]>>;
    static mapCounterIncludesToLocalObject(json: Record<string, any[]>): Record<string, CounterDetail[]>;
}
export declare type CasingConvention = "upper" | "upperCase" | "ucFirst" | "upperCaseFirst" | "lcFirst" | "lowerCaseFirst" | "lower" | "lowerCase" | "sentence" | "sentenceCase" | "title" | "titleCase" | "camel" | "camelCase" | "pascal" | "pascalCase" | "snake" | "snakeCase" | "param" | "paramCase" | "dot" | "dotCase" | "path" | "pathCase" | "constant" | "constantCase" | "swap" | "swapCase";
export interface ObjectChangeCaseOptionsBase {
    recursive?: boolean;
    arrayRecursive?: boolean;
    ignoreKeys?: (string | RegExp)[];
    ignorePaths?: (string | RegExp)[];
    paths?: {
        transform: CasingConvention;
        path?: RegExp;
    }[];
}
export interface ObjectChangeCaseOptions extends ObjectChangeCaseOptionsBase {
    defaultTransform: CasingConvention;
}