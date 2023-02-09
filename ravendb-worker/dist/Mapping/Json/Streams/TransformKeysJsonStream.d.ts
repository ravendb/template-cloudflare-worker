import FilterBase = require("stream-json/filters/FilterBase");
import { CasingConvention } from "../../../Utility/ObjectUtil";
export interface TransformJsonKeysStreamOptions {
    getCurrentTransform?: (key: string, stack: (string | null | number)[]) => CasingConvention;
}
export declare class TransformKeysJsonStream extends FilterBase {
    private _getTransform;
    constructor(opts: TransformJsonKeysStreamOptions);
    private _transformKey;
    private _checkChunk;
}
