import { AbstractIndexCreationTaskBase } from "../AbstractIndexCreationTaskBase";
import { TimeSeriesIndexDefinition } from "./TimeSeriesIndexDefinition";
import { IndexDefinition } from "../IndexDefinition";
export declare abstract class AbstractRawJavaScriptTimeSeriesIndexCreationTask extends AbstractIndexCreationTaskBase<TimeSeriesIndexDefinition> {
    private readonly _definition;
    protected constructor();
    get maps(): Set<string>;
    set maps(value: Set<string>);
    get fields(): {
        [fieldName: string]: import("../IndexFieldOptions").IndexFieldOptions;
    };
    set fields(value: {
        [fieldName: string]: import("../IndexFieldOptions").IndexFieldOptions;
    });
    get reduce(): string;
    set reduce(value: string);
    get isMapReduce(): boolean;
    get outputReduceToCollection(): string;
    set outputReduceToCollection(value: string);
    get patternReferencesCollectionName(): string;
    set patternReferencesCollectionName(value: string);
    get patternForOutputReduceToCollectionReferences(): string;
    set patternForOutputReduceToCollectionReferences(value: string);
    createIndexDefinition(): IndexDefinition;
}