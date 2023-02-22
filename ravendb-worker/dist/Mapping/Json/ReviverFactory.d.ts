export declare type ReviverFunction = (key: string, value: any) => any;
export declare type ContextMatcherFunction = (context: ReviverContext) => boolean;
export declare type FieldReviverCallback = (context: ReviverContext) => boolean;
export declare class ReviverContext {
    path: string;
    key: string;
    value: any;
    parent: object;
    private _parentsStack;
    private _pathSegments;
    update(parent: object, key: string, value: any): void;
    get currentPath(): string;
}
export interface ReviverTransformRule {
    contextMatcher: ContextMatcherFunction;
    reviver: ReviverFunction;
}
export declare class RuleBasedReviverFactory {
    static build(rules: ReviverTransformRule[], fieldCallback?: (context: ReviverContext) => void): (key: string, value: any) => any;
}