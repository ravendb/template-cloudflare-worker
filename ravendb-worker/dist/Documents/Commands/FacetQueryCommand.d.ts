import { QueryResult } from "../Queries/QueryResult";
import { DocumentConventions } from "../Conventions/DocumentConventions";
import * as stream from "readable-stream";
import { QueryCommand } from "./QueryCommand";
export declare class FacetQueryCommand extends QueryCommand {
    setResponseAsync(bodyStream: stream.Stream, fromCache: boolean): Promise<string>;
    static parseQueryResultResponseAsync(bodyStream: stream.Stream, conventions: DocumentConventions, fromCache: boolean, bodyCallback?: (body: string) => void): Promise<QueryResult>;
}
