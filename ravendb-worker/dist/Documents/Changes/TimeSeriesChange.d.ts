import { DatabaseChange } from "./DatabaseChange";
export declare type TimeSeriesChangeTypes = "None" | "Put" | "Delete" | "Mixed";
export interface TimeSeriesChange extends DatabaseChange {
    name: string;
    from: Date;
    to: Date;
    documentId: string;
    changeVector: string;
    type: TimeSeriesChangeTypes;
    collectionName: string;
}
