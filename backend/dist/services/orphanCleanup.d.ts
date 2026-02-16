/**
 * 孤儿文件清理服务
 *
 * 扫描 uploads 目录，删除不在数据库中的"孤儿文件"
 * 解决进程崩溃/重启导致的文件残留问题
 */
export interface CleanupStats {
    deletedCount: number;
    freedBytes: number;
    freedSpace: string;
    deletedFiles: string[];
}
/**
 * 清理孤儿文件
 * 扫描 uploads 目录，删除不在数据库中的文件
 */
export declare function cleanupOrphanFiles(): Promise<CleanupStats>;
/**
 * 启动定期清理任务
 * 默认每小时执行一次
 */
export declare function startPeriodicCleanup(intervalMs?: number): void;
/**
 * 停止定期清理任务
 */
export declare function stopPeriodicCleanup(): void;
