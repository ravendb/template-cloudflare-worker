import { QueryToken } from "./QueryToken";
import { OrderingType } from "../OrderingType";
declare type OrderByTokenOptions = {
    ordering?: OrderingType;
    sorterName?: string;
};
export declare class OrderByToken extends QueryToken {
    private readonly _fieldName;
    private readonly _descending;
    private readonly _sorterName;
    private readonly _ordering;
    private constructor();
    static random: OrderByToken;
    static scoreAscending: OrderByToken;
    static scoreDescending: OrderByToken;
    static createDistanceAscending(fieldName: string, latitudeParameterName: string, longitudeParameterName: string, roundFactorParameterName: string): OrderByToken;
    static createDistanceAscending(fieldName: string, shapeWktParameterName: string, roundFactorParameterName: string): OrderByToken;
    private static _createDistanceAscendingLatLng;
    private static _createDistanceAscendingWkt;
    private static _createDistanceDescendingLatLng;
    private static _createDistanceDescendingWkt;
    static createDistanceDescending(fieldName: string, latitudeParameterName: string, longitudeParameterName: string, roundFactorParameterName: string): OrderByToken;
    static createDistanceDescending(fieldName: string, shapeWktParameterName: string, roundFactorParameterName: string): OrderByToken;
    static createRandom(seed: string): OrderByToken;
    static createAscending(fieldName: string, options: OrderByTokenOptions): OrderByToken;
    static createDescending(fieldName: string, options: OrderByTokenOptions): OrderByToken;
    writeTo(writer: any): void;
}
export {};