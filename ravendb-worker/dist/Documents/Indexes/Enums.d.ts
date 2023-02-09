export declare type IndexState = "Normal" | "Disabled" | "Idle" | "Error";
export declare type IndexType = "None" | "AutoMap" | "AutoMapReduce" | "Map" | "MapReduce" | "Faulty" | "JavaScriptMap" | "JavaScriptMapReduce";
export declare type FieldStorage = "Yes" | "No";
export declare type FieldIndexing = "No" | "Search" | "Exact" | "Highlighting" | "Default";
export declare type FieldTermVector = "No" | "Yes" | "WithPositions" | "WithOffsets" | "WithPositionsAndOffsets";
export declare type IndexPriority = "Low" | "Normal" | "High";
export declare type IndexLockMode = "Unlock" | "LockedIgnore" | "LockedError";
export declare type AggregationOperation = "None" | "Count" | "Sum";
export declare type AutoFieldIndexing = "No" | "Search" | "Exact" | "Highighting" | "Default";
export declare type GroupByArrayBehavior = "NotApplicable" | "ByContent" | "ByIndividualValues";
export declare type AutoSpatialMethodType = "Point" | "Wkt";
export interface EnumMapping {
    sourceCode: string;
    actualValue: string | number;
}
