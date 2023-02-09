import { ObjectLiteralDescriptor, EntityConstructor } from "../Types";
export declare type DocumentType<T extends object = object> = EntityConstructor<T> | ObjectLiteralDescriptor<T> | string;
