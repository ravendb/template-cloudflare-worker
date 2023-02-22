import { BatchOptions } from "./Batches/BatchOptions";
import { InMemoryDocumentSessionOperations } from "../Session/InMemoryDocumentSessionOperations";
import { DocumentConventions } from "../Conventions/DocumentConventions";
import { DocumentInfo } from "../Session/DocumentInfo";
import { ForceRevisionStrategy } from "../Session/ForceRevisionStrategy";
export declare type CommandType = "None" | "PUT" | "PATCH" | "DELETE" | "AttachmentPUT" | "AttachmentDELETE" | "AttachmentMOVE" | "AttachmentCOPY" | "CompareExchangePUT" | "CompareExchangeDELETE" | "Counters" | "ClientAnyCommand" | "ClientModifyDocumentCommand" | "BatchPATCH" | "ForceRevisionCreation" | "TimeSeries" | "TimeSeriesBulkInsert" | "TimeSeriesCopy";
export interface ICommandData {
    id: string;
    name: string;
    changeVector: string;
    type: CommandType;
    serialize(conventions: DocumentConventions): object;
    onBeforeSaveChanges?: (session: InMemoryDocumentSessionOperations) => void;
}
export declare class DeleteCommandData implements ICommandData {
    id: string;
    name: string;
    changeVector: string;
    originalChangeVector: string;
    document: any;
    get type(): CommandType;
    constructor(id: string, changeVector?: string, originalChangeVector?: string);
    serialize(conventions: DocumentConventions): object;
    onBeforeSaveChanges(session: InMemoryDocumentSessionOperations): void;
    protected _serializeExtraFields(resultingObject: object): void;
}
export declare class PutCommandDataBase<T extends object> implements ICommandData {
    get type(): CommandType;
    id: string;
    name: string;
    changeVector: string;
    readonly originalChangeVector: string;
    forceRevisionCreationStrategy: ForceRevisionStrategy;
    private readonly _document;
    constructor(id: string, changeVector: string, originalChangeVector: string, document: T, strategy?: ForceRevisionStrategy);
    serialize(conventions: DocumentConventions): object;
}
export declare class PutCommandDataWithJson extends PutCommandDataBase<object> {
    constructor(id: string, changeVector: string, originalChangeVector: string, document: object, strategy: ForceRevisionStrategy);
}
export declare class SaveChangesData {
    deferredCommands: ICommandData[];
    deferredCommandsMap: Map<string, ICommandData>;
    sessionCommands: ICommandData[];
    entities: object[];
    options: BatchOptions;
    onSuccess: ActionsToRunOnSuccess;
    constructor(args: {
        deferredCommands: ICommandData[];
        deferredCommandsMap: Map<string, ICommandData>;
        options: BatchOptions;
        session: InMemoryDocumentSessionOperations;
    });
}
export declare class ActionsToRunOnSuccess {
    private readonly _session;
    private readonly _documentsByIdToRemove;
    private readonly _documentsByEntityToRemove;
    private readonly _documentInfosToUpdate;
    private _clearDeletedEntities;
    constructor(session: InMemoryDocumentSessionOperations);
    removeDocumentById(id: string): void;
    removeDocumentByEntity(entity: object): void;
    updateEntityDocumentInfo(documentInfo: DocumentInfo, document: object): void;
    clearSessionStateAfterSuccessfulSaveChanges(): void;
    clearDeletedEntities(): void;
}