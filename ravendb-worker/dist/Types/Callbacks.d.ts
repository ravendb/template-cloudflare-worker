export declare type ErrorFirstCallback<TResult> = (error?: Error, result?: TResult) => void;
export declare type EmptyCallback = ErrorFirstCallback<void>;
export declare type ValueCallback<T> = (result: T) => void;
