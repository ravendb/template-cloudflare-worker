declare type OnlyNumbers<T> = {
    [P in keyof T]: T[P] extends number ? P : never;
}[keyof T];
declare type MappedField<T> = {
    field: OnlyNumbers<T>;
    name: string;
};
export declare type TimeSeriesValue<T> = (OnlyNumbers<T> | MappedField<T>)[];
export {};
