export declare type FacetTermSortMode = "ValueAsc" | "ValueDesc" | "CountAsc" | "CountDesc";
export declare type FacetAggregation = "None" | "Max" | "Min" | "Average" | "Sum";
export interface IFacetValue {
    name: string;
    range: string;
    count: number;
    sum: number;
    max: number;
    min: number;
    average: number;
}
export declare class FacetValue implements IFacetValue {
    name: string;
    range: string;
    count: number;
    sum: number;
    max: number;
    min: number;
    average: number;
    toString(): string;
    static toString(facetVal: IFacetValue): string;
}
export declare class FacetResult {
    name: string;
    values: FacetValue[];
    remainingTerms: string[];
    remainingTermsCount: number;
    remainingHits: number;
}
export interface IFacetOptions {
    termSortMode: FacetTermSortMode;
    includeRemainingTerms: boolean;
    start: number;
    pageSize: number;
}
export declare class FacetOptions implements IFacetOptions {
    termSortMode: FacetTermSortMode;
    includeRemainingTerms: boolean;
    start: number;
    pageSize: number;
    private static _defaultOptions;
    constructor();
    static getDefaultOptions(): IFacetOptions;
}