import { Api } from 'telegram';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';
import axios from 'axios';
import { query } from '../db/index.js';
import { storageManager } from './storage.js';
import { formatBytes, getFileType, getMimeTypeFromFilename, sanitizeFilename } from '../utils/telegramUtils.js';
import { generateThumbnail, getImageDimensions } from '../utils/thumbnail.js';

type YtDlpTaskStatus = 'pending' | 'active' | 'success' | 'failed';

interface YtDlpTask {
    id: string;
    url: string;
    status: YtDlpTaskStatus;
    createdAt: number;
    startedAt?: number;
    finishedAt?: number;
    error?: string;
}

class YtDlpQueue {
    private queue: Array<() => Promise<void>> = [];
    private activeCount = 0;
    constructor(private maxConcurrent: number) { }

    add(job: () => Promise<void>) {
        this.queue.push(job);
        this.process();
    }

    private process() {
        while (this.activeCount < this.maxConcurrent && this.queue.length > 0) {
            const job = this.queue.shift()!;
            this.activeCount += 1;
            job().finally(() => {
                this.activeCount -= 1;
                this.process();
            });
        }
    }
}

const YTDLP_BIN = process.env.YTDLP_BIN || 'yt-dlp';
const YTDLP_WORK_DIR = process.env.YTDLP_WORK_DIR || './data/uploads/ytdlp';
const YTDLP_MAX_CONCURRENT = Math.max(1, parseInt(process.env.YTDLP_MAX_CONCURRENT || '1', 10) || 1);

const ytDlpQueue = new YtDlpQueue(YTDLP_MAX_CONCURRENT);

function ensureDir(p: string) {
    if (!fs.existsSync(p)) {
        fs.mkdirSync(p, { recursive: true });
    }
}

