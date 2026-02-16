import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
const YTDLP_TEMP_DIR = process.env.YTDLP_TEMP_DIR || './data/ytdlp-temp';
// 确保临时目录存在
if (!fs.existsSync(YTDLP_TEMP_DIR)) {
    fs.mkdirSync(YTDLP_TEMP_DIR, { recursive: true });
}
// 支持的域名正则表达式列表
const SUPPORTED_URL_PATTERNS = [
    /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/i,
    /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+/i,
    /^https?:\/\/(www\.)?instagram\.com\/.+/i,
    /^https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com)\/.+/i,
    /^https?:\/\/(www\.)?bilibili\.com\/.+/i,
    /^https?:\/\/(www\.)?vimeo\.com\/.+/i,
    /^https?:\/\/(www\.)?facebook\.com\/.+/i,
    /^https?:\/\/(www\.)?twitch\.tv\/.+/i,
    /^https?:\/\/(www\.)?dailymotion\.com\/.+/i,
    /^https?:\/\/(www\.)?reddit\.com\/.+/i,
    /^https?:\/\/(www\.)?pinterest\.com\/.+/i,
    /^https?:\/\/(www\.)?tumblr\.com\/.+/i,
    /^https?:\/\/(www\.)?soundcloud\.com\/.+/i,
    /^https?:\/\/(www\.)?mixcloud\.com\/.+/i,
    /^https?:\/\/(www\.)?bandcamp\.com\/.+/i,
    /^https?:\/\/(www\.)?pornhub\.com\/.+/i,
    /^https?:\/\/(www\.)?xvideos\.com\/.+/i,
    /^https?:\/\/(www\.)?weibo\.com\/.+/i,
    /^https?:\/\/(www\.)?nicovideo\.jp\/.+/i,
    // 更宽泛的 URL 匹配，yt-dlp 支持 1000+ 网站
    /^https?:\/\/.+\.(mp4|webm|m3u8|mpd)/i,
];
/**
 * 检查 URL 是否可能被 yt-dlp 支持
 */
export function isLikelySupportedUrl(url) {
    // 基本 URL 格式检查
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return false;
    }
    // 检查是否匹配已知的支持域名
    for (const pattern of SUPPORTED_URL_PATTERNS) {
        if (pattern.test(url)) {
            return true;
        }
    }
    return false;
}
/**
 * 从文本中提取 URL
 */
export function extractUrls(text) {
    const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi;
    const matches = text.match(urlRegex);
    return matches || [];
}
/**
 * 获取视频信息（不下载）
 */
export async function getVideoInfo(url) {
    return new Promise((resolve) => {
        const args = [
            '--dump-json',
            '--no-download',
            '--no-playlist',
            '--no-warnings',
            url
        ];
        let output = '';
        let errorOutput = '';
        const process = spawn('yt-dlp', args, {
            timeout: 60000 // 60秒超时
        });
        process.stdout.on('data', (data) => {
            output += data.toString();
        });
        process.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        process.on('close', (code) => {
            if (code !== 0 || !output.trim()) {
                console.error('🎬 yt-dlp 获取信息失败:', errorOutput || '未知错误');
                resolve(null);
                return;
            }
            try {
                const info = JSON.parse(output);
                const videoInfo = {
                    id: info.id || '',
                    title: info.title || info.fulltitle || 'Unknown',
                    description: info.description?.substring(0, 500),
                    duration: info.duration,
                    uploader: info.uploader || info.channel || info.creator,
                    uploadDate: info.upload_date,
                    thumbnailUrl: info.thumbnail,
                    filesize: info.filesize || info.filesize_approx,
                    ext: info.ext || 'mp4',
                    webpage_url: info.webpage_url,
                    extractor: info.extractor,
                };
                resolve(videoInfo);
            }
            catch (e) {
                console.error('🎬 解析视频信息失败:', e);
                resolve(null);
            }
        });
        process.on('error', (err) => {
            console.error('🎬 yt-dlp 进程错误:', err);
            resolve(null);
        });
    });
}
/**
 * 格式化时长
 */
