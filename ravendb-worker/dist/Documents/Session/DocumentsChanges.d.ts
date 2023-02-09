export declare class DocumentsChanges {
    fieldOldValue: any;
    fieldNewValue: any;
    change: ChangeType;
    fieldName: string;
    fieldPath: string;
    get fieldFullName(): string;
}
export declare type ChangeType = "DocumentDeleted" | "DocumentAdded" | "FieldChanged" | "NewField" | "RemovedField" | "ArrayValueChanged" | "ArrayValueAdded" | "ArrayValueRemoved";
