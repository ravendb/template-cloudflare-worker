export declare const DEFAULT_GEOHASH_LEVEL = 9;
export declare const DEFAULT_QUAD_TREE_LEVEL = 23;
export declare type SpatialFieldType = "Geography" | "Cartesian";
export declare type SpatialSearchStrategy = "GeohashPrefixTree" | "QuadPrefixTree" | "BoundingBox";
export declare type SpatialUnits = "Kilometers" | "Miles";
export declare class SpatialOptions {
    type: SpatialFieldType;
    strategy: SpatialSearchStrategy;
    maxTreeLevel: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    units: SpatialUnits;
    constructor(options?: SpatialOptions);
}
export declare class SpatialOptionsFactory {
    geography(): GeographySpatialOptionsFactory;
    cartesian(): CartesianSpatialOptionsFactory;
}
export declare class CartesianSpatialOptionsFactory {
    boundingBoxIndex(): SpatialOptions;
    quadPrefixTreeIndex(maxTreeLevel: number, bounds: SpatialBounds): SpatialOptions;
}
export declare class SpatialBounds {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    constructor(minX: number, minY: number, maxX: number, maxY: number);
}
export declare class GeographySpatialOptionsFactory {
    defaultOptions(circleRadiusUnits?: SpatialUnits): SpatialOptions;
    boundingBoxIndex(circleRadiusUnits?: SpatialUnits): SpatialOptions;
    geohashPrefixTreeIndex(maxTreeLevel: number, circleRadiusUnits?: SpatialUnits): SpatialOptions;
    quadPrefixTreeIndex(maxTreeLevel: number, circleRadiusUnits: SpatialUnits): SpatialOptions;
}
export declare type SpatialRelation = "Within" | "Contains" | "Disjoint" | "Intersects";
