export interface IStorageProvider {
    id?: string;
    name: string;
    /**
     * 保存文件
     * @param tempPath 临时文件路径
     * @param fileName 目标文件名
     * @param mimeType 文件类型
     * @returns 存储后的路径或标识符
     */
    saveFile(tempPath: string, fileName: string, mimeType: string): Promise<string>;
    /**
     * 获取文件流（用于下载）
     * @param storedPath 存储路径或标识符
     */
    getFileStream(storedPath: string): Promise<NodeJS.ReadableStream>;
    /**
     * 获取预览URL（可能是临时的）
     * @param storedPath 存储路径或标识符
     */
    getPreviewUrl(storedPath: string): Promise<string>;
    /**
     * 删除文件
     * @param storedPath 存储路径或标识符
     */
    deleteFile(storedPath: string): Promise<void>;
    /**
     * 获取文件大小（可选）
     */
    getFileSize?(storedPath: string): Promise<number>;
    /**
     * 创建分享链接
     * @param storedPath 存储路径或标识符
     * @param password 访问密码（可选）
     * @param expiration 过期时间 ISO 字符串（可选）
     */
    createShareLink?(storedPath: string, password?: string, expiration?: string): Promise<{
        link: string;
        error?: string;
    }>;
}
export declare class LocalStorageProvider implements IStorageProvider {
    name: string;
    private uploadDir;
    constructor(uploadDir?: string);
    saveFile(tempPath: string, fileName: string): Promise<string>;
    getFileStream(storedPath: string): Promise<NodeJS.ReadableStream>;
    getPreviewUrl(storedPath: string): Promise<string>;
    deleteFile(storedPath: string): Promise<void>;
    createShareLink(storedPath: string, password?: string, expiration?: string): Promise<{
        link: string;
        error?: string;
    }>;
}
export declare class AliyunOSSStorageProvider implements IStorageProvider {
    id: string;
    name: string;
    private client;
    constructor(id: string, region: string, accessKeyId: string, accessKeySecret: string, bucket: string);
    private sanitizeRegion;
    saveFile(tempPath: string, fileName: string): Promise<string>;
    getFileStream(storedPath: string): Promise<NodeJS.ReadableStream>;
    getPreviewUrl(storedPath: string): Promise<string>;
    deleteFile(storedPath: string): Promise<void>;
    getFileSize(storedPath: string): Promise<number>;
}
export declare class OneDriveStorageProvider implements IStorageProvider {
    id: string;
    private clientId;
    private clientSecret;
    private refreshToken;
    private tenantId;
    name: string;
    private accessToken;
    private tokenExpiresAt;
    private readonly ONEDRIVE_FOLDER;
    constructor(id: string, clientId: string, clientSecret: string, refreshToken: string, tenantId?: string);
    /**
     * 生成 OAuth 授权 URL
     */
    static generateAuthUrl(clientId: string, tenantId: string | undefined, redirectUri: string): string;
    /**
     * 使用授权码交换令牌
     */
    static exchangeCodeForToken(clientId: string, clientSecret: string, tenantId: string | undefined, redirectUri: string, code: string): Promise<any>;
    /**
     * 获取有效的访问令牌，自动刷新过期令牌
     */
    private getAccessToken;
    /**
     * 确保存储文件夹存在
     */
    private ensureFolderExists;
    /**
     * 保存文件到 OneDrive
     */
    saveFile(tempPath: string, fileName: string, mimeType: string): Promise<string>;
    /**
     * 取消上传会话（清理服务器上的未完成上传）
     */
    cancelUploadSession(uploadUrl: string): Promise<void>;
    /**
     * 获取文件流用于下载
     */
    getFileStream(storedPath: string): Promise<NodeJS.ReadableStream>;
    /**
     * 获取文件预览URL（临时下载链接，有效期约1小时）
     */
    getPreviewUrl(storedPath: string): Promise<string>;
    /**
     * 删除文件
     */
    deleteFile(storedPath: string): Promise<void>;
    /**
     * 获取文件大小
     */
    getFileSize(storedPath: string): Promise<number>;
    /**
     * 创建分享链接
     */
    createShareLink(storedPath: string, password?: string, expiration?: string): Promise<{
        link: string;
        error?: string;
    }>;
}
export declare class StorageManager {
    private static instance;
    private activeProvider;
    private providers;
    private activeAccountId;
    private constructor();
    static getInstance(): StorageManager;
    init(): Promise<void>;
    private migrateLegacyConfig;
    getSetting(key: string): Promise<string | null>;
    static updateSetting(key: string, value: string): Promise<void>;
    static updateAccountToken(accountId: string, refreshToken: string): Promise<void>;
    getProvider(name?: string): IStorageProvider;
    getActiveAccountId(): string | null;
    getAccounts(): Promise<any[]>;
    removeProvider(key: string): void;
    addOneDriveAccount(name: string, clientId: string, clientSecret: string, refreshToken: string, tenantId?: string): Promise<string>;
    switchAccount(accountId: string | 'local'): Promise<void>;
    addAliyunOSSAccount(name: string, region: string, accessKeyId: string, accessKeySecret: string, bucket: string): Promise<any>;
    updateOneDriveConfig(clientId: string, clientSecret: string, refreshToken: string, tenantId?: string, name?: string): Promise<void>;
    switchToLocal(): Promise<void>;
}
export declare const storageManager: StorageManager;
