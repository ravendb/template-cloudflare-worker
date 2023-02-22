import { CasingConvention } from "../../../Utility/ObjectUtil";
import { ObjectKeyCaseTransformStreamOptionsBase, ObjectKeyCaseTransformStreamOptions } from "../Streams/ObjectKeyCaseTransformStream";
export declare const DOCUMENT_LOAD_KEY_CASE_TRANSFORM_PROFILE: ObjectKeyCaseTransformStreamOptionsBase;
export declare const MULTI_GET_KEY_CASE_TRANSFORM_PROFILE: ObjectKeyCaseTransformStreamOptionsBase;
export declare type ObjectKeyCaseTransformProfile = "DOCUMENT_LOAD" | "DOCUMENT_QUERY";
export declare function getObjectKeyCaseTransformProfile(defaultTransform: CasingConvention, profile?: ObjectKeyCaseTransformProfile): ObjectKeyCaseTransformStreamOptions;