function safeRmDir(dir: string) {
    try {
        if (fs.existsSync(dir)) {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    } catch {
    }
}

function isTwitterStatusUrl(u: string): boolean {
    return /^https?:\/\/(?:www\.)?(?:x\.com|twitter\.com)\//i.test(u) && /\/status\//i.test(u);
}

function extractTwitterStatusId(u: string): string | null {
    const match = u.match(/\/(?:i\/web\/status|[^/]+\/status)\/(\d+)/i);
    return match?.[1] || null;
}

function extractPbsImageUrlsFromHtml(html: string): string[] {
    const urls = new Set<string>();

    const re = /https:\/\/pbs\.twimg\.com\/media\/[^\s"'<>]+/gi;
    const matches = html.match(re) || [];

    for (const raw of matches) {
        try {
            const u = new URL(raw);
            u.hash = '';
            if (!u.searchParams.has('name')) u.searchParams.set('name', 'orig');
            if (u.searchParams.has('name')) u.searchParams.set('name', 'orig');
            urls.add(u.toString());
        } catch {
            urls.add(raw);
        }
    }

    return Array.from(urls);
}

function extractPbsImageUrlsFromSyndicationJson(payload: any): string[] {
    const urls = new Set<string>();
    try {
        const photos = payload?.photos;
        if (Array.isArray(photos)) {
            for (const p of photos) {
                if (p?.url && typeof p.url === 'string' && /pbs\.twimg\.com\/media\//i.test(p.url)) {
                    urls.add(p.url);
                }
            }
        }
    } catch {
    }
    return Array.from(urls);
}

async function downloadUrlToFile(url: string, destPath: string): Promise<void> {
    const res = await axios.get(url, {
        responseType: 'stream',
        headers: {
            'user-agent': 'Mozilla/5.0 (compatible; FoomClous/1.0; +https://github.com/nccttc/foomclous)'
        },
        timeout: 60_000,
        maxRedirects: 5,
        validateStatus: (s) => s >= 200 && s < 400,
    });

    await new Promise<void>((resolve, reject) => {
        const w = fs.createWriteStream(destPath);
        res.data.pipe(w);
        w.on('finish', () => resolve());
        w.on('error', reject);
    });
}

function guessExtFromPbsUrl(u: string): string {
    try {
        const url = new URL(u);
        const fmt = url.searchParams.get('format');
        if (fmt && /^[a-z0-9]+$/i.test(fmt)) return `.${fmt.toLowerCase()}`;
        const p = url.pathname;
        const ext = path.extname(p);
        if (ext) return ext;
    } catch {
    }
    return '.jpg';
}

async function downloadTwitterImagesFallback(tweetUrl: string, taskDir: string): Promise<Array<{ filePath: string; fileName: string; size: number }>> {
    ensureDir(taskDir);

    const tweetId = extractTwitterStatusId(tweetUrl);
    if (!tweetId) {
        throw new Error('无法解析推文 ID');
    }

    let imageUrls: string[] = [];
    try {
        const syndicationUrl = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&lang=en`;
        const synRes = await axios.get(syndicationUrl, {
            headers: {
                'user-agent': 'Mozilla/5.0 (compatible; FoomClous/1.0; +https://github.com/nccttc/foomclous)'
            },
            timeout: 30_000,
            maxRedirects: 5,
            validateStatus: (s) => s >= 200 && s < 400,
        });
        imageUrls = extractPbsImageUrlsFromSyndicationJson(synRes.data);
    } catch {
    }

    if (imageUrls.length === 0) {
        const htmlRes = await axios.get(tweetUrl, {
            headers: {
                'user-agent': 'Mozilla/5.0 (compatible; FoomClous/1.0; +https://github.com/nccttc/foomclous)'
            },
            timeout: 30_000,
            maxRedirects: 5,
            validateStatus: (s) => s >= 200 && s < 400,
        });

        const html = typeof htmlRes.data === 'string' ? htmlRes.data : String(htmlRes.data);
        imageUrls = extractPbsImageUrlsFromHtml(html);
    }

    if (imageUrls.length === 0) {
        throw new Error('未在推文页面中找到图片资源（可能需要登录或该推文不包含图片）');
    }

    const results: Array<{ filePath: string; fileName: string; size: number }> = [];

    for (let i = 0; i < imageUrls.length; i++) {
        const imgUrl = imageUrls[i];
        const ext = guessExtFromPbsUrl(imgUrl);
        const fileName = `twitter_${tweetId}_${i + 1}${ext}`;
        const filePath = path.join(taskDir, fileName);

        await downloadUrlToFile(imgUrl, filePath);

        const st = await fs.promises.stat(filePath);
        if (st.size <= 0) {
            continue;
        }
        results.push({ filePath, fileName, size: st.size });
    }

    if (results.length === 0) {
        throw new Error('图片下载完成但未生成有效文件');
    }
    return results;
}

function selectPrimaryOutputFile(taskDir: string): { filePath: string; fileName: string; size: number } | null {
    const entries = fs.readdirSync(taskDir, { withFileTypes: true });
    const files = entries
        .filter(e => e.isFile())
        .map(e => ({
            name: e.name,
            fullPath: path.join(taskDir, e.name),
        }))
        .filter(f => !f.name.endsWith('.part') && !f.name.endsWith('.ytdl') && !f.name.endsWith('.json') && !f.name.endsWith('.tmp'))
        .map(f => ({
            ...f,
            size: fs.existsSync(f.fullPath) ? fs.statSync(f.fullPath).size : 0
        }))
        .filter(f => f.size > 0)
        .sort((a, b) => b.size - a.size);

    if (files.length === 0) return null;
    return { filePath: files[0].fullPath, fileName: files[0].name, size: files[0].size };
}

async function runYtDlpDownload(url: string, taskDir: string): Promise<void> {
    ensureDir(taskDir);

    const outputTemplate = path.join(taskDir, '%(title).200s-%(id)s.%(ext)s');
    const args = [
        '--no-playlist',
        '--newline',
        '--merge-output-format',
        'mp4',
        '-o',
        outputTemplate,
        url,
    ];

    await new Promise<void>((resolve, reject) => {
        const binLower = YTDLP_BIN.toLowerCase();
        const isWindows = os.platform() === 'win32';
        const needsShell = isWindows && (binLower.endsWith('.cmd') || binLower.endsWith('.bat'));

        const child = spawn(YTDLP_BIN, args, {
            windowsHide: true,
            shell: needsShell,
        });

        let stderr = '';

        child.stderr.on('data', (d) => {
            stderr += d.toString();
            if (stderr.length > 4000) stderr = stderr.slice(-4000);
        });

        child.on('error', (err) => {
            reject(err);
        });

        child.on('close', (code) => {
            if (code === 0) {
                resolve();
                return;
            }
            const msg = stderr.trim() || `yt-dlp exited with code ${code}`;
            reject(new Error(msg));
        });
    });
}

async function uploadDownloadedFile(localFilePath: string, originalFileName: string): Promise<{ finalPath: string; providerName: string; size: number; storedName: string; folder: string }> {
    const provider = storageManager.getProvider();
    const activeAccountId = storageManager.getActiveAccountId();

    const safeName = sanitizeFilename(originalFileName);
    const ext = path.extname(safeName) || path.extname(localFilePath) || '';
    const storedName = `${uuidv4()}${ext}`;
    const mimeType = getMimeTypeFromFilename(safeName);
    const fileType = getFileType(mimeType);

    const stats = await fs.promises.stat(localFilePath);
    const size = stats.size;

    let thumbnailPath: string | null = null;
    let dimensions: { width?: number; height?: number } = {};
    try {
        thumbnailPath = await generateThumbnail(localFilePath, storedName, mimeType);
        dimensions = await getImageDimensions(localFilePath, mimeType);
    } catch {
    }

    let finalPath = localFilePath;
    if (provider.name !== 'local') {
        finalPath = await provider.saveFile(localFilePath, storedName, mimeType);
        try {
            if (fs.existsSync(localFilePath)) await fs.promises.unlink(localFilePath);
        } catch {
        }
    }

    const folder = 'ytdlp';

    await query(`
        INSERT INTO files (name, stored_name, type, mime_type, size, path, thumbnail_path, width, height, source, folder, storage_account_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [safeName, storedName, fileType, mimeType, size, finalPath, thumbnailPath, dimensions.width, dimensions.height, provider.name, folder, activeAccountId]);

    return { finalPath, providerName: provider.name, size, storedName, folder };
}

export async function handleYtDlpCommand(message: Api.Message, url: string): Promise<void> {
    const task: YtDlpTask = {
        id: uuidv4(),
        url,
        status: 'pending',
        createdAt: Date.now(),
    };

    const workBaseDir = path.isAbsolute(YTDLP_WORK_DIR) ? YTDLP_WORK_DIR : path.join(process.cwd(), YTDLP_WORK_DIR);
    ensureDir(workBaseDir);

    const taskDir = path.join(workBaseDir, task.id);

    await message.reply({ message: `⏬ 开始解析并下载...\nTask: ${task.id}` });

    ytDlpQueue.add(async () => {
        task.status = 'active';
        task.startedAt = Date.now();

        try {
            try {
                await runYtDlpDownload(task.url, taskDir);
                const primary = selectPrimaryOutputFile(taskDir);
                if (!primary) {
                    throw new Error('下载完成但未找到输出文件');
                }

                const uploadResult = await uploadDownloadedFile(primary.filePath, primary.fileName);

                task.status = 'success';
                task.finishedAt = Date.now();

                const text = `✅ 已上传\n\n文件: ${primary.fileName}\n大小: ${formatBytes(uploadResult.size)}\n存储源: ${uploadResult.providerName}`;

                try {
                    await message.reply({ message: text });
                } catch {
                }
            } catch (inner: any) {
                const innerMsg = (inner instanceof Error) ? inner.message : String(inner);
                const isNoVideo = /No video could be found in this tweet/i.test(innerMsg);

                if (isNoVideo && isTwitterStatusUrl(task.url)) {
                    const imgs = await downloadTwitterImagesFallback(task.url, taskDir);
                    let successCount = 0;
                    let totalSize = 0;
                    let providerName = '';

                    for (const img of imgs) {
                        const up = await uploadDownloadedFile(img.filePath, img.fileName);
                        providerName = up.providerName;
                        successCount += 1;
                        totalSize += up.size;
                    }

                    task.status = 'success';
                    task.finishedAt = Date.now();

                    const text = `✅ 已上传\n\n图片数量: ${successCount}\n总大小: ${formatBytes(totalSize)}\n存储源: ${providerName || 'unknown'}`;
                    try {
                        await message.reply({ message: text });
                    } catch {
                    }
                } else {
                    throw inner;
                }
            }

        } catch (e: any) {
            task.status = 'failed';
            task.finishedAt = Date.now();
            task.error = (e instanceof Error) ? e.message : String(e);

            const errText = (task.error || '未知错误').toString().trim();
            const trimmed = errText.length > 1500 ? errText.slice(0, 1500) + '...' : errText;

            try {
                await message.reply({ message: `❌ 下载/上传失败\n\n原因: ${trimmed}` });
            } catch {
            }
        } finally {
            safeRmDir(taskDir);
        }
    });
}
