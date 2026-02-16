/**
 * 为图片或视频生成缩略图
 * @returns 返回生成的缩略图绝对路径，失败返回 null
 */
export declare function generateThumbnail(filePath: string, storedName: string, mimeType: string): Promise<string | null>;
export declare function getImageDimensions(filePath: string, mimeType: string): Promise<{
    width: number;
    height: number;
}>;
