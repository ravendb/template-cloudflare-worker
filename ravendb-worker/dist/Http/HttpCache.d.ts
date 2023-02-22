import { IDisposable } from "../Types/Contracts";
export interface CachedItemMetadata {
    changeVector: string;
    response: string;
}
export declare class HttpCache implements IDisposable {
    private _items;
    constructor(maxKeysSize?: number);
    dispose(): void;
    clear(): void;
    set(url: string, changeVector: string, result: string): void;
    get<TResult>(url: string, itemInfoCallback?: ({ changeVector, response }: CachedItemMetadata) => void): ReleaseCacheItem;
    setNotFound(url: string): void;
    get numberOfItems(): number;
    getMightHaveBeenModified(): boolean;
}
export declare class ReleaseCacheItem {
    item: HttpCacheItem;
    constructor(item: HttpCacheItem);
    notModified(): void;
    get age(): number;
    get mightHaveBeenModified(): boolean;
}
export declare class HttpCacheItem {
    changeVector: string;
    payload: string;
    lastServerUpdate: Date;
    flags: ItemFlags;
    cache: HttpCache;
    constructor();
}
export declare type ItemFlags = "None" | "NotFound";