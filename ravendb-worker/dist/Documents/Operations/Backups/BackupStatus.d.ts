import { UploadProgress } from "./UploadProgress";
import { CompressionLevel } from "./CompressionLevel";
export interface BackupStatus {
    lastFullBackup: Date;
    lastIncrementalBackup: Date;
    fullBackupDurationInMs: number;
    incrementalBackupDurationIsMs: number;
    exception: string;
}
export interface CloudUploadStatus extends BackupStatus {
    uploadProgress: UploadProgress;
    skipped: boolean;
}
export interface LocalBackup extends BackupStatus {
    backupDirectory: string;
    fileName: string;
    tempFolderUsed: boolean;
}
export interface UploadToAzure extends CloudUploadStatus {
}
export interface UpdateToGoogleCloud extends CloudUploadStatus {
}
export interface UploadToFtp extends CloudUploadStatus {
}
export interface UploadToGlacier extends CloudUploadStatus {
}
export interface UploadToS3 extends CloudUploadStatus {
}
export declare type UploadType = "Regular" | "Chunked";
export interface SnapshotSettings {
    compressionLevel: CompressionLevel;
}