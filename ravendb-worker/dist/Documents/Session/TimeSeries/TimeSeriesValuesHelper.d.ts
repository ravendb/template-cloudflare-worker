import { ClassConstructor } from "../../../Types";
declare type TimeSeriesFieldsMapping = {
    field: string;
    name: string;
}[];
export declare class TimeSeriesValuesHelper {
    private static readonly _cache;
    static getFieldsMapping(clazz: ClassConstructor<any>): TimeSeriesFieldsMapping;
    static getValues<T extends object>(clazz: ClassConstructor<T>, obj: T): number[];
    static setFields<T extends object>(clazz: ClassConstructor<T>, values: number[], asRollup?: boolean): T;
}
export {};