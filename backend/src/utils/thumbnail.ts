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
    const absFilePath = path.resolve(filePath);
    const thumbName = `thumb_${path.parse(storedName).name}.webp`;
    const thumbPath = path.join(THUMBNAIL_DIR, thumbName);

    console.log(`[Thumbnail] 🚀 Starting generation for: ${storedName}`);
    console.log(`[Thumbnail] Source: ${absFilePath}`);
    console.log(`[Thumbnail] Target: ${thumbPath}`);
    console.log(`[Thumbnail] MIME: ${mimeType}`);

    if (!fs.existsSync(absFilePath)) {
        console.error(`[Thumbnail] ❌ Source file does not exist: ${absFilePath}`);
        return null;
    }

    try {
        if (mimeType.startsWith('image/')) {
            console.log(`[Thumbnail] 🖼️  Processing image with Sharp...`);
            await sharp(absFilePath)
                .resize(400, 300, { fit: 'inside', withoutEnlargement: true })
                .webp({ quality: 80 })
                .toFile(thumbPath);
            console.log(`[Thumbnail] ✅ Image thumbnail created: ${thumbName}`);
            return thumbPath;
        } else if (mimeType.startsWith('video/')) {
            console.log(`[Thumbnail] 🎬 Processing video with Ffmpeg...`);
            return new Promise((resolve) => {
                ffmpeg(absFilePath)
                    .screenshots({
                        count: 1,
                        folder: THUMBNAIL_DIR,
                        filename: thumbName,
                        size: '400x300',
                        timestamps: ['10%', '00:00:01'],
                    })
                    .on('start', (cmd) => console.log(`[Thumbnail] FFmpeg CMD: ${cmd}`))
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

export async function getImageDimensions(filePath: string, mimeType: string): Promise<{ width: number; height: number }> {
    const absFilePath = path.resolve(filePath);
    console.log(`[Dimensions] 📏 Getting dimensions for: ${absFilePath} (${mimeType})`);

    try {
        if (mimeType.startsWith('image/')) {
            const metadata = await sharp(absFilePath).metadata();
            const result = { width: metadata.width || 0, height: metadata.height || 0 };
            console.log(`[Dimensions] ✅ Image dimensions: ${result.width}x${result.height}`);
            return result;
        } else if (mimeType.startsWith('video/')) {
            return new Promise((resolve) => {
                ffmpeg.ffprobe(absFilePath, (err, metadata) => {
                    if (err) {
                        console.error(`[Dimensions] ❌ Probe failed:`, err.message);
                        resolve({ width: 0, height: 0 });
                    } else {
                        const stream = metadata.streams.find(s => s.width && s.height);
                        const result = {
                            width: stream?.width || 0,
                            height: stream?.height || 0
                        };
                        console.log(`[Dimensions] ✅ Video dimensions: ${result.width}x${result.height}`);
                        resolve(result);
                    }
                });
            });
        }
    } catch (error) {
        console.error('Get dimensions failed:', error);
    }
    return { width: 0, height: 0 };
}
