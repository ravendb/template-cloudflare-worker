import { CasingConvention } from "../../../Utility/ObjectUtil";
import { DocumentConventions } from "../../../Documents/Conventions/DocumentConventions";
export declare type TransformJsonKeysProfile = "CommandResponsePayload" | "NoChange" | "DocumentLoad" | "FacetQuery" | "Patch" | "CompareExchangeValue" | "GetCompareExchangeValue" | "SubscriptionResponsePayload" | "SubscriptionRevisionsResponsePayload";
export declare function getTransformJsonKeysProfile(profile: TransformJsonKeysProfile, conventions?: DocumentConventions): {
    getCurrentTransform: (key: any, stack: any) => CasingConvention;
};
