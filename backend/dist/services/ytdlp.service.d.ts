export interface VideoInfo {
    id: string;
    title: string;
    description?: string;
    duration?: number;
    uploader?: string;
    uploadDate?: string;
    thumbnailUrl?: string;
    formats?: FormatInfo[];
    filesize?: number;
    ext?: string;
    webpage_url?: string;
    extractor?: string;
}
export interface FormatInfo {
    formatId: string;
    ext: string;
    resolution?: string;
    filesize?: number;
    vcodec?: string;
    acodec?: string;
}
export interface DownloadResult {
    success: boolean;
    filePath?: string;
    filename?: string;
    filesize?: number;
    error?: string;
}
export interface DownloadProgress {
    status: 'downloading' | 'processing' | 'done' | 'error';
    percent?: number;
    downloaded?: number;
    total?: number;
    speed?: string;
    eta?: string;
    filename?: string;
}
/**
 * 检查 URL 是否可能被 yt-dlp 支持
 */
export declare function isLikelySupportedUrl(url: string): boolean;
/**
 * 从文本中提取 URL
 */
export declare function extractUrls(text: string): string[];
/**
 * 获取视频信息（不下载）
 */
export declare function getVideoInfo(url: string): Promise<VideoInfo | null>;
/**
 * 格式化时长
 */
export declare function formatDuration(seconds: number | undefined): string;
/**
 * 格式化文件大小
 */
export declare function formatBytes(bytes: number | undefined): string;
/**
 * 下载视频
 * @param url 视频URL
 * @param onProgress 进度回调
 * @returns 下载结果
 */
export declare function downloadVideo(url: string, onProgress?: (progress: DownloadProgress) => void): Promise<DownloadResult>;
/**
 * 删除临时文件
 */
export declare function cleanupTempFile(filePath: string): void;
/**
 * 清理所有临时文件（超过指定时间的）
 */
export declare function cleanupOldTempFiles(maxAgeHours?: number): void;
declare const _default: {
    isLikelySupportedUrl: typeof isLikelySupportedUrl;
    extractUrls: typeof extractUrls;
    getVideoInfo: typeof getVideoInfo;
    downloadVideo: typeof downloadVideo;
    cleanupTempFile: typeof cleanupTempFile;
    cleanupOldTempFiles: typeof cleanupOldTempFiles;
    formatDuration: typeof formatDuration;
    formatBytes: typeof formatBytes;
};
export default _default;
