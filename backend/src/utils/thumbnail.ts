import path from 'path';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';

const THUMBNAIL_DIR = path.resolve(process.env.THUMBNAIL_DIR || './data/thumbnails');

// 确保目录存在
if (!fs.existsSync(THUMBNAIL_DIR)) {
    fs.mkdirSync(THUMBNAIL_DIR, { recursive: true });
}

/**
 * 为图片或视频生成缩略图
 * @returns 返回生成的缩略图绝对路径，失败返回 null
 */
export async function generateThumbnail(filePath: string, storedName: string, mimeType: string): Promise<string | null> {
    const thumbName = `thumb_${path.parse(storedName).name}.webp`;
    const thumbPath = path.join(THUMBNAIL_DIR, thumbName);

    try {
        if (mimeType.startsWith('image/')) {
            await sharp(filePath)
                .resize(400, 300, { fit: 'cover' })
                .webp({ quality: 80 })
                .toFile(thumbPath);
            return thumbPath;
        } else if (mimeType.startsWith('video/')) {
            return new Promise((resolve) => {
                console.log(`🎬 Start generating thumbnail for video: ${filePath} -> ${thumbName}`);
                // Ensure THUMBNAIL_DIR exists just in case
                if (!fs.existsSync(THUMBNAIL_DIR)) {
                    try {
                        fs.mkdirSync(THUMBNAIL_DIR, { recursive: true });
                        console.log(`📁 Created thumbnail directory: ${THUMBNAIL_DIR}`);
                    } catch (e) {
                        console.error(`❌ Failed to create thumbnail directory:`, e);
                    }
                }

                ffmpeg(filePath)
                    .screenshots({
                        count: 1,
                        folder: THUMBNAIL_DIR,
                        filename: thumbName,
                        size: '400x300',
                        timestamps: ['10%', '00:00:01'], // Try 10% first, then 1 second
                    })
                    .on('start', (commandLine) => {
                        console.log(`🎬 Spawned Ffmpeg with command: ${commandLine}`);
                    })
                    .on('end', () => {
                        console.log(`✅ Video thumbnail created: ${thumbPath}`);
                        resolve(thumbPath);
                    })
                    .on('error', (err) => {
                        console.error(`❌ Video thumbnail generation failed for ${filePath}:`, err);
                        resolve(null);
                    });
            });
        }
    } catch (error) {
        console.error('Thumbnail generation failed:', error);
    }
    return null;
}

export async function getImageDimensions(filePath: string, mimeType: string): Promise<{ width?: number; height?: number }> {
    try {
        if (mimeType.startsWith('image/')) {
            const metadata = await sharp(filePath).metadata();
            return { width: metadata.width, height: metadata.height };
        } else if (mimeType.startsWith('video/')) {
            return new Promise((resolve) => {
                ffmpeg.ffprobe(filePath, (err, metadata) => {
                    if (err) {
                        console.error('ffprobe failed:', err);
                        resolve({});
                        return;
                    }
                    // Find video stream
                    const stream = metadata.streams.find(s => s.codec_type === 'video');
                    if (stream) {
                        // Some videos have rotation metadata, might need to swap width/height? 
                        // For now keep simple
                        resolve({ width: stream.width, height: stream.height });
                    } else {
                        resolve({});
                    }
                });
            });
        }
    } catch (error) {
        console.error('Get dimensions failed:', error);
    }
    return {};
}
