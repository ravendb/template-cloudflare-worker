"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransformJsonKeysProfile = void 0;
const Exceptions_1 = require("../../../Exceptions");
function getSimpleKeysTransform(convention) {
    return {
        getCurrentTransform(key, stack) {
            return convention;
        }
    };
}
function getTransformJsonKeysProfile(profile, conventions) {
    if (profile === "CommandResponsePayload") {
        return getSimpleKeysTransform("camel");
    }
    if (profile === "NoChange") {
        return getSimpleKeysTransform(null);
    }
    if (profile === "DocumentLoad") {
        if (!conventions) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Document conventions are required for this profile.");
        }
        const getCurrentTransform = buildEntityKeysTransformForDocumentLoad(conventions.entityFieldNameConvention);
        return { getCurrentTransform };
    }
    if (profile === "FacetQuery") {
        return {
            getCurrentTransform: facetQueryGetTransform
        };
    }
    if (profile === "Patch") {
        if (!conventions) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Document conventions are required for this profile.");
        }
        return {
            getCurrentTransform: buildEntityKeysTransformForPatch(conventions.entityFieldNameConvention)
        };
    }
    if (profile === "CompareExchangeValue") {
        if (!conventions) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Document conventions are required for this profile.");
        }
        return {
            getCurrentTransform: buildEntityKeysTransformForPutCompareExchangeValue(conventions.entityFieldNameConvention)
        };
    }
    if (profile === "GetCompareExchangeValue") {
        if (!conventions) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Document conventions are required for this profile.");
        }
        return {
            getCurrentTransform: buildEntityKeysTransformForGetCompareExchangeValue(conventions.entityFieldNameConvention)
        };
    }
    if (profile === "SubscriptionResponsePayload") {
        if (!conventions) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Document conventions are required for this profile.");
        }
        return {
            getCurrentTransform: buildEntityKeysTransformForSubscriptionResponsePayload(conventions.entityFieldNameConvention)
        };
    }
    if (profile === "SubscriptionRevisionsResponsePayload") {
        if (!conventions) {
            (0, Exceptions_1.throwError)("InvalidArgumentException", "Document conventions are required for this profile.");
        }
        return {
            getCurrentTransform: buildEntityKeysTransformForSubscriptionRevisionsResponsePayload(conventions.entityFieldNameConvention)
        };
    }
    (0, Exceptions_1.throwError)("NotSupportedException", `Invalid profile name ${profile}`);
}
exports.getTransformJsonKeysProfile = getTransformJsonKeysProfile;
function facetQueryGetTransform(key, stack) {
    const len = stack.length;
    if (stack[0] === "Includes") {
        if (len >= 3 && stack[2] === "@metadata") {
            return handleMetadataJsonKeys(key, stack, stack.length, 3);
        }
    }
    return "camel";
}
function buildEntityKeysTransformForPatch(entityCasingConvention) {
    return function entityKeysTransform(key, stack) {
        const len = stack.length;
        if (len === 1) {
            return "camel";
        }
        const isDoc = stack[0] === "OriginalDocument" || stack[0] === "ModifiedDocument";
        if (isDoc) {
            if (len === 2) {
                return key === "@metadata" ? null : entityCasingConvention;
            }
            if (len === 3) {
                if (stack[1] === "@metadata") {
                    if (key[0] === "@" || key === "Raven-Node-Type") {
                        return null;
                    }
                }
            }
            if (len === 4) {
                if (stack[len - 2] === "@nested-object-types") {
                    return null;
                }
            }
            if (len === 5) {
                if (stack[1] === "@metadata") {
                    if (stack[2] === "@attachments") {
                        return "camel";
                    }
                    return null;
                }
            }
            return entityCasingConvention;
        }
        return "camel";
    };
}
function buildEntityKeysTransformForPutCompareExchangeValue(entityCasingConvention) {
    return function compareExchangeValueTransform(key, stack) {
        const len = stack.length;
        if (len === 1 || len === 2) {
            return "camel";
        }
        if (len === 3) {
            return key === "@metadata" ? null : entityCasingConvention;
        }
        if (len === 4) {
            if (stack[2] === "@metadata") {
                if (key[0] === "@" || key === "Raven-Node-Type") {
                    return null;
                }
            }
        }
        if (len === 5) {
            if (stack[len - 2] === "@nested-object-types") {
                return null;
            }
        }
        if (len === 6) {
            if (stack[2] === "@metadata") {
                if (stack[3] === "@attachments") {
                    return "camel";
                }
                return null;
            }
        }
        return entityCasingConvention;
    };
}
function buildEntityKeysTransformForGetCompareExchangeValue(entityCasingConvention) {
    return function getCompareExchangeValueTransform(key, stack) {
        const len = stack.length;
        if (stack[0] === "Results") {
            if (stack[2] === "Value" && stack[3] === "@metadata") {
                return handleMetadataJsonKeys(key, stack, len, 4);
            }
        }
        if (len <= 4) {
            return "camel";
        }
        return entityCasingConvention;
    };
}
function buildEntityKeysTransformForSubscriptionResponsePayload(entityCasingConvention) {
    return function entityKeysTransform(key, stack) {
        const len = stack.length;
        if (len === 1) {
            return "camel";
        }
        if (stack[0] === "Data") {
            if (stack[1] === "@metadata") {
                return handleMetadataJsonKeys(key, stack, len, 2);
            }
            return entityCasingConvention;
        }
        else if (stack[0] === "Includes") {
            if (stack[2] === "@metadata") {
                return handleMetadataJsonKeys(key, stack, len, 2);
            }
            return entityCasingConvention;
        }
        else if (stack[0] === "CounterIncludes") {
            if (len === 2) {
                return null;
            }
        }
        else if (stack[0] === "IncludedCounterNames") {
            if (len === 2) {
                return null;
            }
        }
        return "camel";
    };
}
function buildEntityKeysTransformForSubscriptionRevisionsResponsePayload(entityCasingConvention) {
    return function entityKeysTransform(key, stack) {
        const len = stack.length;
        if (len === 1) {
            return "camel";
        }
        const isData = stack[0] === "Data";
        if (isData && stack[1] === "@metadata") {
            return handleMetadataJsonKeys(key, stack, len, 2);
        }
        if (isData && (stack[1] === "Current" || stack[1] === "Previous")) {
            if (len === 2) {
                return "camel";
            }
            if (stack[2] === "@metadata") {
                return handleMetadataJsonKeys(key, stack, len, 3);
            }
            return entityCasingConvention;
        }
        if (stack[0] === "CounterIncludes") {
            if (len === 2) {
                return null;
            }
        }
        return "camel";
    };
}
function buildEntityKeysTransformForDocumentLoad(entityCasingConvention) {
    return function entityKeysTransform(key, stack) {
        const len = stack.length;
        if (len === 1) {
            return "camel";
        }
        if (len === 2) {
            if (stack[0] === "CounterIncludes") {
                return null;
            }
        }
        if (len === 3) {
            if (stack[0] === "CompareExchangeValueIncludes") {
                return "camel";
            }
            return key === "@metadata" ? null : entityCasingConvention;
        }
        if (len === 4) {
            if (stack[0] === "CounterIncludes") {
                return "camel";
            }
            if (stack[0] === "CompareExchangeValueIncludes" && stack[2] === "Value" && stack[3] === "Object") {
                return "camel";
            }
            if (stack[2] === "@metadata") {
                if (key[0] === "@" || key === "Raven-Node-Type") {
                    return null;
                }
            }
        }
        if (len === 5) {
            if (stack[len - 2] === "@nested-object-types") {
                return null;
            }
            if (stack[0] === "TimeSeriesIncludes") {
                return "camel";
            }
        }
        if (len === 6) {
            if (stack[2] === "@metadata") {
                if (stack[3] === "@attachments") {
                    return "camel";
                }
                return null;
            }
        }
        if (len === 7) {
            if (stack[0] === "TimeSeriesIncludes") {
                return "camel";
            }
        }
        return entityCasingConvention;
    };
}
function handleMetadataJsonKeys(key, stack, stackLength, metadataKeyLevel) {
    if (stackLength === metadataKeyLevel) {
        return null;
    }
    if (stackLength === metadataKeyLevel + 1) {
        if (key[0] === "@" || key === "Raven-Node-Type") {
            return null;
        }
    }
    if (stackLength === metadataKeyLevel + 2) {
        if (stack[stackLength - 2] === "@nested-object-types") {
            return null;
        }
    }
    if (stackLength === metadataKeyLevel + 3) {
        if (stack[metadataKeyLevel - 1] === "@metadata") {
            if (stack[metadataKeyLevel - 1 + 1] === "@attachments") {
                return "camel";
            }
            return null;
        }
    }
    return null;
}