export function formatDuration(seconds) {
    if (!seconds || isNaN(seconds))
        return '未知';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
        return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${mins}:${String(secs).padStart(2, '0')}`;
}
/**
 * 格式化文件大小
 */
export function formatBytes(bytes) {
    if (!bytes || isNaN(bytes))
        return '未知';
    if (bytes === 0)
        return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
/**
 * 下载视频
 * @param url 视频URL
 * @param onProgress 进度回调
 * @returns 下载结果
 */
export async function downloadVideo(url, onProgress) {
    return new Promise((resolve) => {
        const downloadId = uuidv4();
        const outputTemplate = path.join(YTDLP_TEMP_DIR, `${downloadId}.%(ext)s`);
        const args = [
            '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            '--merge-output-format', 'mp4',
            '-o', outputTemplate,
            '--no-playlist',
            '--no-warnings',
            '--progress',
            '--newline',
            '--no-mtime',
            url
        ];
        let lastFilename = '';
        let downloadedFile = '';
        let errorOutput = '';
        console.log(`🎬 开始下载: ${url}`);
        const process = spawn('yt-dlp', args);
        process.stdout.on('data', (data) => {
            const lines = data.toString().split('\n');
            for (const line of lines) {
                // 解析进度信息
                // 格式: [download] 25.0% of 10.00MiB at 1.00MiB/s ETA 00:07
                const progressMatch = line.match(/\[download\]\s+(\d+\.?\d*)%\s+of\s+~?(\d+\.?\d*)(K|M|G)?iB\s+at\s+(\S+)\s+ETA\s+(\S+)/i);
                if (progressMatch && onProgress) {
                    const percent = parseFloat(progressMatch[1]);
                    let totalBytes = parseFloat(progressMatch[2]);
                    const unit = progressMatch[3]?.toUpperCase();
                    // 转换为字节
                    if (unit === 'K')
                        totalBytes *= 1024;
                    else if (unit === 'M')
                        totalBytes *= 1024 * 1024;
                    else if (unit === 'G')
                        totalBytes *= 1024 * 1024 * 1024;
                    onProgress({
                        status: 'downloading',
                        percent,
                        downloaded: totalBytes * (percent / 100),
                        total: totalBytes,
                        speed: progressMatch[4],
                        eta: progressMatch[5],
                    });
                }
                // 检测下载完成的文件名
                // 格式: [download] Destination: /path/to/file.mp4
                const destMatch = line.match(/\[download\] Destination: (.+)/);
                if (destMatch) {
                    lastFilename = destMatch[1].trim();
                }
                // 检测合并完成
                // 格式: [Merger] Merging formats into "/path/to/file.mp4"
                const mergeMatch = line.match(/\[Merger\] Merging formats into "(.+)"/);
                if (mergeMatch) {
                    downloadedFile = mergeMatch[1];
                    if (onProgress) {
                        onProgress({
                            status: 'processing',
                            percent: 100,
                            filename: path.basename(downloadedFile),
                        });
                    }
                }
                // 检测已存在的文件
                // 格式: [download] /path/to/file.mp4 has already been downloaded
                const existsMatch = line.match(/\[download\] (.+) has already been downloaded/);
                if (existsMatch) {
                    downloadedFile = existsMatch[1].trim();
                }
            }
        });
        process.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        process.on('close', (code) => {
            // 查找下载的文件
            if (!downloadedFile) {
                // 尝试从临时目录找到文件
                try {
                    const files = fs.readdirSync(YTDLP_TEMP_DIR);
                    const matchingFile = files.find(f => f.startsWith(downloadId));
                    if (matchingFile) {
                        downloadedFile = path.join(YTDLP_TEMP_DIR, matchingFile);
                    }
                    else if (lastFilename && fs.existsSync(lastFilename)) {
                        downloadedFile = lastFilename;
                    }
                }
                catch (e) {
                    console.error('🎬 查找下载文件失败:', e);
                }
            }
            if (code !== 0 || !downloadedFile || !fs.existsSync(downloadedFile)) {
                console.error('🎬 yt-dlp 下载失败:', errorOutput || '文件未找到');
                if (onProgress) {
                    onProgress({
                        status: 'error',
                        filename: errorOutput || '下载失败'
                    });
                }
                resolve({
                    success: false,
                    error: errorOutput || '下载失败或文件未找到'
                });
                return;
            }
            const stats = fs.statSync(downloadedFile);
            const filename = path.basename(downloadedFile);
            console.log(`🎬 下载完成: ${filename} (${formatBytes(stats.size)})`);
            if (onProgress) {
                onProgress({
                    status: 'done',
                    percent: 100,
                    filename,
                });
            }
            resolve({
                success: true,
                filePath: downloadedFile,
                filename,
                filesize: stats.size,
            });
        });
        process.on('error', (err) => {
            console.error('🎬 yt-dlp 进程错误:', err);
            if (onProgress) {
                onProgress({
                    status: 'error',
                    filename: err.message
                });
            }
            resolve({
                success: false,
                error: `进程错误: ${err.message}`
            });
        });
    });
}
/**
 * 删除临时文件
 */
export function cleanupTempFile(filePath) {
    try {
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🎬 已清理临时文件: ${path.basename(filePath)}`);
        }
    }
    catch (e) {
        console.error('🎬 清理临时文件失败:', e);
    }
}
/**
 * 清理所有临时文件（超过指定时间的）
 */
export function cleanupOldTempFiles(maxAgeHours = 24) {
    try {
        if (!fs.existsSync(YTDLP_TEMP_DIR))
            return;
        const files = fs.readdirSync(YTDLP_TEMP_DIR);
        const now = Date.now();
        const maxAge = maxAgeHours * 60 * 60 * 1000;
        for (const file of files) {
            const filePath = path.join(YTDLP_TEMP_DIR, file);
            const stats = fs.statSync(filePath);
            if (now - stats.mtimeMs > maxAge) {
                fs.unlinkSync(filePath);
                console.log(`🎬 清理过期临时文件: ${file}`);
            }
        }
    }
    catch (e) {
        console.error('🎬 清理临时目录失败:', e);
    }
}
// 定期清理临时文件（每小时）
setInterval(() => {
    cleanupOldTempFiles(24);
}, 60 * 60 * 1000);
export default {
    isLikelySupportedUrl,
    extractUrls,
    getVideoInfo,
    downloadVideo,
    cleanupTempFile,
    cleanupOldTempFiles,
    formatDuration,
    formatBytes,
};
