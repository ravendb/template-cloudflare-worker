export declare type ReplacerFunction = (key: string, value: any) => any;
export declare type ContextMatcherFunction = (context: ReplacerContext) => boolean;
export declare type FieldReplacerCallback = (context: ReplacerContext) => boolean;
export declare class ReplacerContext {
    path: string;
    key: string;
    value: any;
    parent: object;
    private _parentsStack;
    private _pathSegments;
    update(parent: object, key: string, value: any): void;
    get currentPath(): string;
}
export interface ReplacerTransformRule {
    contextMatcher: ContextMatcherFunction;
    replacer: ReplacerFunction;
}
export declare class SkippingReplacerFactory {
    static build(toSkip: any[], replacer: ReplacerFunction): (key: string, value: any) => any;
}
export declare class RuleBasedReplacerFactory {
    static build(rules: ReplacerTransformRule[], fieldCallback?: (context: ReplacerContext) => void): (key: string, value: any) => any;
}