import { ReplacerTransformRule } from "./ReplacerFactory";
import { ReviverTransformRule } from "./ReviverFactory";
export declare type JsonTransformFunction = (key: any, value: any) => any;
export interface JsonSerializerSettings {
    replacerRules?: ReplacerTransformRule[];
    reviverRules?: ReviverTransformRule[];
}
export declare class JsonSerializer {
    private _reviverRules;
    private _replacerRules;
    get reviverRules(): ReviverTransformRule[];
    set reviverRules(value: ReviverTransformRule[]);
    get replacerRules(): ReplacerTransformRule[];
    set replacerRules(value: ReplacerTransformRule[]);
    constructor(opts?: JsonSerializerSettings);
    deserialize<TResult = object>(jsonString: string): TResult;
    serialize(obj: object): string;
    static getDefault(): JsonSerializer;
    static getDefaultForCommandPayload(): JsonSerializer;
    static getDefaultForEntities(): JsonSerializer;
}