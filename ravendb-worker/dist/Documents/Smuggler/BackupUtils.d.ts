export declare class BackupUtils {
    private constructor();
    private static readonly LEGACY_INCREMENTAL_BACKUP_EXTENSION;
    private static readonly LEGACY_FULL_BACKUP_EXTENSION;
    static BACKUP_FILE_SUFFIXES: string[];
    static isSnapshot(extension: string): boolean;
    static isIncrementalBackupFile(extension: string): boolean;
    static comparator(o1: string, o2: string): number;
}
export declare function periodicBackupFileExtensionComparator(o1: string, o2: string): 1 | -1 | 0;