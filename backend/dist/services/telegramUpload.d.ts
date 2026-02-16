import { TelegramClient } from 'telegram';
import { NewMessageEvent } from 'telegram/events/index.js';
interface DownloadTask {
    id: string;
    execute: () => Promise<void>;
    fileName: string;
    status: 'pending' | 'active' | 'success' | 'failed';
    error?: string;
    startTime?: number;
    endTime?: number;
    totalSize?: number;
    downloadedSize?: number;
}
export declare function getDownloadQueueStats(): {
    active: number;
    pending: number;
    total: number;
};
export declare function getTaskStatus(): {
    active: DownloadTask[];
    pending: DownloadTask[];
    history: DownloadTask[];
};
export declare function handleCleanupCallback(cleanupId: string): Promise<{
    success: boolean;
    message: string;
}>;
export declare function handleFileUpload(client: TelegramClient, event: NewMessageEvent): Promise<void>;
export {};
