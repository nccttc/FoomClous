var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/db/index.ts
import pg from "pg";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
async function initializeDatabase() {
  try {
    const schemaPath = path.join(__dirname, "schema.sql");
    const schemaSql = await fs.readFile(schemaPath, "utf-8");
    const statements = [];
    let current = "";
    let inDollarQuote = false;
    for (let i = 0; i < schemaSql.length; i++) {
      const char = schemaSql[i];
      current += char;
      if (char === "$" && schemaSql[i + 1] === "$") {
        inDollarQuote = !inDollarQuote;
        current += "$";
        i++;
      } else if (char === ";" && !inDollarQuote) {
        const stmt = current.trim();
        if (stmt.length > 1 && !stmt.startsWith("--")) {
          statements.push(stmt.slice(0, -1));
        }
        current = "";
      }
    }
    const lastStmt = current.trim();
    if (lastStmt.length > 0 && !lastStmt.startsWith("--")) {
      statements.push(lastStmt);
    }
    for (const statement of statements) {
      try {
        await pool.query(statement);
      } catch (err) {
        if (err.message?.includes("already exists")) {
          continue;
        }
        throw err;
      }
    }
    console.log("\u2705 \u6570\u636E\u5E93\u8868\u7ED3\u6784\u521D\u59CB\u5316\u5B8C\u6210");
  } catch (err) {
    console.error("\u274C \u6570\u636E\u5E93\u521D\u59CB\u5316\u5931\u8D25:", err);
    throw err;
  }
}
var __filename, __dirname, Pool, pool, query;
var init_db = __esm({
  "src/db/index.ts"() {
    "use strict";
    __filename = fileURLToPath(import.meta.url);
    __dirname = path.dirname(__filename);
    dotenv.config();
    ({ Pool } = pg);
    pool = new Pool({
      connectionString: process.env.DATABASE_URL || "postgresql://foomclous:password@localhost:5432/foomclous"
    });
    pool.on("connect", async () => {
      console.log("\u{1F4E6} \u5DF2\u8FDE\u63A5\u5230 PostgreSQL \u6570\u636E\u5E93");
      await initializeDatabase();
    });
    pool.on("error", (err) => {
      console.error("\u274C \u6570\u636E\u5E93\u8FDE\u63A5\u9519\u8BEF:", err);
    });
    query = async (text, params) => {
      const start = Date.now();
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log("\u{1F50D} \u6267\u884C\u67E5\u8BE2", { text: text.substring(0, 50), duration, rows: res.rowCount });
      return res;
    };
  }
});

// src/services/storage.ts
var storage_exports = {};
__export(storage_exports, {
  AliyunOSSStorageProvider: () => AliyunOSSStorageProvider,
  GoogleDriveStorageProvider: () => GoogleDriveStorageProvider,
  LocalStorageProvider: () => LocalStorageProvider,
  OneDriveStorageProvider: () => OneDriveStorageProvider,
  S3StorageProvider: () => S3StorageProvider,
  StorageManager: () => StorageManager,
  WebDAVStorageProvider: () => WebDAVStorageProvider,
  storageManager: () => storageManager
});
import fs2 from "fs";
import path2 from "path";
import axios from "axios";
import OSS from "ali-oss";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl as getS3SignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "webdav";
import { google } from "googleapis";
var LocalStorageProvider, AliyunOSSStorageProvider, S3StorageProvider, WebDAVStorageProvider, OneDriveStorageProvider, GoogleDriveStorageProvider, StorageManager, storageManager;
var init_storage = __esm({
  "src/services/storage.ts"() {
    "use strict";
    init_db();
    LocalStorageProvider = class {
      name = "local";
      uploadDir;
      constructor(uploadDir = process.env.UPLOAD_DIR || "./data/uploads") {
        this.uploadDir = uploadDir;
        if (!fs2.existsSync(this.uploadDir)) {
          fs2.mkdirSync(this.uploadDir, { recursive: true });
        }
      }
      async saveFile(tempPath, fileName) {
        const destPath = path2.join(this.uploadDir, fileName);
        try {
          await fs2.promises.rename(tempPath, destPath);
        } catch (error) {
          if (error.code === "EXDEV") {
            await fs2.promises.copyFile(tempPath, destPath);
            await fs2.promises.unlink(tempPath);
          } else {
            throw error;
          }
        }
        return destPath;
      }
      async getFileStream(storedPath) {
        if (!fs2.existsSync(storedPath)) {
          throw new Error(`File not found: ${storedPath}`);
        }
        return fs2.createReadStream(storedPath);
      }
      async getPreviewUrl(storedPath) {
        return "";
      }
      async deleteFile(storedPath) {
        if (fs2.existsSync(storedPath)) {
          await fs2.promises.unlink(storedPath);
        }
      }
      async createShareLink(storedPath, password, expiration) {
        return { link: "", error: "\u672C\u5730\u5B58\u50A8\u6682\u4E0D\u652F\u6301\u751F\u6210\u5206\u4EAB\u94FE\u63A5\uFF0C\u8BF7\u4F7F\u7528 OneDrive \u5B58\u50A8\u3002" };
      }
    };
    AliyunOSSStorageProvider = class {
      constructor(id, region, accessKeyId, accessKeySecret, bucket) {
        this.id = id;
        const sanitizedRegion = this.sanitizeRegion(region);
        this.client = new OSS({
          region: sanitizedRegion,
          accessKeyId,
          accessKeySecret,
          bucket,
          secure: true
        });
      }
      name = "aliyun_oss";
      client;
      sanitizeRegion(region) {
        let r = region.trim().toLowerCase();
        r = r.replace(/^https?:\/\//, "");
        if (r.includes(".aliyuncs.com")) {
          r = r.split(".")[0];
        }
        return r;
      }
      async saveFile(tempPath, fileName) {
        try {
          const result = await this.client.put(fileName, tempPath);
          console.log("[AliyunOSS] Upload successful:", result.name);
          return result.name;
        } catch (error) {
          console.error("[AliyunOSS] Upload failed:", error.message);
          throw new Error(`Aliyun OSS upload failed: ${error.message}`);
        }
      }
      async getFileStream(storedPath) {
        try {
          const result = await this.client.getStream(storedPath);
          return result.stream;
        } catch (error) {
          console.error("[AliyunOSS] Get stream failed:", error.message);
          throw new Error(`Aliyun OSS get stream failed: ${error.message}`);
        }
      }
      async getPreviewUrl(storedPath) {
        try {
          const url = this.client.signatureUrl(storedPath, { expires: 3600 });
          return url;
        } catch (error) {
          console.error("[AliyunOSS] Get preview URL failed:", error.message);
          return "";
        }
      }
      async deleteFile(storedPath) {
        try {
          await this.client.delete(storedPath);
          console.log("[AliyunOSS] Delete successful:", storedPath);
        } catch (error) {
          console.error("[AliyunOSS] Delete failed:", error.message);
          throw new Error(`Aliyun OSS delete failed: ${error.message}`);
        }
      }
      async getFileSize(storedPath) {
        try {
          const result = await this.client.head(storedPath);
          return parseInt(result.meta["content-length"] || result.res.headers["content-length"] || "0");
        } catch (error) {
          console.error("[AliyunOSS] Get file size failed:", error.message);
          return 0;
        }
      }
    };
    S3StorageProvider = class {
      constructor(id, endpoint, region, accessKeyId, secretAccessKey, bucket, forcePathStyle = false) {
        this.id = id;
        this.endpoint = endpoint;
        this.region = region;
        this.accessKeyId = accessKeyId;
        this.secretAccessKey = secretAccessKey;
        this.bucket = bucket;
        this.forcePathStyle = forcePathStyle;
        this.client = new S3Client({
          endpoint,
          region,
          credentials: {
            accessKeyId,
            secretAccessKey
          },
          forcePathStyle
        });
      }
      name = "s3";
      client;
      async saveFile(tempPath, fileName, mimeType) {
        try {
          const fileBuffer = fs2.readFileSync(tempPath);
          const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: fileName,
            Body: fileBuffer,
            ContentType: mimeType
          });
          await this.client.send(command);
          return fileName;
        } catch (error) {
          console.error("[S3] Upload failed:", error.message);
          throw new Error(`S3 upload failed: ${error.message}`);
        }
      }
      async getFileStream(storedPath) {
        try {
          const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: storedPath
          });
          const response = await this.client.send(command);
          return response.Body;
        } catch (error) {
          console.error("[S3] Get stream failed:", error.message);
          throw new Error(`S3 get stream failed: ${error.message}`);
        }
      }
      async getPreviewUrl(storedPath) {
        try {
          const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: storedPath
          });
          return await getS3SignedUrl(this.client, command, { expiresIn: 3600 });
        } catch (error) {
          console.error("[S3] Get preview URL failed:", error.message);
          return "";
        }
      }
      async deleteFile(storedPath) {
        try {
          const command = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: storedPath
          });
          await this.client.send(command);
        } catch (error) {
          console.error("[S3] Delete failed:", error.message);
          throw new Error(`S3 delete failed: ${error.message}`);
        }
      }
      async getFileSize(storedPath) {
        try {
          const command = new HeadObjectCommand({
            Bucket: this.bucket,
            Key: storedPath
          });
          const response = await this.client.send(command);
          return response.ContentLength || 0;
        } catch (error) {
          console.error("[S3] Get file size failed:", error.message);
          return 0;
        }
      }
    };
    WebDAVStorageProvider = class {
      constructor(id, url, username, password) {
        this.id = id;
        this.url = url;
        this.username = username;
        this.password = password;
        this.client = createClient(url, {
          username,
          password
        });
      }
      name = "webdav";
      client;
      async saveFile(tempPath, fileName) {
        try {
          const fileBuffer = fs2.readFileSync(tempPath);
          await this.client.putFileContents(`/${fileName}`, fileBuffer);
          console.log("[WebDAV] Upload successful:", fileName);
          return fileName;
        } catch (error) {
          console.error("[WebDAV] Upload failed:", error.message);
          throw new Error(`WebDAV upload failed: ${error.message}`);
        }
      }
      async getFileStream(storedPath) {
        try {
          return this.client.createReadStream(`/${storedPath}`);
        } catch (error) {
          console.error("[WebDAV] Get stream failed:", error.message);
          throw new Error(`WebDAV get stream failed: ${error.message}`);
        }
      }
      async getPreviewUrl(storedPath) {
        return "";
      }
      async deleteFile(storedPath) {
        try {
          await this.client.deleteFile(`/${storedPath}`);
          console.log("[WebDAV] Delete successful:", storedPath);
        } catch (error) {
          console.error("[WebDAV] Delete failed:", error.message);
          throw new Error(`WebDAV delete failed: ${error.message}`);
        }
      }
      async getFileSize(storedPath) {
        try {
          const stat = await this.client.stat(`/${storedPath}`);
          return stat.size || 0;
        } catch (error) {
          console.error("[WebDAV] Get file size failed:", error.message);
          return 0;
        }
      }
    };
    OneDriveStorageProvider = class {
      // 存储文件夹名
      constructor(id, clientId, clientSecret, refreshToken, tenantId = "common") {
        this.id = id;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.refreshToken = refreshToken;
        this.tenantId = tenantId;
        console.log(`[OneDrive] Provider ${id} initialized with clientId:`, clientId.substring(0, 8) + "...", "Tenant:", tenantId);
      }
      name = "onedrive";
      accessToken = null;
      tokenExpiresAt = 0;
      ONEDRIVE_FOLDER = "FoomClous";
      /**
       * 生成 OAuth 授权 URL
       */
      static generateAuthUrl(clientId, tenantId = "common", redirectUri) {
        const scope = encodeURIComponent("Files.ReadWrite.All offline_access");
        const encodedRedirect = encodeURIComponent(redirectUri);
        return `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&scope=${scope}&response_type=code&redirect_uri=${encodedRedirect}&response_mode=query`;
      }
      /**
       * 使用授权码交换令牌
       */
      static async exchangeCodeForToken(clientId, clientSecret, tenantId = "common", redirectUri, code) {
        const params = new URLSearchParams();
        params.append("client_id", clientId);
        if (clientSecret) params.append("client_secret", clientSecret);
        params.append("code", code);
        params.append("grant_type", "authorization_code");
        params.append("redirect_uri", redirectUri);
        const endpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
        const response = await axios.post(endpoint, params.toString(), {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          timeout: 3e4
        });
        return response.data;
      }
      /**
       * 获取有效的访问令牌，自动刷新过期令牌
       */
      async getAccessToken() {
        if (this.accessToken && Date.now() < this.tokenExpiresAt - 3e5) {
          return this.accessToken;
        }
        console.log("[OneDrive] Refreshing access token...");
        let lastError = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const params = new URLSearchParams();
            params.append("client_id", this.clientId.trim());
            if (this.clientSecret && this.clientSecret.trim()) {
              params.append("client_secret", this.clientSecret.trim());
            }
            params.append("refresh_token", this.refreshToken.trim());
            params.append("grant_type", "refresh_token");
            const endpoint = `https://login.microsoftonline.com/${this.tenantId.trim()}/oauth2/v2.0/token`;
            console.log(`[OneDrive] Refreshing token. ClientID: ${this.clientId}, HasSecret: ${!!this.clientSecret}, Scope: ${params.get("scope")}`);
            const response = await axios.post(
              endpoint,
              params.toString(),
              {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                timeout: 3e4
              }
            );
            this.accessToken = response.data.access_token;
            this.tokenExpiresAt = Date.now() + response.data.expires_in * 1e3;
            console.log("[OneDrive] Token refreshed successfully, expires in:", response.data.expires_in, "seconds");
            if (response.data.refresh_token && response.data.refresh_token !== this.refreshToken) {
              console.log(`[OneDrive] New refresh token received for account ${this.id}, updating database...`);
              this.refreshToken = response.data.refresh_token;
              await StorageManager.updateAccountToken(this.id, this.refreshToken);
            }
            return this.accessToken;
          } catch (error) {
            lastError = error;
            const errorData = error.response?.data;
            console.error(`[OneDrive] Token refresh attempt ${attempt}/3 failed:`, {
              status: error.response?.status,
              error: errorData?.error,
              description: errorData?.error_description
            });
            if (attempt < 3) {
              await new Promise((resolve) => setTimeout(resolve, 1e3 * attempt));
            }
          }
        }
        throw new Error(`Failed to refresh OneDrive token after 3 attempts: ${lastError?.response?.data?.error_description || lastError?.message}`);
      }
      /**
       * 确保存储文件夹存在
       */
      async ensureFolderExists(token) {
        try {
          await axios.get(
            `https://graph.microsoft.com/v1.0/me/drive/root:/${this.ONEDRIVE_FOLDER}`,
            { headers: { "Authorization": `Bearer ${token}` } }
          );
        } catch (error) {
          if (error.response?.status === 404) {
            console.log("[OneDrive] Creating storage folder:", this.ONEDRIVE_FOLDER);
            await axios.post(
              `https://graph.microsoft.com/v1.0/me/drive/root/children`,
              {
                name: this.ONEDRIVE_FOLDER,
                folder: {},
                "@microsoft.graph.conflictBehavior": "fail"
              },
              {
                headers: {
                  "Authorization": `Bearer ${token}`,
                  "Content-Type": "application/json"
                }
              }
            );
            console.log("[OneDrive] Storage folder created successfully");
          } else {
            throw error;
          }
        }
      }
      /**
       * 保存文件到 OneDrive
       */
      async saveFile(tempPath, fileName, mimeType) {
        const token = await this.getAccessToken();
        const stats = await fs2.promises.stat(tempPath);
        const fileSize = stats.size;
        console.log(`[OneDrive] Uploading file: ${fileName}, size: ${fileSize} bytes, type: ${mimeType}`);
        await this.ensureFolderExists(token);
        const encodedFileName = encodeURIComponent(fileName);
        try {
          if (fileSize < 4 * 1024 * 1024) {
            console.log("[OneDrive] Using simple upload for small file");
            const fileBuffer = await fs2.promises.readFile(tempPath);
            const response = await axios.put(
              `https://graph.microsoft.com/v1.0/me/drive/root:/${this.ONEDRIVE_FOLDER}/${encodedFileName}:/content`,
              fileBuffer,
              {
                headers: {
                  "Authorization": `Bearer ${token}`,
                  "Content-Type": mimeType || "application/octet-stream",
                  "Content-Length": fileSize.toString()
                },
                maxBodyLength: Infinity,
                maxContentLength: Infinity,
                timeout: 6e4
              }
            );
            console.log("[OneDrive] Simple upload successful, file ID:", response.data.id);
            return response.data.id;
          } else {
            console.log("[OneDrive] Using chunked upload session for large file");
            const sessionRes = await axios.post(
              `https://graph.microsoft.com/v1.0/me/drive/root:/${this.ONEDRIVE_FOLDER}/${encodedFileName}:/createUploadSession`,
              {
                item: {
                  "@microsoft.graph.conflictBehavior": "rename",
                  name: fileName
                }
              },
              {
                headers: {
                  "Authorization": `Bearer ${token}`,
                  "Content-Type": "application/json"
                },
                timeout: 3e4
              }
            );
            const uploadUrl = sessionRes.data.uploadUrl;
            console.log("[OneDrive] Upload session created");
            const CHUNK_SIZE = 320 * 1024 * 10;
            let uploadedBytes = 0;
            let lastResponse = null;
            const fd = await fs2.promises.open(tempPath, "r");
            try {
              while (uploadedBytes < fileSize) {
                const chunkSize = Math.min(CHUNK_SIZE, fileSize - uploadedBytes);
                const buffer = Buffer.alloc(chunkSize);
                await fd.read(buffer, 0, chunkSize, uploadedBytes);
                const rangeEnd = uploadedBytes + chunkSize - 1;
                const contentRange = `bytes ${uploadedBytes}-${rangeEnd}/${fileSize}`;
                console.log(`[OneDrive] Uploading chunk: ${contentRange}`);
                lastResponse = await axios.put(uploadUrl, buffer, {
                  headers: {
                    "Content-Length": chunkSize.toString(),
                    "Content-Range": contentRange
                  },
                  maxBodyLength: Infinity,
                  maxContentLength: Infinity,
                  timeout: 12e4
                });
                uploadedBytes += chunkSize;
                const progress = Math.round(uploadedBytes / fileSize * 100);
                console.log(`[OneDrive] Upload progress: ${progress}%`);
              }
            } catch (chunkError) {
              await fd.close();
              console.error("[OneDrive] Chunk upload failed, cancelling session...");
              await this.cancelUploadSession(uploadUrl);
              throw chunkError;
            } finally {
              try {
                await fd.close();
              } catch {
              }
            }
            if (lastResponse?.data?.id) {
              console.log("[OneDrive] Chunked upload successful, file ID:", lastResponse.data.id);
              return lastResponse.data.id;
            }
            const itemRes = await axios.get(
              `https://graph.microsoft.com/v1.0/me/drive/root:/${this.ONEDRIVE_FOLDER}/${encodedFileName}`,
              {
                headers: { "Authorization": `Bearer ${token}` },
                timeout: 3e4
              }
            );
            console.log("[OneDrive] File ID retrieved:", itemRes.data.id);
            return itemRes.data.id;
          }
        } catch (error) {
          console.error("[OneDrive] Upload failed:", {
            status: error.response?.status,
            error: error.response?.data?.error,
            message: error.message
          });
          throw new Error(`OneDrive upload failed: ${error.response?.data?.error?.message || error.message}`);
        }
      }
      /**
       * 取消上传会话（清理服务器上的未完成上传）
       */
      async cancelUploadSession(uploadUrl) {
        try {
          await axios.delete(uploadUrl, { timeout: 1e4 });
          console.log("[OneDrive] Upload session cancelled successfully");
        } catch (error) {
          console.warn("[OneDrive] Failed to cancel upload session (may already be expired):", error.message);
        }
      }
      /**
       * 获取文件流用于下载
       */
      async getFileStream(storedPath) {
        const token = await this.getAccessToken();
        try {
          const response = await axios.get(
            `https://graph.microsoft.com/v1.0/me/drive/items/${storedPath}/content`,
            {
              headers: { "Authorization": `Bearer ${token}` },
              responseType: "stream",
              timeout: 6e4
            }
          );
          return response.data;
        } catch (error) {
          console.error("[OneDrive] Get file stream failed:", {
            fileId: storedPath,
            status: error.response?.status,
            error: error.response?.data?.error
          });
          throw new Error(`OneDrive download failed: ${error.response?.data?.error?.message || error.message}`);
        }
      }
      /**
       * 获取文件预览URL（临时下载链接，有效期约1小时）
       */
      async getPreviewUrl(storedPath) {
        const token = await this.getAccessToken();
        try {
          const response = await axios.get(
            `https://graph.microsoft.com/v1.0/me/drive/items/${storedPath}`,
            {
              headers: { "Authorization": `Bearer ${token}` },
              timeout: 3e4
            }
          );
          const downloadUrl = response.data["@microsoft.graph.downloadUrl"];
          if (!downloadUrl) {
            console.error("[OneDrive] Download URL missing from response:", {
              fileId: storedPath,
              responseKeys: Object.keys(response.data)
            });
            throw new Error("Download URL not available");
          }
          return downloadUrl;
        } catch (error) {
          console.error("[OneDrive] Get preview URL failed:", {
            fileId: storedPath,
            status: error.response?.status,
            error: error.response?.data?.error
          });
          throw new Error(`OneDrive preview URL failed: ${error.response?.data?.error?.message || error.message}`);
        }
      }
      /**
       * 删除文件
       */
      async deleteFile(storedPath) {
        const token = await this.getAccessToken();
        try {
          await axios.delete(
            `https://graph.microsoft.com/v1.0/me/drive/items/${storedPath}`,
            {
              headers: { "Authorization": `Bearer ${token}` },
              timeout: 3e4
            }
          );
          console.log("[OneDrive] File deleted:", storedPath);
        } catch (error) {
          if (error.response?.status === 404) {
            console.log("[OneDrive] File already deleted or not found:", storedPath);
            return;
          }
          console.error("[OneDrive] Delete file failed:", {
            fileId: storedPath,
            status: error.response?.status,
            error: error.response?.data?.error
          });
          throw new Error(`OneDrive delete failed: ${error.response?.data?.error?.message || error.message}`);
        }
      }
      /**
       * 获取文件大小
       */
      async getFileSize(storedPath) {
        const token = await this.getAccessToken();
        try {
          const response = await axios.get(
            `https://graph.microsoft.com/v1.0/me/drive/items/${storedPath}?$select=size`,
            {
              headers: { "Authorization": `Bearer ${token}` },
              timeout: 3e4
            }
          );
          return response.data.size || 0;
        } catch (error) {
          console.error("[OneDrive] Get file size failed:", error.message);
          return 0;
        }
      }
      /**
       * 创建分享链接
       */
      async createShareLink(storedPath, password, expiration) {
        const token = await this.getAccessToken();
        try {
          const body = {
            type: "view",
            scope: "anonymous"
            // 任何人（可能需要根据组织策略调整）
          };
          if (password) {
            body.password = password;
          }
          if (expiration) {
            body.expirationDateTime = expiration;
          }
          console.log(`[OneDrive] Creating share link for ${storedPath} with params:`, { ...body, password: body.password ? "***" : void 0 });
          const response = await axios.post(
            `https://graph.microsoft.com/v1.0/me/drive/items/${storedPath}/createLink`,
            body,
            {
              headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
              },
              timeout: 3e4
            }
          );
          if (response.data && response.data.link && response.data.link.webUrl) {
            console.log("[OneDrive] Share link created successfully");
            return { link: response.data.link.webUrl };
          } else {
            return { link: "", error: "OneDrive \u672A\u8FD4\u56DE\u6709\u6548\u7684\u5206\u4EAB\u94FE\u63A5" };
          }
        } catch (error) {
          console.error("[OneDrive] Create share link failed:", {
            status: error.response?.status,
            error: error.response?.data?.error
          });
          const errorData = error.response?.data?.error;
          if (errorData?.code === "notSupported" || errorData?.code === "invalidRequest") {
            if (password || expiration) {
              return { link: "", error: "\u60A8\u7684 OneDrive \u8D26\u6237\u53EF\u80FD\u4E0D\u652F\u6301\u8BBE\u7F6E\u5BC6\u7801\u6216\u8FC7\u671F\u65F6\u95F4\uFF0C\u8BF7\u5C1D\u8BD5\u4E0D\u5E26\u8FD9\u4E9B\u9009\u9879\u91CD\u8BD5\uFF0C\u6216\u68C0\u67E5 OneDrive \u8D26\u6237\u7C7B\u578B\uFF08\u90E8\u5206\u4E2A\u4EBA\u7248/\u5546\u4E1A\u7248\u9650\u5236\uFF09\u3002" };
            }
          }
          return { link: "", error: `\u521B\u5EFA\u5206\u4EAB\u94FE\u63A5\u5931\u8D25: ${errorData?.message || error.message}` };
        }
      }
    };
    GoogleDriveStorageProvider = class {
      constructor(id, clientId, clientSecret, refreshToken, redirectUri) {
        this.id = id;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.refreshToken = refreshToken;
        this.redirectUri = redirectUri;
        this.oauth2Client = new google.auth.OAuth2(
          this.clientId,
          this.clientSecret,
          this.redirectUri
        );
        this.oauth2Client.setCredentials({
          refresh_token: this.refreshToken
        });
        this.drive = google.drive({ version: "v3", auth: this.oauth2Client });
      }
      name = "google_drive";
      oauth2Client;
      drive;
      tokenExpiresAt = 0;
      GOOGLE_DRIVE_FOLDER = "FoomClous";
      static generateAuthUrl(clientId, clientSecret, redirectUri) {
        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
        return oauth2Client.generateAuthUrl({
          access_type: "offline",
          scope: ["https://www.googleapis.com/auth/drive.file"],
          prompt: "consent"
        });
      }
      static async exchangeCodeForToken(clientId, clientSecret, redirectUri, code) {
        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
        const { tokens } = await oauth2Client.getToken(code);
        return tokens;
      }
      async ensureAuthenticated() {
        const credentials = await this.oauth2Client.getAccessToken();
        if (credentials.token) {
          this.tokenExpiresAt = credentials.res?.data?.expiry_date || 0;
        }
      }
      async ensureFolderExists() {
        await this.ensureAuthenticated();
        const response = await this.drive.files.list({
          q: `name = '${this.GOOGLE_DRIVE_FOLDER}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
          fields: "files(id)",
          spaces: "drive"
        });
        if (response.data.files && response.data.files.length > 0) {
          return response.data.files[0].id;
        }
        const folderMetadata = {
          name: this.GOOGLE_DRIVE_FOLDER,
          mimeType: "application/vnd.google-apps.folder"
        };
        const folder = await this.drive.files.create({
          resource: folderMetadata,
          fields: "id"
        });
        return folder.data.id;
      }
      async saveFile(tempPath, fileName, mimeType) {
        await this.ensureAuthenticated();
        const folderId = await this.ensureFolderExists();
        const fileMetadata = {
          name: fileName,
          parents: [folderId]
        };
        const media = {
          mimeType,
          body: fs2.createReadStream(tempPath)
        };
        try {
          const file = await this.drive.files.create({
            resource: fileMetadata,
            media,
            fields: "id"
          });
          console.log("[GoogleDrive] Upload successful, file ID:", file.data.id);
          return file.data.id;
        } catch (error) {
          console.error("[GoogleDrive] Upload failed:", error.message);
          throw new Error(`Google Drive upload failed: ${error.message}`);
        }
      }
      async getFileStream(storedPath) {
        await this.ensureAuthenticated();
        try {
          const response = await this.drive.files.get(
            { fileId: storedPath, alt: "media" },
            { responseType: "stream" }
          );
          return response.data;
        } catch (error) {
          console.error("[GoogleDrive] Get stream failed:", error.message);
          throw new Error(`Google Drive get stream failed: ${error.message}`);
        }
      }
      async getPreviewUrl(storedPath) {
        return "";
      }
      async deleteFile(storedPath) {
        await this.ensureAuthenticated();
        try {
          await this.drive.files.delete({ fileId: storedPath });
          console.log("[GoogleDrive] Delete successful:", storedPath);
        } catch (error) {
          if (error.code === 404) {
            console.log("[GoogleDrive] File not found, skipping delete:", storedPath);
            return;
          }
          console.error("[GoogleDrive] Delete failed:", error.message);
          throw new Error(`Google Drive delete failed: ${error.message}`);
        }
      }
      async getFileSize(storedPath) {
        await this.ensureAuthenticated();
        try {
          const response = await this.drive.files.get({
            fileId: storedPath,
            fields: "size"
          });
          return parseInt(response.data.size || "0");
        } catch (error) {
          console.error("[GoogleDrive] Get file size failed:", error.message);
          return 0;
        }
      }
    };
    StorageManager = class _StorageManager {
      static instance;
      activeProvider;
      providers = /* @__PURE__ */ new Map();
      activeAccountId = null;
      constructor() {
        const local = new LocalStorageProvider();
        this.providers.set(local.name, local);
        this.activeProvider = local;
      }
      static getInstance() {
        if (!_StorageManager.instance) {
          _StorageManager.instance = new _StorageManager();
        }
        return _StorageManager.instance;
      }
      // 初始化：从数据库加载配置
      async init() {
        try {
          await query(`
                CREATE TABLE IF NOT EXISTS system_settings (
                    key VARCHAR(255) PRIMARY KEY,
                    value TEXT NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                
                CREATE TABLE IF NOT EXISTS storage_accounts (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    type VARCHAR(50) NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    config JSONB NOT NULL,
                    is_active BOOLEAN DEFAULT false,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                );

                -- \u786E\u4FDD files \u8868\u6709 storage_account_id \u5B57\u6BB5
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='files' AND column_name='storage_account_id') THEN
                        ALTER TABLE files ADD COLUMN storage_account_id UUID;
                    END IF;
                END $$;
            `);
          await this.migrateLegacyConfig();
          let providerRes = await query("SELECT value FROM system_settings WHERE key = $1", ["active_storage_provider"]);
          let providerName = providerRes.rows[0]?.value || null;
          if (!providerName) {
            const legacyRes = await query("SELECT value FROM system_settings WHERE key = $1", ["storage_provider"]);
            providerName = legacyRes.rows[0]?.value || "local";
            if (legacyRes.rows[0]) {
              console.log(`[StorageManager] Migrating legacy key 'storage_provider' -> 'active_storage_provider' = ${providerName}`);
              await _StorageManager.updateSetting("active_storage_provider", providerName);
            }
          }
          console.log(`[StorageManager] Active provider from settings: ${providerName}`);
          const accountsRes = await query("SELECT * FROM storage_accounts");
          const globalSecretRes = await query("SELECT value FROM system_settings WHERE key = 'onedrive_client_secret'");
          const globalSecret = globalSecretRes.rows[0]?.value || "";
          for (const row of accountsRes.rows) {
            const config = row.config;
            let provider = null;
            if (row.type === "onedrive") {
              provider = new OneDriveStorageProvider(
                row.id,
                config.clientId,
                config.clientSecret || globalSecret || "",
                config.refreshToken,
                config.tenantId || "common"
              );
              this.providers.set(`onedrive:${row.id}`, provider);
            } else if (row.type === "aliyun_oss") {
              provider = new AliyunOSSStorageProvider(
                row.id,
                config.region,
                config.accessKeyId,
                config.accessKeySecret,
                config.bucket
              );
              this.providers.set(`aliyun_oss:${row.id}`, provider);
            } else if (row.type === "s3") {
              provider = new S3StorageProvider(
                row.id,
                config.endpoint,
                config.region,
                config.accessKeyId,
                config.accessKeySecret,
                config.bucket,
                config.forcePathStyle || false
              );
              this.providers.set(`s3:${row.id}`, provider);
            } else if (row.type === "webdav") {
              provider = new WebDAVStorageProvider(
                row.id,
                config.url,
                config.username,
                config.password
              );
              this.providers.set(`webdav:${row.id}`, provider);
            } else if (row.type === "google_drive") {
              provider = new GoogleDriveStorageProvider(
                row.id,
                config.clientId,
                config.clientSecret,
                config.refreshToken,
                config.redirectUri
              );
              this.providers.set(`google_drive:${row.id}`, provider);
            }
            if (provider && row.is_active) {
              this.activeProvider = provider;
              this.activeAccountId = row.id;
              console.log(`Storage Provider initialized: ${row.type} Account (${row.name})`);
            }
          }
          if (providerName === "local" || !this.activeAccountId) {
            this.activeProvider = this.providers.get("local");
            this.activeAccountId = null;
            console.log("Storage Provider initialized: Local");
          }
        } catch (error) {
          console.error("Failed to init storage manager:", error);
          this.activeProvider = this.providers.get("local");
        }
      }
      async migrateLegacyConfig() {
        const clientId = await this.getSetting("onedrive_client_id");
        const refreshToken = await this.getSetting("onedrive_refresh_token");
        if (clientId && refreshToken) {
          console.log("[StorageManager] Migrating legacy OneDrive config...");
          const clientSecret = await this.getSetting("onedrive_client_secret") || "";
          const tenantId = await this.getSetting("onedrive_tenant_id") || "common";
          const existing = await query("SELECT id FROM storage_accounts WHERE config->>'clientId' = $1", [clientId]);
          let accountId;
          if (existing.rows.length === 0) {
            const insertRes = await query(
              `INSERT INTO storage_accounts (type, name, config, is_active) 
                     VALUES ($1, $2, $3, $4) RETURNING id`,
              ["onedrive", "Default Account", JSON.stringify({ clientId, clientSecret, refreshToken, tenantId }), true]
            );
            accountId = insertRes.rows[0].id;
            console.log("[StorageManager] Legacy config migrated successfully.");
          } else {
            accountId = existing.rows[0].id;
          }
          const updateRes = await query(
            "UPDATE files SET storage_account_id = $1 WHERE source = $2 AND storage_account_id IS NULL",
            [accountId, "onedrive"]
          );
          if (updateRes.rowCount > 0) {
            console.log(`[StorageManager] Associated ${updateRes.rowCount} legacy OneDrive files with account ${accountId}`);
          }
        }
      }
      async getSetting(key) {
        const res = await query("SELECT value FROM system_settings WHERE key = $1", [key]);
        return res.rows[0]?.value || null;
      }
      static async updateSetting(key, value) {
        await query(
          `INSERT INTO system_settings (key, value, updated_at) 
             VALUES ($1, $2, NOW()) 
             ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
          [key, value]
        );
      }
      static async updateAccountToken(accountId, refreshToken) {
        await query(
          `UPDATE storage_accounts 
             SET config = config || jsonb_build_object('refreshToken', $2::text), updated_at = NOW()
             WHERE id = $1`,
          [accountId, refreshToken]
        );
      }
      getProvider(name) {
        if (name && this.providers.has(name)) {
          return this.providers.get(name);
        }
        return this.activeProvider;
      }
      getActiveAccountId() {
        return this.activeAccountId;
      }
      async getAccounts() {
        const res = await query("SELECT id, name, type, is_active FROM storage_accounts ORDER BY created_at ASC");
        return res.rows;
      }
      // 从内存中移除 Provider
      removeProvider(key) {
        this.providers.delete(key);
      }
      // 添加新的 OneDrive 账户 (如果 Client ID 已存在则更新现有记录)
      async addOneDriveAccount(name, clientId, clientSecret, refreshToken, tenantId = "common") {
        const config = JSON.stringify({ clientId, clientSecret, refreshToken, tenantId });
        const existing = await query("SELECT id FROM storage_accounts WHERE type = $1 AND config->>'clientId' = $2", ["onedrive", clientId]);
        let targetId;
        if (existing.rows.length > 0) {
          targetId = existing.rows[0].id;
          console.log(`[StorageManager] Updating existing OneDrive account: ${targetId} (ClientID: ${clientId.substring(0, 8)}...)`);
          await query(
            "UPDATE storage_accounts SET name = $1, config = $2, updated_at = NOW() WHERE id = $3",
            [name, config, targetId]
          );
        } else {
          const res = await query(
            `INSERT INTO storage_accounts (type, name, config, is_active) 
                 VALUES ($1, $2, $3, $4) RETURNING id`,
            ["onedrive", name, config, false]
          );
          targetId = res.rows[0].id;
          console.log(`[StorageManager] Added new OneDrive account: ${targetId}`);
        }
        const oneDrive = new OneDriveStorageProvider(targetId, clientId, clientSecret, refreshToken, tenantId);
        this.providers.set(`onedrive:${targetId}`, oneDrive);
        return targetId;
      }
      // 切换激活账户
      async switchAccount(accountId) {
        if (accountId === "local") {
          await _StorageManager.updateSetting("active_storage_provider", "local");
          await query("UPDATE storage_accounts SET is_active = false");
        } else {
          const accRes = await query("SELECT type FROM storage_accounts WHERE id = $1", [accountId]);
          const type = accRes.rows[0]?.type || "local";
          await _StorageManager.updateSetting("active_storage_provider", type);
          await query("UPDATE storage_accounts SET is_active = (id = $1)", [accountId]);
        }
        await this.init();
      }
      async addAliyunOSSAccount(name, region, accessKeyId, accessKeySecret, bucket) {
        const config = JSON.stringify({ region, accessKeyId, accessKeySecret, bucket });
        const res = await query(
          `INSERT INTO storage_accounts (type, name, config, is_active) 
             VALUES ($1, $2, $3, $4) RETURNING id`,
          ["aliyun_oss", name, config, false]
        );
        const targetId = res.rows[0].id;
        console.log(`[StorageManager] Added new Aliyun OSS account: ${targetId}`);
        const oss = new AliyunOSSStorageProvider(targetId, region, accessKeyId, accessKeySecret, bucket);
        this.providers.set(`aliyun_oss:${targetId}`, oss);
        return targetId;
      }
      async addS3Account(name, endpoint, region, accessKeyId, accessKeySecret, bucket, forcePathStyle = false) {
        const config = JSON.stringify({ endpoint, region, accessKeyId, accessKeySecret, bucket, forcePathStyle });
        const res = await query(
          `INSERT INTO storage_accounts (type, name, config, is_active) 
             VALUES ($1, $2, $3, $4) RETURNING id`,
          ["s3", name, config, false]
        );
        const targetId = res.rows[0].id;
        console.log(`[StorageManager] Added new S3 account: ${targetId}`);
        const s3 = new S3StorageProvider(targetId, endpoint, region, accessKeyId, accessKeySecret, bucket, forcePathStyle);
        this.providers.set(`s3:${targetId}`, s3);
        return targetId;
      }
      async addWebDAVAccount(name, url, username, password) {
        const config = JSON.stringify({ url, username, password });
        const res = await query(
          `INSERT INTO storage_accounts (type, name, config, is_active) 
             VALUES ($1, $2, $3, $4) RETURNING id`,
          ["webdav", name, config, false]
        );
        const targetId = res.rows[0].id;
        console.log(`[StorageManager] Added new WebDAV account: ${targetId}`);
        const webdav = new WebDAVStorageProvider(targetId, url, username, password);
        this.providers.set(`webdav:${targetId}`, webdav);
        return targetId;
      }
      async addGoogleDriveAccount(name, clientId, clientSecret, refreshToken, redirectUri) {
        const config = JSON.stringify({ clientId, clientSecret, refreshToken, redirectUri });
        const res = await query(
          `INSERT INTO storage_accounts (type, name, config, is_active) 
             VALUES ($1, $2, $3, $4) RETURNING id`,
          ["google_drive", name, config, false]
        );
        const targetId = res.rows[0].id;
        console.log(`[StorageManager] Added new Google Drive account: ${targetId}`);
        const gd = new GoogleDriveStorageProvider(targetId, clientId, clientSecret, refreshToken, redirectUri);
        this.providers.set(`google_drive:${targetId}`, gd);
        return targetId;
      }
      async updateOneDriveConfig(clientId, clientSecret, refreshToken, tenantId = "common", name) {
        await _StorageManager.updateSetting("onedrive_client_id", clientId);
        await _StorageManager.updateSetting("onedrive_client_secret", clientSecret);
        await _StorageManager.updateSetting("onedrive_tenant_id", tenantId);
        if (refreshToken !== "pending") {
          await _StorageManager.updateSetting("onedrive_refresh_token", refreshToken);
        }
        if (name) {
          await _StorageManager.updateSetting("onedrive_pending_name", name);
        }
        if (refreshToken !== "pending") {
          const pendingName = await this.getSetting("onedrive_pending_name");
          const finalName = name || pendingName || "OneDrive Account";
          await this.addOneDriveAccount(finalName, clientId, clientSecret, refreshToken, tenantId);
          await query("DELETE FROM system_settings WHERE key = 'onedrive_pending_name'");
          const res = await query("SELECT id FROM storage_accounts WHERE type = $1 ORDER BY created_at DESC LIMIT 1", ["onedrive"]);
          if (res.rows[0]) {
            await this.switchAccount(res.rows[0].id);
          }
        }
      }
      // 切换回本地
      async switchToLocal() {
        await this.switchAccount("local");
      }
    };
    storageManager = StorageManager.getInstance();
  }
});

// src/index.ts
import express from "express";
import cors from "cors";
import dotenv3 from "dotenv";
import path12 from "path";
import fs11 from "fs";

// src/routes/files.ts
init_db();
import { Router as Router2 } from "express";
import fs3 from "fs";
import path3 from "path";

// src/middleware/signedUrl.ts
import crypto3 from "crypto";

// src/utils/config.ts
import crypto from "crypto";
import dotenv2 from "dotenv";
dotenv2.config();
var ACCESS_PASSWORD_HASH = process.env.ACCESS_PASSWORD_HASH || "";
var SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
var TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1e3;

// src/routes/auth.ts
import { Router } from "express";
import crypto2 from "crypto";
var router = Router();
var sessions = /* @__PURE__ */ new Map();
setInterval(() => {
  const now = /* @__PURE__ */ new Date();
  sessions.forEach((session, token) => {
    if (now > session.expiresAt) {
      sessions.delete(token);
    }
  });
}, 60 * 60 * 1e3);
function hashPassword(password) {
  return crypto2.createHash("sha256").update(password).digest("hex");
}
function generateToken() {
  return crypto2.randomBytes(32).toString("hex");
}
function verifyPassword(password) {
  if (!ACCESS_PASSWORD_HASH) {
    return true;
  }
  const inputHash = hashPassword(password);
  return inputHash === ACCESS_PASSWORD_HASH;
}
router.post("/login", (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: "\u8BF7\u8F93\u5165\u5BC6\u7801" });
  }
  if (!verifyPassword(password)) {
    return res.status(401).json({ error: "\u5BC6\u7801\u9519\u8BEF" });
  }
  const token = generateToken();
  const now = /* @__PURE__ */ new Date();
  const expiresAt = new Date(now.getTime() + TOKEN_EXPIRY);
  sessions.set(token, { createdAt: now, expiresAt });
  res.json({
    success: true,
    token,
    expiresAt: expiresAt.toISOString()
  });
});
router.get("/verify", (req, res) => {
  const token = req.headers["authorization"]?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ valid: false, error: "\u672A\u63D0\u4F9B Token" });
  }
  const session = sessions.get(token);
  if (!session || /* @__PURE__ */ new Date() > session.expiresAt) {
    sessions.delete(token || "");
    return res.status(401).json({ valid: false, error: "Token \u5DF2\u8FC7\u671F" });
  }
  res.json({ valid: true });
});
router.post("/logout", (req, res) => {
  const token = req.headers["authorization"]?.replace("Bearer ", "");
  if (token) {
    sessions.delete(token);
  }
  res.json({ success: true });
});
router.get("/status", (_req, res) => {
  res.json({
    passwordRequired: !!ACCESS_PASSWORD_HASH
  });
});
router.post("/sign-url", requireAuth, (req, res) => {
  const { fileId, expiresIn = 300 } = req.body;
  if (!fileId) {
    return res.status(400).json({ error: "\u7F3A\u5C11 fileId" });
  }
  const expires = Date.now() + expiresIn * 1e3;
  const sign = generateSignature(fileId, expires);
  res.json({
    sign,
    expires,
    expiresIn
  });
});
function requireAuth(req, res, next) {
  if (!ACCESS_PASSWORD_HASH) {
    return next();
  }
  let token = req.headers["authorization"]?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ error: "\u672A\u6388\u6743\u8BBF\u95EE" });
  }
  const session = sessions.get(token);
  if (!session || /* @__PURE__ */ new Date() > session.expiresAt) {
    sessions.delete(token);
    return res.status(401).json({ error: "Token \u5DF2\u8FC7\u671F\uFF0C\u8BF7\u91CD\u65B0\u767B\u5F55" });
  }
  next();
}
var auth_default = router;

// src/middleware/signedUrl.ts
function generateSignature(fileId, expires) {
  const data = `${fileId}:${expires}:${SESSION_SECRET}`;
  return crypto3.createHash("sha256").update(data).digest("hex");
}
function getSignedUrl(fileId, type, expiresIn = 24 * 60 * 60) {
  const expires = Date.now() + expiresIn * 1e3;
  const sign = generateSignature(fileId, expires);
  return `/api/files/${fileId}/${type}?sign=${sign}&expires=${expires}`;
}
function verifySignedUrl(req) {
  const sign = req.query.sign;
  const expires = req.query.expires;
  let id = req.params.id;
  if (!id) {
    const match = req.path.match(/^\/?([^\/]+)/);
    if (match) {
      id = match[1];
    } else {
      console.log("[SignedURL] Failed to extract ID from path:", req.path);
    }
  }
  if (typeof sign !== "string" || typeof expires !== "string" || typeof id !== "string") {
    console.log("[SignedURL] Missing or invalid params:", { sign, expires, id });
    return false;
  }
  const expiresTimestamp = parseInt(expires, 10);
  if (isNaN(expiresTimestamp)) {
    console.log("[SignedURL] Invalid timestamp:", expires);
    return false;
  }
  if (Date.now() > expiresTimestamp) {
    console.log("[SignedURL] Expired signature:", { now: Date.now(), expires: expiresTimestamp });
    return false;
  }
  const expectedSign = generateSignature(id, expiresTimestamp);
  if (sign !== expectedSign) {
    console.log("[SignedURL] Signature mismatch:", { id, received: sign, expected: expectedSign });
    return false;
  }
  return true;
}
function requireAuthOrSignedUrl(req, res, next) {
  if (req.method === "GET" && req.query.sign && req.query.expires) {
    if (verifySignedUrl(req)) {
      return next();
    }
  }
  return requireAuth(req, res, next);
}

// src/routes/files.ts
var router2 = Router2();
var UPLOAD_DIR = path3.resolve(process.env.UPLOAD_DIR || "./data/uploads");
var THUMBNAIL_DIR = path3.resolve(process.env.THUMBNAIL_DIR || "./data/thumbnails");
router2.get("/", async (_req, res) => {
  try {
    const { storageManager: storageManager2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
    const activeAccountId = storageManager2.getActiveAccountId();
    const provider = storageManager2.getProvider();
    let queryStr = "";
    let params = [];
    if (provider.name === "local") {
      queryStr = "SELECT * FROM files WHERE source = 'local' ORDER BY created_at DESC";
    } else {
      queryStr = "SELECT * FROM files WHERE storage_account_id = $1 ORDER BY created_at DESC";
      params = [activeAccountId];
    }
    const result = await query(queryStr, params);
    const files = result.rows.map((file) => ({
      ...file,
      size: formatFileSize(file.size),
      date: formatRelativeTime(file.created_at),
      thumbnailUrl: file.thumbnail_path ? getSignedUrl(file.id, "thumbnail") : void 0,
      previewUrl: getSignedUrl(file.id, "preview")
    }));
    res.json(files);
  } catch (error) {
    console.error("\u83B7\u53D6\u6587\u4EF6\u5217\u8868\u5931\u8D25:", error);
    res.status(500).json({ error: "\u83B7\u53D6\u6587\u4EF6\u5217\u8868\u5931\u8D25" });
  }
});
router2.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query("SELECT * FROM files WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "\u6587\u4EF6\u4E0D\u5B58\u5728" });
    }
    const file = result.rows[0];
    res.json({
      ...file,
      size: formatFileSize(file.size),
      date: formatRelativeTime(file.created_at),
      thumbnailUrl: file.thumbnail_path ? getSignedUrl(file.id, "thumbnail") : void 0,
      previewUrl: getSignedUrl(file.id, "preview")
    });
  } catch (error) {
    console.error("\u83B7\u53D6\u6587\u4EF6\u4FE1\u606F\u5931\u8D25:", error);
    res.status(500).json({ error: "\u83B7\u53D6\u6587\u4EF6\u4FE1\u606F\u5931\u8D25" });
  }
});
router2.get("/:id/preview", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query("SELECT * FROM files WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "\u6587\u4EF6\u4E0D\u5B58\u5728" });
    }
    const file = result.rows[0];
    if (file.source === "onedrive" || file.source === "aliyun_oss" || file.source === "s3" || file.source === "webdav") {
      try {
        const { storageManager: storageManager2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
        const provider = storageManager2.getProvider(`${file.source}:${file.storage_account_id}`);
        const url = await provider.getPreviewUrl(file.path);
        if (url) {
          res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
          return res.redirect(url);
        } else {
          const stream = await provider.getFileStream(file.path);
          res.set({
            "Content-Type": file.mime_type || "application/octet-stream",
            "Cache-Control": "public, max-age=86400"
          });
          stream.pipe(res);
          return;
        }
      } catch (err) {
        console.error(`\u83B7\u53D6 ${file.source} \u9884\u89C8\u94FE\u63A5/\u6D41\u5931\u8D25:`, err);
        return res.status(500).json({ error: "\u83B7\u53D6\u9884\u89C8\u5931\u8D25" });
      }
    }
    const filePath = file.path || path3.join(UPLOAD_DIR, file.stored_name);
    if (!fs3.existsSync(filePath)) {
      return res.status(404).json({ error: "\u6587\u4EF6\u4E0D\u5B58\u5728\u4E8E\u670D\u52A1\u5668" });
    }
    res.set({
      "Content-Type": file.mime_type || "application/octet-stream",
      "Cache-Control": "public, max-age=86400",
      "ETag": `"${file.id}-${file.updated_at}"`
    });
    const stat = fs3.statSync(filePath);
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunksize = end - start + 1;
      res.status(206);
      res.set({
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunksize)
      });
      const stream = fs3.createReadStream(filePath, { start, end });
      stream.pipe(res);
    } else {
      res.set("Content-Length", String(stat.size));
      const stream = fs3.createReadStream(filePath);
      stream.pipe(res);
    }
  } catch (error) {
    console.error("\u9884\u89C8\u6587\u4EF6\u5931\u8D25:", error);
    res.status(500).json({ error: "\u9884\u89C8\u6587\u4EF6\u5931\u8D25" });
  }
});
router2.get("/:id/download-url", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query("SELECT * FROM files WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "\u6587\u4EF6\u4E0D\u5B58\u5728" });
    }
    const file = result.rows[0];
    if (file.source === "onedrive" || file.source === "aliyun_oss" || file.source === "s3" || file.source === "webdav") {
      try {
        const { storageManager: storageManager2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
        const provider = storageManager2.getProvider(`${file.source}:${file.storage_account_id}`);
        const url = await provider.getPreviewUrl(file.path);
        if (url) {
          return res.json({ url });
        } else {
          const signedUrl2 = getSignedUrl(file.id, "download", 3600);
          return res.json({ url: signedUrl2, isRelative: true });
        }
      } catch (err) {
        console.error(`\u83B7\u53D6 ${file.source} \u4E0B\u8F7D\u94FE\u63A5\u5931\u8D25:`, err);
        return res.status(500).json({ error: `\u65E0\u6CD5\u83B7\u53D6 ${file.source} \u4E0B\u8F7D\u94FE\u63A5` });
      }
    }
    const signedUrl = getSignedUrl(file.id, "download", 3600);
    return res.json({ url: signedUrl, isRelative: true });
  } catch (error) {
    console.error("\u83B7\u53D6\u4E0B\u8F7D\u94FE\u63A5\u5931\u8D25:", error);
    res.status(500).json({ error: "\u83B7\u53D6\u4E0B\u8F7D\u94FE\u63A5\u5931\u8D25" });
  }
});
router2.get("/:id/download", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Download] Starting download for ID: ${id}`);
    const result = await query("SELECT * FROM files WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      console.log(`[Download] File not found in DB: ${id}`);
      return res.status(404).json({ error: "\u6587\u4EF6\u4E0D\u5B58\u5728" });
    }
    const file = result.rows[0];
    if (file.source === "onedrive" || file.source === "aliyun_oss" || file.source === "s3" || file.source === "webdav") {
      try {
        const { storageManager: storageManager2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
        const provider = storageManager2.getProvider(`${file.source}:${file.storage_account_id}`);
        const url = await provider.getPreviewUrl(file.path);
        if (url) {
          res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
          return res.redirect(url);
        } else {
          const stream = await provider.getFileStream(file.path);
          res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(file.name)}"`);
          stream.pipe(res);
          return;
        }
      } catch (err) {
        console.error(`\u83B7\u53D6 ${file.source} \u4E0B\u8F7D\u94FE\u63A5/\u6D41\u5931\u8D25:`, err);
        return res.status(500).json({ error: "\u65E0\u6CD5\u4E0B\u8F7D\u6587\u4EF6" });
      }
    }
    const filePath = file.path || path3.join(UPLOAD_DIR, file.stored_name);
    console.log(`[Download] Serving local file: ${filePath}`);
    if (!fs3.existsSync(filePath)) {
      console.log(`[Download] File system path not found: ${filePath}`);
      return res.status(404).json({ error: "\u6587\u4EF6\u4E0D\u5B58\u5728\u4E8E\u670D\u52A1\u5668" });
    }
    res.download(filePath, file.name, (err) => {
      if (err) {
        console.error("[Download] Send file error:", err);
      }
    });
  } catch (error) {
    console.error("\u4E0B\u8F7D\u6587\u4EF6\u5931\u8D25:", error);
    res.status(500).json({ error: "\u4E0B\u8F7D\u6587\u4EF6\u5931\u8D25" });
  }
});
router2.get("/:id/thumbnail", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query("SELECT * FROM files WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "\u6587\u4EF6\u4E0D\u5B58\u5728" });
    }
    const file = result.rows[0];
    if (!file.thumbnail_path) {
      return res.status(404).json({ error: "\u65E0\u7F29\u7565\u56FE" });
    }
    const thumbPath = path3.join(THUMBNAIL_DIR, path3.basename(file.thumbnail_path));
    if (!fs3.existsSync(thumbPath)) {
      return res.status(404).json({ error: "\u7F29\u7565\u56FE\u6587\u4EF6\u4E0D\u5B58\u5728" });
    }
    res.set({
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=604800"
    });
    const stream = fs3.createReadStream(thumbPath);
    stream.pipe(res);
  } catch (error) {
    console.error("\u83B7\u53D6\u7F29\u7565\u56FE\u5931\u8D25:", error);
    res.status(500).json({ error: "\u83B7\u53D6\u7F29\u7565\u56FE\u5931\u8D25" });
  }
});
router2.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query("SELECT * FROM files WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "\u6587\u4EF6\u4E0D\u5B58\u5728" });
    }
    const file = result.rows[0];
    if (file.source === "onedrive" || file.source === "aliyun_oss" || file.source === "s3" || file.source === "webdav") {
      try {
        const { storageManager: storageManager2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
        const provider = storageManager2.getProvider(`${file.source}:${file.storage_account_id}`);
        await provider.deleteFile(file.path);
      } catch (err) {
        console.error(`${file.source} \u6587\u4EF6\u5220\u9664\u5931\u8D25 (\u53EF\u80FD\u5DF2\u4E0D\u5B58\u5728):`, err);
      }
    } else {
      const filePath = file.path || path3.join(UPLOAD_DIR, file.stored_name);
      if (fs3.existsSync(filePath)) {
        fs3.unlinkSync(filePath);
      }
    }
    if (file.thumbnail_path) {
      const thumbPath = path3.join(THUMBNAIL_DIR, path3.basename(file.thumbnail_path));
      if (fs3.existsSync(thumbPath)) {
        fs3.unlinkSync(thumbPath);
      }
    }
    await query("DELETE FROM files WHERE id = $1", [id]);
    res.json({ success: true, message: "\u6587\u4EF6\u5DF2\u5220\u9664" });
  } catch (error) {
    console.error("\u5220\u9664\u6587\u4EF6\u5931\u8D25:", error);
    res.status(500).json({ error: "\u5220\u9664\u6587\u4EF6\u5931\u8D25" });
  }
});
router2.post("/batch-delete", async (req, res) => {
  try {
    const { fileIds = [], folderNames = [] } = req.body;
    if (!Array.isArray(fileIds) || !Array.isArray(folderNames)) {
      return res.status(400).json({ error: "\u53C2\u6570\u683C\u5F0F\u9519\u8BEF" });
    }
    if (fileIds.length === 0 && folderNames.length === 0) {
      return res.status(400).json({ error: "\u8BF7\u63D0\u4F9B\u8981\u5220\u9664\u7684\u6587\u4EF6\u6216\u6587\u4EF6\u5939" });
    }
    let filesToDelete = [];
    if (fileIds.length > 0) {
      const result = await query("SELECT * FROM files WHERE id = ANY($1)", [fileIds]);
      filesToDelete = [...filesToDelete, ...result.rows];
    }
    if (folderNames.length > 0) {
      const result = await query("SELECT * FROM files WHERE folder = ANY($1)", [folderNames]);
      filesToDelete = [...filesToDelete, ...result.rows];
    }
    const uniqueFiles = Array.from(new Map(filesToDelete.map((f) => [f.id, f])).values());
    if (uniqueFiles.length === 0) {
      return res.json({ success: true, message: "\u6CA1\u6709\u53D1\u73B0\u5F85\u5220\u9664\u7684\u9879\u76EE" });
    }
    const storagePromises = uniqueFiles.map(async (file) => {
      try {
        if (file.source === "onedrive" || file.source === "aliyun_oss" || file.source === "s3" || file.source === "webdav") {
          const { storageManager: storageManager2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
          const provider = storageManager2.getProvider(`${file.source}:${file.storage_account_id}`);
          await provider.deleteFile(file.path);
        } else {
          const filePath = file.path || path3.join(UPLOAD_DIR, file.stored_name);
          if (fs3.existsSync(filePath)) {
            fs3.unlinkSync(filePath);
          }
        }
        if (file.thumbnail_path) {
          const thumbPath = path3.join(THUMBNAIL_DIR, path3.basename(file.thumbnail_path));
          if (fs3.existsSync(thumbPath)) {
            fs3.unlinkSync(thumbPath);
          }
        }
      } catch (err) {
        console.error(`\u5220\u9664\u7269\u7406\u6587\u4EF6\u5931\u8D25 (ID: ${file.id}):`, err);
      }
    });
    await Promise.all(storagePromises);
    const idsToDelete = uniqueFiles.map((f) => f.id);
    await query("DELETE FROM files WHERE id = ANY($1)", [idsToDelete]);
    res.json({ success: true, message: `\u6210\u529F\u5220\u9664 ${uniqueFiles.length} \u4E2A\u6587\u4EF6` });
  } catch (error) {
    console.error("\u6279\u91CF\u5220\u9664\u5931\u8D25:", error);
    res.status(500).json({ error: "\u6279\u91CF\u5220\u9664\u5931\u8D25" });
  }
});
function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
function formatRelativeTime(date) {
  const now = /* @__PURE__ */ new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1e3);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (seconds < 60) return "\u521A\u521A";
  if (minutes < 60) return `${minutes} \u5206\u949F\u524D`;
  if (hours < 24) return `${hours} \u5C0F\u65F6\u524D`;
  if (days < 7) return `${days} \u5929\u524D`;
  return new Date(date).toLocaleDateString("zh-CN");
}
router2.post("/:id/share", async (req, res) => {
  try {
    const { id } = req.params;
    const { password, expiration } = req.body;
    const result = await query("SELECT * FROM files WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "\u6587\u4EF6\u4E0D\u5B58\u5728" });
    }
    const file = result.rows[0];
    if (file.source !== "onedrive") {
      return res.status(400).json({ error: "\u76EE\u524D\u4EC5\u652F\u6301 OneDrive \u6587\u4EF6\u5206\u4EAB" });
    }
    const { storageManager: storageManager2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
    const provider = storageManager2.getProvider(`onedrive:${file.storage_account_id}`);
    if (!provider || !provider.createShareLink) {
      return res.status(400).json({ error: "\u5F53\u524D\u5B58\u50A8\u63D0\u4F9B\u5546\u4E0D\u652F\u6301\u5206\u4EAB" });
    }
    const resultLink = await provider.createShareLink(file.path, password, expiration);
    if (resultLink.error) {
      return res.status(400).json({ error: resultLink.error });
    }
    res.json({ link: resultLink.link });
  } catch (error) {
    console.error("\u521B\u5EFA\u5206\u4EAB\u94FE\u63A5\u5931\u8D25:", error);
    res.status(500).json({ error: "\u521B\u5EFA\u5206\u4EAB\u94FE\u63A5\u5931\u8D25" });
  }
});
var files_default = router2;

// src/routes/upload.ts
init_db();
import { Router as Router3 } from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path5 from "path";
import fs5 from "fs";

// src/middleware/apiKey.ts
init_db();
var validateApiKey = async (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    return res.status(401).json({
      error: "API Key \u5FC5\u9700",
      message: "\u8BF7\u5728\u8BF7\u6C42\u5934\u4E2D\u6DFB\u52A0 X-API-Key"
    });
  }
  try {
    const result = await query(
      "SELECT id, name, permissions FROM api_keys WHERE key = $1 AND enabled = true",
      [apiKey]
    );
    if (result.rows.length === 0) {
      return res.status(403).json({
        error: "\u65E0\u6548\u7684 API Key",
        message: "API Key \u4E0D\u5B58\u5728\u6216\u5DF2\u7981\u7528"
      });
    }
    const keyInfo = result.rows[0];
    req.apiKeyInfo = {
      id: keyInfo.id,
      name: keyInfo.name,
      permissions: keyInfo.permissions || ["upload"]
    };
    next();
  } catch (error) {
    console.error("\u9A8C\u8BC1 API Key \u5931\u8D25:", error);
    res.status(500).json({ error: "\u9A8C\u8BC1 API Key \u5931\u8D25" });
  }
};

// src/utils/thumbnail.ts
import path4 from "path";
import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";
import fs4 from "fs";
var THUMBNAIL_DIR2 = path4.resolve(process.env.THUMBNAIL_DIR || "./data/thumbnails");
if (!fs4.existsSync(THUMBNAIL_DIR2)) {
  fs4.mkdirSync(THUMBNAIL_DIR2, { recursive: true });
}
async function generateThumbnail(filePath, storedName, mimeType) {
  const absFilePath = path4.resolve(filePath);
  const thumbName = `thumb_${path4.parse(storedName).name}.webp`;
  const thumbPath = path4.join(THUMBNAIL_DIR2, thumbName);
  console.log(`[Thumbnail] \u{1F680} Starting generation for: ${storedName}`);
  console.log(`[Thumbnail] Source: ${absFilePath}`);
  console.log(`[Thumbnail] Target: ${thumbPath}`);
  console.log(`[Thumbnail] MIME: ${mimeType}`);
  if (!fs4.existsSync(absFilePath)) {
    console.error(`[Thumbnail] \u274C Source file does not exist: ${absFilePath}`);
    return null;
  }
  if (mimeType === "image/gif") {
    console.log(`[Thumbnail] \u23E9 Skipping GIF to preserve animation`);
    return null;
  }
  try {
    if (mimeType.startsWith("image/")) {
      console.log(`[Thumbnail] \u{1F5BC}\uFE0F  Processing image with Sharp...`);
      await sharp(absFilePath).resize(400, 300, { fit: "inside", withoutEnlargement: true }).webp({ quality: 80 }).toFile(thumbPath);
      console.log(`[Thumbnail] \u2705 Image thumbnail created: ${thumbName}`);
      return thumbPath;
    } else if (mimeType.startsWith("video/")) {
      console.log(`[Thumbnail] \u{1F3AC} Processing video with Ffmpeg...`);
      const tryScreenshot = (timestamp) => {
        return new Promise((resolve) => {
          console.log(`[Thumbnail] \u{1F4F8} Attempting screenshot at ${timestamp}`);
          ffmpeg(absFilePath).screenshots({
            count: 1,
            folder: THUMBNAIL_DIR2,
            filename: thumbName,
            size: "400x300",
            timestamps: [timestamp]
          }).on("start", (cmd) => console.log(`[Thumbnail] FFmpeg CMD: ${cmd}`)).on("end", () => {
            if (fs4.existsSync(thumbPath)) {
              console.log(`[Thumbnail] \u2705 Video thumbnail created at ${timestamp}`);
              resolve(true);
            } else {
              console.warn(`[Thumbnail] \u26A0\uFE0F  FFmpeg finished but file not found at ${timestamp}`);
              resolve(false);
            }
          }).on("error", (err) => {
            console.error(`[Thumbnail] \u274C FFmpeg error at ${timestamp}:`, err.message);
            resolve(false);
          });
        });
      };
      let success = await tryScreenshot("10%");
      if (!success) {
        console.log(`[Thumbnail] \u{1F504} Retrying at 1s mark...`);
        success = await tryScreenshot("00:00:01");
      }
      if (success) {
        return thumbPath;
      }
    }
  } catch (error) {
    console.error(`[Thumbnail] \u274C Unexpected error:`, error.message);
  }
  return null;
}
async function getImageDimensions(filePath, mimeType) {
  const absFilePath = path4.resolve(filePath);
  console.log(`[Dimensions] \u{1F4CF} Getting dimensions for: ${absFilePath} (${mimeType})`);
  try {
    if (mimeType.startsWith("image/")) {
      const metadata = await sharp(absFilePath).metadata();
      const result = { width: metadata.width || 0, height: metadata.height || 0 };
      console.log(`[Dimensions] \u2705 Image dimensions: ${result.width}x${result.height}`);
      return result;
    } else if (mimeType.startsWith("video/")) {
      return new Promise((resolve) => {
        ffmpeg.ffprobe(absFilePath, (err, metadata) => {
          if (err) {
            console.error(`[Dimensions] \u274C Probe failed:`, err.message);
            resolve({ width: 0, height: 0 });
          } else {
            const stream = metadata.streams.find((s) => s.width && s.height);
            const result = {
              width: stream?.width || 0,
              height: stream?.height || 0
            };
            console.log(`[Dimensions] \u2705 Video dimensions: ${result.width}x${result.height}`);
            resolve(result);
          }
        });
      });
    }
  } catch (error) {
    console.error("Get dimensions failed:", error);
  }
  return { width: 0, height: 0 };
}

// src/routes/upload.ts
init_storage();
var router3 = Router3();
function decodeFilename(filename) {
  try {
    const urlDecoded = decodeURIComponent(filename);
    if (urlDecoded !== filename) {
      return urlDecoded;
    }
  } catch {
  }
  try {
    const bytes = Buffer.from(filename, "binary");
    const decoded = bytes.toString("utf8");
    if (!decoded.includes("\uFFFD") && decoded !== filename) {
      return decoded;
    }
  } catch {
  }
  return filename;
}
var TEMP_DIR = path5.join(process.cwd(), "data", "temp");
if (!fs5.existsSync(TEMP_DIR)) {
  fs5.mkdirSync(TEMP_DIR, { recursive: true });
}
var storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, TEMP_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path5.extname(file.originalname);
    const storedName = `${uuidv4()}${ext}`;
    cb(null, storedName);
  }
});
var upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024
    // 2GB limit
  }
});
var handleUpload = async (req, res, source = "web") => {
  if (!req.file) {
    return res.status(400).json({ error: "\u6CA1\u6709\u4E0A\u4F20\u6587\u4EF6" });
  }
  const file = req.file;
  const { folder } = req.body;
  const originalName = decodeFilename(file.originalname);
  const mimeType = file.mimetype;
  const size = file.size;
  const tempPath = path5.resolve(file.path);
  const storedName = file.filename;
  console.log(`[Upload] \u{1F4C1} Received file: ${originalName} (${mimeType}, ${size} bytes)`);
  console.log(`[Upload] \u{1F3E0} Local temp path: ${tempPath}`);
  try {
    const provider = storageManager.getProvider();
    const activeAccountId = storageManager.getActiveAccountId();
    console.log(`[Upload] \u{1F6E0}\uFE0F  Current storage provider: ${provider.name}, activeAccountId: ${activeAccountId || "none (local)"}`);
    let thumbnailPath = null;
    let width = null;
    let height = null;
    if (mimeType.startsWith("image/") || mimeType.startsWith("video/")) {
      try {
        const thumbResult = await generateThumbnail(tempPath, storedName, mimeType);
        if (thumbResult) {
          thumbnailPath = path5.basename(thumbResult);
          console.log(`[Upload] \u2728 Thumbnail generated: ${thumbnailPath}`);
          const dims = await getImageDimensions(tempPath, mimeType);
          width = dims.width;
          height = dims.height;
        } else {
          console.log(`[Upload] \u26A0\uFE0F  No thumbnail generated for: ${mimeType}`);
        }
      } catch (error) {
        console.error("\u751F\u6210\u7F29\u7565\u56FE\u5931\u8D25:", error);
      }
    }
    let storedPath = "";
    try {
      storedPath = await provider.saveFile(tempPath, storedName, mimeType);
    } catch (err) {
      if (fs5.existsSync(tempPath)) fs5.unlinkSync(tempPath);
      throw err;
    }
    if (fs5.existsSync(tempPath)) {
      try {
        fs5.unlinkSync(tempPath);
      } catch (e) {
        console.warn("Failed to clean up temp file:", e);
      }
    }
    let type = "other";
    if (mimeType.startsWith("image/")) type = "image";
    else if (mimeType.startsWith("video/")) type = "video";
    else if (mimeType.startsWith("audio/")) type = "audio";
    else if (mimeType.includes("pdf") || mimeType.includes("document") || mimeType.includes("text")) type = "document";
    const result = await query(
      `INSERT INTO files 
            (name, stored_name, type, mime_type, size, path, thumbnail_path, width, height, source, folder, storage_account_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
            RETURNING id, created_at, name, type, size`,
      [originalName, storedName, type, mimeType, size, storedPath, thumbnailPath, width, height, provider.name, folder || null, activeAccountId]
    );
    const newFile = result.rows[0];
    res.json({
      success: true,
      file: {
        id: newFile.id,
        name: newFile.name,
        type: newFile.type,
        size: newFile.size,
        thumbnailUrl: thumbnailPath ? getSignedUrl(newFile.id, "thumbnail") : void 0,
        previewUrl: getSignedUrl(newFile.id, "preview"),
        date: newFile.created_at,
        source: provider.name
      }
    });
  } catch (error) {
    console.error("\u4E0A\u4F20\u5904\u7406\u5931\u8D25:", error);
    if (fs5.existsSync(tempPath)) fs5.unlinkSync(tempPath);
    res.status(500).json({ error: "\u6587\u4EF6\u4E0A\u4F20\u5931\u8D25" });
  }
};
router3.post("/", upload.single("file"), async (req, res) => {
  await handleUpload(req, res, "web");
});
router3.post("/api", validateApiKey, upload.single("file"), async (req, res) => {
  await handleUpload(req, res, "api");
});
var upload_default = router3;

// src/routes/storage.ts
init_db();
import { Router as Router4 } from "express";
import checkDiskSpaceModule from "check-disk-space";
import os from "os";
import path6 from "path";
import axios2 from "axios";
var checkDiskSpace = checkDiskSpaceModule.default || checkDiskSpaceModule;
var router4 = Router4();
var UPLOAD_DIR2 = process.env.UPLOAD_DIR || "./data/uploads";
function getOneDriveRedirectUri(req) {
  const apiBase = process.env.VITE_API_URL;
  if (apiBase) {
    return `${apiBase.replace(/\/$/, "")}/api/storage/onedrive/callback`;
  }
  const protocol = req.protocol;
  const host = req.get("host");
  return `${protocol}://${host}/api/storage/onedrive/callback`;
}
function getGoogleDriveRedirectUri(req) {
  const apiBase = process.env.VITE_API_URL;
  if (apiBase) {
    return `${apiBase.replace(/\/$/, "")}/api/storage/google-drive/callback`;
  }
  const protocol = req.protocol;
  const host = req.get("host");
  return `${protocol}://${host}/api/storage/google-drive/callback`;
}
router4.get("/stats", requireAuth, async (_req, res) => {
  try {
    const diskPath = os.platform() === "win32" ? "C:" : path6.resolve(UPLOAD_DIR2);
    const diskSpace = await checkDiskSpace(diskPath);
    const result = await query(`
            SELECT 
                COUNT(*) as file_count,
                COALESCE(SUM(size), 0) as total_size
            FROM files
        `);
    const foomclousStats = result.rows[0];
    res.json({
      server: {
        total: formatBytes(diskSpace.size),
        totalBytes: diskSpace.size,
        used: formatBytes(diskSpace.size - diskSpace.free),
        usedBytes: diskSpace.size - diskSpace.free,
        free: formatBytes(diskSpace.free),
        freeBytes: diskSpace.free,
        usedPercent: Math.round((diskSpace.size - diskSpace.free) / diskSpace.size * 100)
      },
      foomclous: {
        used: formatBytes(parseInt(foomclousStats.total_size)),
        usedBytes: parseInt(foomclousStats.total_size),
        fileCount: parseInt(foomclousStats.file_count),
        usedPercent: Math.round(parseInt(foomclousStats.total_size) / diskSpace.size * 100)
      }
    });
  } catch (error) {
    console.error("\u83B7\u53D6\u5B58\u50A8\u7EDF\u8BA1\u5931\u8D25:", error);
    res.status(500).json({ error: "\u83B7\u53D6\u5B58\u50A8\u7EDF\u8BA1\u5931\u8D25" });
  }
});
router4.get("/stats/types", requireAuth, async (_req, res) => {
  try {
    const result = await query(`
            SELECT 
                type,
                COUNT(*) as count,
                COALESCE(SUM(size), 0) as total_size
            FROM files
            GROUP BY type
            ORDER BY total_size DESC
        `);
    const stats = result.rows.map((row) => ({
      type: row.type,
      count: parseInt(row.count),
      size: formatBytes(parseInt(row.total_size)),
      sizeBytes: parseInt(row.total_size)
    }));
    res.json(stats);
  } catch (error) {
    console.error("\u83B7\u53D6\u7C7B\u578B\u7EDF\u8BA1\u5931\u8D25:", error);
    res.status(500).json({ error: "\u83B7\u53D6\u7C7B\u578B\u7EDF\u8BA1\u5931\u8D25" });
  }
});
function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
router4.get("/config", requireAuth, async (req, res) => {
  try {
    const { storageManager: storageManager2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
    const provider = storageManager2.getProvider();
    const activeAccountId = storageManager2.getActiveAccountId();
    const accounts = await storageManager2.getAccounts();
    const redirectUri = getOneDriveRedirectUri(req);
    res.json({
      provider: provider.name,
      activeAccountId,
      accounts,
      redirectUri,
      googleDriveRedirectUri: getGoogleDriveRedirectUri(req)
    });
  } catch (error) {
    console.error("\u83B7\u53D6\u5B58\u50A8\u914D\u7F6E\u5931\u8D25:", error);
    res.status(500).json({ error: "\u83B7\u53D6\u5B58\u50A8\u914D\u7F6E\u5931\u8D25" });
  }
});
router4.post("/config/onedrive/auth-url", requireAuth, async (req, res) => {
  try {
    const { clientId, tenantId, redirectUri, clientSecret } = req.body;
    if (!clientId || !redirectUri) {
      return res.status(400).json({ error: "\u7F3A\u5C11 Client ID \u6216 Redirect URI" });
    }
    const { OneDriveStorageProvider: OneDriveStorageProvider2, StorageManager: StorageManager2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
    const authUrl = OneDriveStorageProvider2.generateAuthUrl(clientId, tenantId || "common", redirectUri);
    if (clientSecret) {
      await StorageManager2.updateSetting("onedrive_client_secret", clientSecret);
    } else {
      await StorageManager2.updateSetting("onedrive_client_secret", "");
    }
    await StorageManager2.updateSetting("onedrive_client_id", clientId);
    await StorageManager2.updateSetting("onedrive_tenant_id", tenantId || "common");
    res.json({ authUrl });
  } catch (error) {
    console.error("\u83B7\u53D6\u6388\u6743 URL \u5931\u8D25:", error);
    res.status(500).json({ error: "\u83B7\u53D6\u6388\u6743 URL \u5931\u8D25" });
  }
});
router4.get("/onedrive/callback", async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;
    if (error) {
      return res.send(`\u6388\u6743\u5931\u8D25: ${error_description || error}`);
    }
    if (!code) {
      return res.send("\u7F3A\u5C11\u6388\u6743\u7801 (code)");
    }
    const { storageManager: storageManager2, OneDriveStorageProvider: OneDriveStorageProvider2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
    const clientId = await storageManager2.getSetting("onedrive_client_id");
    const clientSecret = await storageManager2.getSetting("onedrive_client_secret") || "";
    const tenantId = await storageManager2.getSetting("onedrive_tenant_id") || "common";
    const redirectUri = getOneDriveRedirectUri(req);
    console.log(`[OneDrive] OAuth Callback, using redirectUri: ${redirectUri}`);
    if (!clientId) {
      console.error("[OneDrive] OAuth Callback failed: Client ID not found in settings");
      return res.send("\u914D\u7F6E\u4FE1\u606F\u4E22\u5931\uFF08Client ID \u672A\u627E\u5230\uFF09\uFF0C\u8BF7\u8FD4\u56DE\u8BBE\u7F6E\u9875\u9762\u91CD\u8BD5\u3002");
    }
    let tokens;
    try {
      tokens = await OneDriveStorageProvider2.exchangeCodeForToken(clientId, clientSecret, tenantId, redirectUri, code);
    } catch (err) {
      console.error("[OneDrive] exchangeCodeForToken failed:", {
        error: err.response?.data || err.message,
        clientId: clientId.substring(0, 8) + "...",
        redirectUri,
        tenantId
      });
      throw err;
    }
    let accountName = "OneDrive Account";
    try {
      const profileRes = await axios2.get("https://graph.microsoft.com/v1.0/me", {
        headers: { "Authorization": `Bearer ${tokens.access_token}` }
      });
      accountName = profileRes.data.mail || profileRes.data.userPrincipalName || "OneDrive Account";
    } catch (profileError) {
      console.log("[OneDrive] Could not fetch user profile (likely User.Read scope missing), using default name.");
    }
    const pendingName = await storageManager2.getSetting("onedrive_pending_name");
    const finalName = pendingName || accountName;
    await storageManager2.updateOneDriveConfig(clientId, clientSecret, tokens.refresh_token, tenantId);
    const activeId = storageManager2.getActiveAccountId();
    if (activeId) {
      await query("UPDATE storage_accounts SET name = $1 WHERE id = $2", [finalName, activeId]);
    }
    res.send(`
            <html>
                <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
                    <div style="text-align: center; padding: 40px; border-radius: 20px; background: #f0fdf4; border: 1px solid #bbf7d0;">
                        <h2 style="color: #16a34a; margin-bottom: 10px;">\u{1F389} \u6388\u6743\u6210\u529F\uFF01</h2>
                        <p style="color: #15803d; margin-bottom: 20px;">OneDrive \u5DF2\u6210\u529F\u8FDE\u63A5\u5E76\u542F\u7528\u3002</p>
                        <button onclick="window.close()" style="padding: 10px 20px; background: #16a34a; color: white; border: none; border-radius: 8px; cursor: pointer;">\u5173\u95ED\u6B64\u7A97\u53E3</button>
                        <script>
                            setTimeout(() => {
                                // \u5C1D\u8BD5\u901A\u77E5\u7236\u7A97\u53E3\uFF08\u5982\u679C\u662F\u5728\u5F39\u51FA\u7A97\u53E3\u4E2D\u6253\u5F00\u7684\uFF09
                                if (window.opener) {
                                    window.opener.postMessage('onedrive_auth_success', '*');
                                }
                                window.close();
                            }, 3000);
                        </script>
                    </div>
                </body>
            </html>
        `);
  } catch (error) {
    console.error("OneDrive \u56DE\u8C03\u5904\u7406\u5931\u8D25:", error);
    res.status(500).send(`\u6388\u6743\u5904\u7406\u51FA\u9519: ${error.message}`);
  }
});
router4.post("/config/google-drive/auth-url", requireAuth, async (req, res) => {
  try {
    const { clientId, clientSecret, redirectUri } = req.body;
    if (!clientId || !clientSecret || !redirectUri) {
      return res.status(400).json({ error: "\u7F3A\u5C11\u5FC5\u8981\u53C2\u6570 (Client ID, Client Secret \u6216 Redirect URI)" });
    }
    const { GoogleDriveStorageProvider: GoogleDriveStorageProvider2, StorageManager: StorageManager2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
    const authUrl = GoogleDriveStorageProvider2.generateAuthUrl(clientId, clientSecret, redirectUri);
    await StorageManager2.updateSetting("google_drive_client_id", clientId);
    await StorageManager2.updateSetting("google_drive_client_secret", clientSecret);
    await StorageManager2.updateSetting("google_drive_redirect_uri", redirectUri);
    res.json({ authUrl });
  } catch (error) {
    console.error("\u83B7\u53D6 Google Drive \u6388\u6743 URL \u5931\u8D25:", error);
    res.status(500).json({ error: "\u83B7\u53D6\u6388\u6743 URL \u5931\u8D25" });
  }
});
router4.get("/google-drive/callback", async (req, res) => {
  try {
    const { code, error } = req.query;
    if (error) {
      return res.send(`\u6388\u6743\u5931\u8D25: ${error}`);
    }
    if (!code) {
      return res.send("\u7F3A\u5C11\u6388\u6743\u7801 (code)");
    }
    const { storageManager: storageManager2, GoogleDriveStorageProvider: GoogleDriveStorageProvider2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
    const clientId = await storageManager2.getSetting("google_drive_client_id");
    const clientSecret = await storageManager2.getSetting("google_drive_client_secret") || "";
    const redirectUri = await storageManager2.getSetting("google_drive_redirect_uri") || getGoogleDriveRedirectUri(req);
    if (!clientId || !clientSecret) {
      return res.send("\u914D\u7F6E\u4FE1\u606F\u4E22\u5931\uFF0C\u8BF7\u8FD4\u56DE\u8BBE\u7F6E\u9875\u9762\u91CD\u8BD5\u3002");
    }
    const tokens = await GoogleDriveStorageProvider2.exchangeCodeForToken(clientId, clientSecret, redirectUri, code);
    if (!tokens.refresh_token) {
      return res.send("\u6388\u6743\u5931\u8D25\uFF1A\u672A\u83B7\u5F97 Refresh Token\u3002\u8BF7\u786E\u4FDD\u662F\u9996\u6B21\u6388\u6743\uFF0C\u6216\u5728 Google \u63A7\u5236\u53F0\u4E2D\u64A4\u9500\u6743\u9650\u540E\u91CD\u8BD5\u3002");
    }
    await storageManager2.addGoogleDriveAccount("Google Drive Account", clientId, clientSecret, tokens.refresh_token, redirectUri);
    const accounts = await storageManager2.getAccounts();
    const newAccount = accounts.filter((a) => a.type === "google_drive").sort((a, b) => b.created_at - a.created_at)[0];
    if (newAccount) {
      await storageManager2.switchAccount(newAccount.id);
    }
    res.send(`
            <html>
                <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
                    <div style="text-align: center; padding: 40px; border-radius: 20px; background: #f0fdf4; border: 1px solid #bbf7d0;">
                        <h2 style="color: #16a34a; margin-bottom: 10px;">\u{1F389} \u6388\u6743\u6210\u529F\uFF01</h2>
                        <p style="color: #15803d; margin-bottom: 20px;">Google Drive \u5DF2\u6210\u529F\u8FDE\u63A5\u5E76\u542F\u7528\u3002</p>
                        <button onclick="window.close()" style="padding: 10px 20px; background: #16a34a; color: white; border: none; border-radius: 8px; cursor: pointer;">\u5173\u95ED\u6B64\u7A97\u53E3</button>
                        <script>
                            setTimeout(() => {
                                if (window.opener) {
                                    window.opener.postMessage('google_drive_auth_success', '*');
                                }
                                window.close();
                            }, 3000);
                        </script>
                    </div>
                </body>
            </html>
        `);
  } catch (error) {
    console.error("Google Drive \u56DE\u8C03\u5904\u7406\u5931\u8D25:", error);
    res.status(500).send(`\u6388\u6743\u5904\u7406\u51FA\u9519: ${error.message}`);
  }
});
router4.put("/config/onedrive", requireAuth, async (req, res) => {
  try {
    const { clientId, clientSecret, refreshToken, tenantId, name } = req.body;
    if (!clientId || !refreshToken) {
      return res.status(400).json({ error: "\u7F3A\u5C11\u5FC5\u8981\u53C2\u6570 (Client ID \u548C Refresh Token)" });
    }
    const { storageManager: storageManager2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
    await storageManager2.updateOneDriveConfig(clientId, clientSecret || "", refreshToken, tenantId || "common", name);
    res.json({ success: true, message: "OneDrive \u914D\u7F6E\u5DF2\u66F4\u65B0\u5E76\u5207\u6362" });
  } catch (error) {
    console.error("\u66F4\u65B0 OneDrive \u914D\u7F6E\u5931\u8D25:", error);
    res.status(500).json({ error: "\u66F4\u65B0 OneDrive \u914D\u7F6E\u5931\u8D25" });
  }
});
router4.post("/config/aliyun-oss", requireAuth, async (req, res) => {
  try {
    const { name, region, accessKeyId, accessKeySecret, bucket } = req.body;
    if (!name || !region || !accessKeyId || !accessKeySecret || !bucket) {
      return res.status(400).json({ error: "\u7F3A\u5C11\u5FC5\u8981\u53C2\u6570" });
    }
    const { storageManager: storageManager2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
    const accountId = await storageManager2.addAliyunOSSAccount(name, region, accessKeyId, accessKeySecret, bucket);
    res.json({ success: true, message: "Aliyun OSS \u8D26\u6237\u5DF2\u6DFB\u52A0", accountId });
  } catch (error) {
    console.error("\u6DFB\u52A0 Aliyun OSS \u914D\u7F6E\u5931\u8D25:", error);
    res.status(500).json({ error: "\u6DFB\u52A0 Aliyun OSS \u914D\u7F6E\u5931\u8D25" });
  }
});
router4.post("/config/s3", requireAuth, async (req, res) => {
  try {
    const { name, endpoint, region, accessKeyId, accessKeySecret, bucket, forcePathStyle } = req.body;
    if (!name || !endpoint || !region || !accessKeyId || !accessKeySecret || !bucket) {
      return res.status(400).json({ error: "\u7F3A\u5C11\u5FC5\u8981\u53C2\u6570" });
    }
    const { storageManager: storageManager2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
    const accountId = await storageManager2.addS3Account(name, endpoint, region, accessKeyId, accessKeySecret, bucket, forcePathStyle || false);
    res.json({ success: true, message: "S3 \u5B58\u50A8\u8D26\u6237\u5DF2\u6DFB\u52A0", accountId });
  } catch (error) {
    console.error("\u6DFB\u52A0 S3 \u914D\u7F6E\u5931\u8D25:", error);
    res.status(500).json({ error: "\u6DFB\u52A0 S3 \u914D\u7F6E\u5931\u8D25" });
  }
});
router4.post("/config/webdav", requireAuth, async (req, res) => {
  try {
    const { name, url, username, password } = req.body;
    if (!name || !url) {
      return res.status(400).json({ error: "\u7F3A\u5C11\u5FC5\u8981\u53C2\u6570 (\u540D\u79F0\u548C URL)" });
    }
    const { storageManager: storageManager2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
    const accountId = await storageManager2.addWebDAVAccount(name, url, username, password);
    res.json({ success: true, message: "WebDAV \u5B58\u50A8\u8D26\u6237\u5DF2\u6DFB\u52A0", accountId });
  } catch (error) {
    console.error("\u6DFB\u52A0 WebDAV \u914D\u7F6E\u5931\u8D25:", error);
    res.status(500).json({ error: "\u6DFB\u52A0 WebDAV \u914D\u7F6E\u5931\u8D25" });
  }
});
router4.post("/switch", requireAuth, async (req, res) => {
  try {
    const { provider, accountId } = req.body;
    const { storageManager: storageManager2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
    if (provider === "local") {
      await storageManager2.switchToLocal();
      return res.json({ success: true, message: "\u5DF2\u5207\u6362\u5230\u672C\u5730\u5B58\u50A8" });
    } else if (provider === "onedrive" || provider === "aliyun_oss" || provider === "s3" || provider === "webdav" || provider === "google_drive") {
      if (accountId) {
        await storageManager2.switchAccount(accountId);
        return res.json({ success: true, message: `\u5DF2\u5207\u6362 ${provider} \u8D26\u6237` });
      } else {
        const accounts = await storageManager2.getAccounts();
        const account = accounts.find((a) => a.type === provider);
        if (!account) {
          return res.status(400).json({ error: `\u672A\u914D\u7F6E\u4EFB\u4F55 ${provider} \u8D26\u6237` });
        }
        await storageManager2.switchAccount(account.id);
        return res.json({ success: true, message: `\u5DF2\u5207\u6362\u5230 ${provider}` });
      }
    } else {
      return res.status(400).json({ error: "\u65E0\u6548\u7684\u5B58\u50A8\u63D0\u4F9B\u5546" });
    }
  } catch (error) {
    console.error("\u5207\u6362\u5B58\u50A8\u5931\u8D25:", error);
    res.status(500).json({ error: "\u5207\u6362\u5B58\u50A8\u5931\u8D25" });
  }
});
router4.get("/accounts", requireAuth, async (req, res) => {
  try {
    const { storageManager: storageManager2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
    const accounts = await storageManager2.getAccounts();
    res.json(accounts);
  } catch (error) {
    console.error("\u83B7\u53D6\u8D26\u6237\u5217\u8868\u5931\u8D25:", error);
    res.status(500).json({ error: "\u83B7\u53D6\u8D26\u6237\u5217\u8868\u5931\u8D25" });
  }
});
router4.delete("/accounts/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { storageManager: storageManager2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
    if (storageManager2.getActiveAccountId() === id) {
      return res.status(400).json({ error: "\u65E0\u6CD5\u5220\u9664\u5F53\u524D\u6B63\u5728\u4F7F\u7528\u7684\u8D26\u6237\uFF0C\u8BF7\u5148\u5207\u6362\u5230\u5176\u4ED6\u8D26\u6237\u6216\u672C\u5730\u5B58\u50A8\u3002" });
    }
    const accountRes = await query("SELECT id, name FROM storage_accounts WHERE id = $1", [id]);
    if (accountRes.rows.length === 0) {
      return res.status(404).json({ error: "\u8D26\u6237\u4E0D\u5B58\u5728" });
    }
    const accountName = accountRes.rows[0].name;
    const accountType = accountRes.rows[0].type;
    await query("UPDATE files SET storage_account_id = NULL WHERE storage_account_id = $1", [id]);
    await query("DELETE FROM storage_accounts WHERE id = $1", [id]);
    storageManager2.removeProvider(`${accountType}:${id}`);
    console.log(`[Storage] Account deleted: ${accountName} (${id})`);
    res.json({ success: true, message: `\u5DF2\u5220\u9664\u8D26\u6237: ${accountName}` });
  } catch (error) {
    console.error("\u5220\u9664\u8D26\u6237\u5931\u8D25:", error);
    res.status(500).json({ error: "\u5220\u9664\u8D26\u6237\u5931\u8D25" });
  }
});
var storage_default = router4;

// src/routes/chunkedUpload.ts
init_db();
import { Router as Router5 } from "express";
import { v4 as uuidv42 } from "uuid";
import path7 from "path";
import fs6 from "fs";
init_storage();
var router5 = Router5();
var UPLOAD_DIR3 = process.env.UPLOAD_DIR || "./data/uploads";
var THUMBNAIL_DIR3 = process.env.THUMBNAIL_DIR || "./data/thumbnails";
var CHUNK_DIR = process.env.CHUNK_DIR || "./data/chunks";
[UPLOAD_DIR3, THUMBNAIL_DIR3, CHUNK_DIR].forEach((dir) => {
  if (!fs6.existsSync(dir)) {
    fs6.mkdirSync(dir, { recursive: true });
  }
});
var uploadSessions = /* @__PURE__ */ new Map();
setInterval(() => {
  const now = /* @__PURE__ */ new Date();
  uploadSessions.forEach((session, uploadId) => {
    if (now.getTime() - session.createdAt.getTime() > 24 * 60 * 60 * 1e3) {
      const chunkDir = path7.join(CHUNK_DIR, uploadId);
      if (fs6.existsSync(chunkDir)) {
        fs6.rmSync(chunkDir, { recursive: true });
      }
      uploadSessions.delete(uploadId);
    }
  });
}, 60 * 60 * 1e3);
function decodeFilename2(filename) {
  try {
    const urlDecoded = decodeURIComponent(filename);
    if (urlDecoded !== filename) {
      return urlDecoded;
    }
  } catch {
  }
  try {
    const bytes = Buffer.from(filename, "binary");
    const decoded = bytes.toString("utf8");
    if (!decoded.includes("\uFFFD") && decoded !== filename) {
      return decoded;
    }
  } catch {
  }
  return filename;
}
router5.post("/init", (req, res) => {
  try {
    const { filename, totalChunks, mimeType, totalSize, folder } = req.body;
    if (!filename || !totalChunks || !mimeType || !totalSize) {
      return res.status(400).json({ error: "\u7F3A\u5C11\u5FC5\u8981\u53C2\u6570" });
    }
    const uploadId = uuidv42();
    const chunkDir = path7.join(CHUNK_DIR, uploadId);
    fs6.mkdirSync(chunkDir, { recursive: true });
    uploadSessions.set(uploadId, {
      uploadId,
      filename: decodeFilename2(filename),
      totalChunks,
      uploadedChunks: /* @__PURE__ */ new Set(),
      mimeType,
      totalSize,
      folder,
      createdAt: /* @__PURE__ */ new Date()
    });
    res.json({
      success: true,
      uploadId,
      message: "\u4E0A\u4F20\u4F1A\u8BDD\u5DF2\u521B\u5EFA"
    });
  } catch (error) {
    console.error("\u521D\u59CB\u5316\u5206\u5757\u4E0A\u4F20\u5931\u8D25:", error);
    res.status(500).json({ error: "\u521D\u59CB\u5316\u4E0A\u4F20\u5931\u8D25" });
  }
});
router5.post("/chunk", async (req, res) => {
  try {
    const uploadIdHeader = req.headers["x-upload-id"];
    const chunkIndexHeader = req.headers["x-chunk-index"];
    const uploadId = Array.isArray(uploadIdHeader) ? uploadIdHeader[0] : uploadIdHeader;
    const chunkIndex = parseInt(Array.isArray(chunkIndexHeader) ? chunkIndexHeader[0] : chunkIndexHeader || "", 10);
    if (!uploadId || isNaN(chunkIndex)) {
      return res.status(400).json({ error: "\u7F3A\u5C11\u4E0A\u4F20 ID \u6216\u5206\u5757\u7D22\u5F15" });
    }
    const session = uploadSessions.get(uploadId);
    if (!session) {
      return res.status(404).json({ error: "\u4E0A\u4F20\u4F1A\u8BDD\u4E0D\u5B58\u5728\u6216\u5DF2\u8FC7\u671F" });
    }
    const chunkPath = path7.join(CHUNK_DIR, uploadId, `chunk_${chunkIndex}`);
    const writeStream = fs6.createWriteStream(chunkPath);
    await new Promise((resolve, reject) => {
      req.pipe(writeStream);
      req.on("end", () => {
        session.uploadedChunks.add(chunkIndex);
        resolve();
      });
      req.on("error", reject);
      writeStream.on("error", reject);
    });
    const progress = Math.round(session.uploadedChunks.size / session.totalChunks * 100);
    res.json({
      success: true,
      chunkIndex,
      uploadedChunks: session.uploadedChunks.size,
      totalChunks: session.totalChunks,
      progress
    });
  } catch (error) {
    console.error("\u4E0A\u4F20\u5206\u5757\u5931\u8D25:", error);
    res.status(500).json({ error: "\u4E0A\u4F20\u5206\u5757\u5931\u8D25" });
  }
});
router5.post("/complete", async (req, res) => {
  try {
    const { uploadId } = req.body;
    if (!uploadId) {
      return res.status(400).json({ error: "\u7F3A\u5C11\u4E0A\u4F20 ID" });
    }
    const session = uploadSessions.get(uploadId);
    if (!session) {
      return res.status(404).json({ error: "\u4E0A\u4F20\u4F1A\u8BDD\u4E0D\u5B58\u5728\u6216\u5DF2\u8FC7\u671F" });
    }
    if (session.uploadedChunks.size !== session.totalChunks) {
      return res.status(400).json({
        error: "\u5206\u5757\u4E0D\u5B8C\u6574",
        uploadedChunks: session.uploadedChunks.size,
        totalChunks: session.totalChunks
      });
    }
    const ext = path7.extname(session.filename);
    const storedName = `${uuidv42()}${ext}`;
    const finalPath = path7.resolve(path7.join(UPLOAD_DIR3, storedName));
    const writeStream = fs6.createWriteStream(finalPath);
    console.log(`[ChunkedComplete] \u{1F9E9} Merging ${session.totalChunks} chunks for: ${session.filename}`);
    console.log(`[ChunkedComplete] \u{1F3E0} Final temp path: ${finalPath}`);
    for (let i = 0; i < session.totalChunks; i++) {
      const chunkPath = path7.join(CHUNK_DIR, uploadId, `chunk_${i}`);
      const chunkData = fs6.readFileSync(chunkPath);
      writeStream.write(chunkData);
    }
    await new Promise((resolve, reject) => {
      writeStream.end();
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });
    const chunkDir = path7.join(CHUNK_DIR, uploadId);
    fs6.rmSync(chunkDir, { recursive: true });
    uploadSessions.delete(uploadId);
    let thumbnailPath = null;
    let width = null;
    let height = null;
    if (session.mimeType.startsWith("image/") || session.mimeType.startsWith("video/")) {
      try {
        console.log(`[ChunkedComplete] \u{1F5BC}\uFE0F  MIME: ${session.mimeType}, starting generation...`);
        const thumbResult = await generateThumbnail(finalPath, storedName, session.mimeType);
        if (thumbResult) {
          thumbnailPath = path7.basename(thumbResult);
          console.log(`[ChunkedComplete] \u2728 Thumbnail generated: ${thumbnailPath}`);
          const dims = await getImageDimensions(finalPath, session.mimeType);
          width = dims.width;
          height = dims.height;
        } else {
          console.log(`[ChunkedComplete] \u26A0\uFE0F  No thumbnail generated for: ${session.mimeType}`);
        }
      } catch (error) {
        console.error("\u751F\u6210\u7F29\u7565\u56FE\u5931\u8D25:", error);
      }
    }
    let storedPath = "";
    const provider = storageManager.getProvider();
    const activeAccountId = storageManager.getActiveAccountId();
    console.log(`[ChunkedComplete] \u{1F6E0}\uFE0F  Provider: ${provider.name}, accountId: ${activeAccountId || "none (local)"}`);
    try {
      storedPath = await provider.saveFile(finalPath, storedName, session.mimeType);
    } catch (err) {
      if (fs6.existsSync(finalPath)) fs6.unlinkSync(finalPath);
      throw err;
    }
    if (fs6.existsSync(finalPath)) {
      try {
        fs6.unlinkSync(finalPath);
      } catch (e) {
      }
    }
    const type = session.mimeType.startsWith("image/") ? "image" : session.mimeType.startsWith("video/") ? "video" : session.mimeType.startsWith("audio/") ? "audio" : "other";
    const result = await query(
      `INSERT INTO files 
            (name, stored_name, type, mime_type, size, path, thumbnail_path, width, height, source, folder, storage_account_id) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
            RETURNING id, created_at, name, type, size`,
      [session.filename, storedName, type, session.mimeType, session.totalSize, storedPath, thumbnailPath, width, height, provider.name, session.folder || null, activeAccountId]
    );
    const newFile = result.rows[0];
    res.json({
      success: true,
      file: {
        id: newFile.id,
        name: newFile.name,
        type: newFile.type,
        size: newFile.size,
        thumbnailUrl: thumbnailPath ? getSignedUrl(newFile.id, "thumbnail") : void 0,
        previewUrl: getSignedUrl(newFile.id, "preview"),
        date: newFile.created_at,
        source: provider.name
      }
    });
  } catch (error) {
    console.error("\u5B8C\u6210\u4E0A\u4F20\u5931\u8D25:", error);
    res.status(500).json({ error: "\u5B8C\u6210\u4E0A\u4F20\u5931\u8D25" });
  }
});
router5.delete("/:uploadId", (req, res) => {
  try {
    const uploadId = req.params.uploadId;
    const session = uploadSessions.get(uploadId);
    if (session) {
      const chunkDir = path7.join(CHUNK_DIR, uploadId);
      if (fs6.existsSync(chunkDir)) {
        fs6.rmSync(chunkDir, { recursive: true });
      }
      uploadSessions.delete(uploadId);
    }
    res.json({ success: true, message: "\u4E0A\u4F20\u5DF2\u53D6\u6D88" });
  } catch (error) {
    console.error("\u53D6\u6D88\u4E0A\u4F20\u5931\u8D25:", error);
    res.status(500).json({ error: "\u53D6\u6D88\u4E0A\u4F20\u5931\u8D25" });
  }
});
router5.get("/:uploadId/status", (req, res) => {
  try {
    const uploadId = req.params.uploadId;
    const session = uploadSessions.get(uploadId);
    if (!session) {
      return res.status(404).json({ error: "\u4E0A\u4F20\u4F1A\u8BDD\u4E0D\u5B58\u5728" });
    }
    res.json({
      uploadId: session.uploadId,
      filename: session.filename,
      totalChunks: session.totalChunks,
      uploadedChunks: session.uploadedChunks.size,
      progress: Math.round(session.uploadedChunks.size / session.totalChunks * 100)
    });
  } catch (error) {
    console.error("\u83B7\u53D6\u4E0A\u4F20\u72B6\u6001\u5931\u8D25:", error);
    res.status(500).json({ error: "\u83B7\u53D6\u4E0A\u4F20\u72B6\u6001\u5931\u8D25" });
  }
});
var chunkedUpload_default = router5;

// src/services/telegramBot.ts
init_storage();
import { TelegramClient as TelegramClient2, Api as Api2 } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { NewMessage } from "telegram/events/index.js";
import { Raw } from "telegram/events/index.js";
import fs10 from "fs";
import path11 from "path";

// src/services/telegramState.ts
init_db();
var authenticatedUsers = /* @__PURE__ */ new Map();
var passwordInputState = /* @__PURE__ */ new Map();
async function loadAuthenticatedUsers() {
  try {
    const result = await query("SELECT user_id, authenticated_at FROM telegram_auth");
    result.rows.forEach((row) => {
      authenticatedUsers.set(Number(row.user_id), { authenticatedAt: new Date(row.authenticated_at) });
    });
    console.log(`\u{1F916} \u5DF2\u4ECE\u6570\u636E\u5E93\u8F7D\u5165 ${authenticatedUsers.size} \u4E2A\u6388\u6743\u7528\u6237`);
  } catch (error) {
    console.error("\u{1F916} \u8F7D\u5165\u5DF2\u9A8C\u8BC1\u7528\u6237\u5931\u8D25:", error);
  }
}
async function persistAuthenticatedUser(userId) {
  try {
    await query("INSERT INTO telegram_auth (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING", [userId]);
    authenticatedUsers.set(userId, { authenticatedAt: /* @__PURE__ */ new Date() });
    console.log(`\u{1F916} \u7528\u6237 ${userId} \u5DF2\u6301\u4E45\u5316\u5230\u6570\u636E\u5E93`);
  } catch (error) {
    console.error("\u{1F916} \u6301\u4E45\u5316\u7528\u6237\u5931\u8D25:", error);
  }
}
function isAuthenticated(userId) {
  const ACCESS_PASSWORD_HASH3 = process.env.ACCESS_PASSWORD_HASH || "";
  if (!ACCESS_PASSWORD_HASH3) {
    return true;
  }
  return authenticatedUsers.has(userId);
}

// src/services/telegramCommands.ts
init_db();
import checkDiskSpaceModule2 from "check-disk-space";
import os2 from "os";
import fs8 from "fs";

// src/utils/telegramUtils.ts
import crypto4 from "crypto";
import path8 from "path";
var ACCESS_PASSWORD_HASH2 = process.env.ACCESS_PASSWORD_HASH || "";
function verifyPassword2(password) {
  if (!ACCESS_PASSWORD_HASH2) {
    return true;
  }
  const inputHash = crypto4.createHash("sha256").update(password).digest("hex");
  try {
    return crypto4.timingSafeEqual(Buffer.from(inputHash), Buffer.from(ACCESS_PASSWORD_HASH2));
  } catch (e) {
    return false;
  }
}
function formatBytes2(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
function getTypeEmoji(mimeType) {
  if (!mimeType) return "\u{1F4C1}";
  if (mimeType.startsWith("image/")) return "\u{1F5BC}\uFE0F";
  if (mimeType.startsWith("video/")) return "\u{1F3AC}";
  if (mimeType.startsWith("audio/")) return "\u{1F3B5}";
  if (mimeType.includes("pdf") || mimeType.includes("document") || mimeType.includes("text")) return "\u{1F4C4}";
  return "\u{1F4C1}";
}
function getFileType(mimeType) {
  if (!mimeType) return "other";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.includes("pdf") || mimeType.includes("document") || mimeType.includes("text")) return "document";
  return "other";
}
function getMimeTypeFromFilename(filename) {
  const ext = path8.extname(filename).toLowerCase();
  const mimeTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".bmp": "image/bmp",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".avi": "video/x-msvideo",
    ".mov": "video/quicktime",
    ".mkv": "video/x-matroska",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".txt": "text/plain",
    ".zip": "application/zip",
    ".rar": "application/x-rar-compressed",
    ".7z": "application/x-7z-compressed"
  };
  return mimeTypes[ext] || "application/octet-stream";
}
function sanitizeFilename(name) {
  if (!name) return "unknown";
  const firstLine = name.split("\n")[0].trim();
  let sanitized = firstLine.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").replace(/\s+/g, " ").trim();
  sanitized = sanitized.replace(/[.\s]+$/, "");
  if (!sanitized) return "unknown";
  let result = sanitized.substring(0, 50);
  const MAX_BYTES = 150;
  while (Buffer.byteLength(result, "utf8") > MAX_BYTES && result.length > 0) {
    result = result.substring(0, result.length - 1);
  }
  return result || "unknown";
}

// src/services/telegramUpload.ts
init_db();
import { Api } from "telegram";
import fs7 from "fs";
import path9 from "path";
import { v4 as uuidv43 } from "uuid";
init_storage();
var UPLOAD_DIR4 = process.env.UPLOAD_DIR || "./data/uploads";
var floodWaitUntil = 0;
async function safeEditMessage(client2, chatId, params) {
  if (Date.now() < floodWaitUntil) return null;
  try {
    return await client2.editMessage(chatId, params);
  } catch (e) {
    if (e.errorMessage === "FLOOD" || e.errorMessage?.includes("FLOOD_WAIT")) {
      const seconds = e.seconds || 30;
      floodWaitUntil = Date.now() + seconds * 1e3;
      console.warn(`[Telegram] \u26A0\uFE0F \u89E6\u53D1 FloodWait\uFF0C\u51B7\u5374\u65F6\u95F4: ${seconds} \u79D2`);
    }
    return null;
  }
}
async function safeReply(message, params) {
  if (Date.now() < floodWaitUntil) return null;
  try {
    return await message.reply(params);
  } catch (e) {
    if (e.errorMessage === "FLOOD" || e.errorMessage?.includes("FLOOD_WAIT")) {
      const seconds = e.seconds || 30;
      floodWaitUntil = Date.now() + seconds * 1e3;
      console.warn(`[Telegram] \u26A0\uFE0F \u89E6\u53D1 FloodWait (Reply)\uFF0C\u51B7\u5374\u65F6\u95F4: ${seconds} \u79D2`);
    }
    return null;
  }
}
var BetterDownloadQueue = class {
  queue = [];
  active = [];
  history = [];
  maxHistory = 50;
  maxConcurrent = 2;
  // 用户要求并发限制为 2
  async add(fileName, execute, totalSize = 0) {
    const id = uuidv43();
    return new Promise((resolve, reject) => {
      const task = {
        id,
        fileName,
        status: "pending",
        totalSize,
        downloadedSize: 0,
        // The actual execution logic
        execute: async () => {
          task.status = "active";
          task.startTime = Date.now();
          this.active.push(task);
          try {
            await execute();
            task.status = "success";
            resolve();
          } catch (error) {
            task.status = "failed";
            task.error = error instanceof Error ? error.message : String(error);
            reject(error);
          } finally {
            task.endTime = Date.now();
            const idx = this.active.findIndex((t) => t.id === id);
            if (idx !== -1) this.active.splice(idx, 1);
            this.history.unshift(task);
            if (this.history.length > this.maxHistory) this.history.pop();
            this.processNext();
          }
        }
      };
      this.queue.push(task);
      console.log(`[Queue] \u{1F4E5} Task added: ${fileName}. Queue size: ${this.queue.length}`);
      this.processNext();
    });
  }
  processNext() {
    if (this.active.length >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }
    const task = this.queue.shift();
    if (task) {
      console.log(`[Queue] \u{1F680} Processing task: ${task.fileName}. Active: ${this.active.length + 1}, Pending: ${this.queue.length}`);
      task.execute();
    }
  }
  getStats() {
    return {
      active: this.active.length,
      pending: this.queue.length,
      total: this.active.length + this.queue.length
    };
  }
  getDetailedStatus() {
    return {
      active: [...this.active],
      pending: [...this.queue],
      history: [...this.history]
    };
  }
  // Update progress method
  updateProgress(taskId, downloaded) {
    const task = this.active.find((t) => t.id === taskId);
    if (task) {
      task.downloadedSize = downloaded;
    }
  }
};
var downloadQueue = new BetterDownloadQueue();
var statusActionLocks = /* @__PURE__ */ new Map();
var lastSilentNotificationTimeMap = /* @__PURE__ */ new Map();
var SILENT_NOTIFICATION_COOLDOWN = 3e4;
async function runStatusAction(chatId, action) {
  if (!chatId) return;
  const chatIdStr = chatId.toString();
  const currentLock = statusActionLocks.get(chatIdStr) || Promise.resolve();
  const nextLock = currentLock.then(async () => {
    try {
      await action();
    } catch (e) {
      console.error(`[Status] \u274C Action failed for chat ${chatIdStr}:`, e);
    }
  });
  statusActionLocks.set(chatIdStr, nextLock);
  return nextLock;
}
var lastStatusMessageIdMap = /* @__PURE__ */ new Map();
var lastStatusMessageIsSilent = /* @__PURE__ */ new Map();
async function deleteLastStatusMessage(client2, chatId) {
  if (!chatId) return;
  const chatIdStr = chatId.toString();
  const lastMsgId = lastStatusMessageIdMap.get(chatIdStr);
  if (lastMsgId) {
    try {
      await client2.deleteMessages(chatId, [lastMsgId], { revoke: true });
    } catch (e) {
    }
    lastStatusMessageIdMap.delete(chatIdStr);
    lastStatusMessageIsSilent.delete(chatIdStr);
  }
}
function updateLastStatusMessageId(chatId, msgId, isSilent = false) {
  if (!chatId || !msgId) return;
  const chatIdStr = chatId.toString();
  lastStatusMessageIdMap.set(chatIdStr, msgId);
  lastStatusMessageIsSilent.set(chatIdStr, isSilent);
}
function getDownloadQueueStats() {
  return downloadQueue.getStats();
}
function getTaskStatus() {
  return downloadQueue.getDetailedStatus();
}
var mediaGroupQueues = /* @__PURE__ */ new Map();
var MEDIA_GROUP_DELAY = 1500;
function getEstimatedFileSize(message) {
  if (message.document) {
    return Number(message.document.size) || 0;
  }
  if (message.video) {
    return Number(message.video.size) || 0;
  }
  if (message.audio) {
    return Number(message.audio.size) || 0;
  }
  if (message.photo) {
    return 1024 * 1024;
  }
  return 0;
}
function generateProgressBar(completed, total, barLength = 15) {
  const percentage = total > 0 ? Math.round(completed / total * 100) : 0;
  const filledLength = Math.round(completed / total * barLength);
  const emptyLength = barLength - filledLength;
  const filledBar = "\u2593".repeat(filledLength);
  const emptyBar = "\u2591".repeat(emptyLength);
  return `${filledBar}${emptyBar} ${percentage}%`;
}
function extractFileInfo(message) {
  if (!message.media) return null;
  let fileName = "unknown";
  let mimeType = "application/octet-stream";
  try {
    if (message.document) {
      const doc = message.document;
      const fileNameAttr = doc.attributes?.find((a) => a.className === "DocumentAttributeFilename");
      fileName = fileNameAttr?.fileName || `file_${Date.now()}`;
      mimeType = doc.mimeType || getMimeTypeFromFilename(fileName);
      if (fileName.startsWith("file_")) {
        const videoAttr = doc.attributes?.find((a) => a.className === "DocumentAttributeVideo");
        const audioAttr = doc.attributes?.find((a) => a.className === "DocumentAttributeAudio");
        if (videoAttr) fileName = `video_${Date.now()}.mp4`;
        else if (audioAttr) fileName = `audio_${Date.now()}.mp3`;
      }
    } else if (message.photo) {
      fileName = `photo_${Date.now()}.jpg`;
      mimeType = "image/jpeg";
    } else if (message.video) {
      const video = message.video;
      const fileNameAttr = video.attributes?.find((a) => a.className === "DocumentAttributeFilename");
      fileName = fileNameAttr?.fileName || `video_${Date.now()}.mp4`;
      mimeType = video.mimeType || "video/mp4";
    } else if (message.audio) {
      const audio = message.audio;
      const fileNameAttr = audio.attributes?.find((a) => a.className === "DocumentAttributeFilename");
      fileName = fileNameAttr?.fileName || `audio_${Date.now()}.mp3`;
      mimeType = audio.mimeType || "audio/mpeg";
    } else if (message.voice) {
      fileName = `voice_${Date.now()}.ogg`;
      mimeType = "audio/ogg";
    } else if (message.sticker) {
      fileName = `sticker_${Date.now()}.webp`;
      mimeType = "image/webp";
    } else {
      const media = message.media;
      if (media.document && media.document instanceof Api.Document) {
        const doc = media.document;
        const fileNameAttr = doc.attributes?.find((a) => a.className === "DocumentAttributeFilename");
        fileName = fileNameAttr?.fileName || `file_${Date.now()}`;
        mimeType = doc.mimeType || getMimeTypeFromFilename(fileName);
      } else {
        return null;
      }
    }
  } catch (e) {
    console.error("\u{1F916} \u63D0\u53D6\u6587\u4EF6\u4FE1\u606F\u51FA\u9519:", e);
    return null;
  }
  return { fileName: sanitizeFilename(fileName), mimeType };
}
async function downloadAndSaveFile(client2, message, fileName, targetDir, onProgress) {
  const ext = path9.extname(fileName) || "";
  const storedName = `${uuidv43()}${ext}`;
  let saveDir = targetDir || UPLOAD_DIR4;
  if (!fs7.existsSync(saveDir)) {
    try {
      fs7.mkdirSync(saveDir, { recursive: true });
    } catch (err) {
      console.error(`\u{1F916} \u521B\u5EFA\u4E0B\u8F7D\u76EE\u5F55\u5931\u8D25: ${saveDir}`, err);
      if (saveDir === UPLOAD_DIR4) throw err;
      saveDir = UPLOAD_DIR4;
    }
  }
  const filePath = path9.join(saveDir, storedName);
  const totalSize = getEstimatedFileSize(message);
  let downloadedSize = 0;
  try {
    const writeStream = fs7.createWriteStream(filePath);
    for await (const chunk of client2.iterDownload({
      file: message.media,
      requestSize: 512 * 1024
    })) {
      writeStream.write(chunk);
      downloadedSize += chunk.length;
      if (onProgress && totalSize > 0) {
        onProgress(downloadedSize, totalSize);
      }
    }
    writeStream.end();
    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });
    const stats = fs7.statSync(filePath);
    return { filePath, actualSize: stats.size, storedName };
  } catch (error) {
    console.error("\u{1F916} \u4E0B\u8F7D\u6587\u4EF6\u5931\u8D25:", error);
    if (fs7.existsSync(filePath)) {
      fs7.unlinkSync(filePath);
    }
    return null;
  }
}
function generateBatchStatusMessage(queue) {
  const total = queue.files.length;
  const completed = queue.files.filter((f) => f.status === "success" || f.status === "failed").length;
  const successful = queue.files.filter((f) => f.status === "success").length;
  const failed = queue.files.filter((f) => f.status === "failed").length;
  let statusIcon = "\u23F3";
  let statusText = "\u6B63\u5728\u5904\u7406\u591A\u6587\u4EF6\u4E0A\u4F20...";
  if (completed === total) {
    if (failed === 0) {
      statusIcon = "\u2705";
      statusText = "\u591A\u6587\u4EF6\u4E0A\u4F20\u5B8C\u6210!";
    } else if (successful === 0) {
      statusIcon = "\u274C";
      statusText = "\u591A\u6587\u4EF6\u4E0A\u4F20\u5931\u8D25!";
    } else {
      statusIcon = "\u26A0\uFE0F";
      statusText = "\u591A\u6587\u4EF6\u4E0A\u4F20\u90E8\u5206\u5B8C\u6210";
    }
  }
  let message = `${statusIcon} **${statusText}**

`;
  if (completed < total) {
    const stats = downloadQueue.getStats();
    if (stats.pending > 0 || stats.active >= 2) {
      message += `\u23F3 \u5DF2\u52A0\u5165\u4E0B\u8F7D\u961F\u5217 (\u5F53\u524D\u6392\u961F: ${stats.pending})
\u{1F4A1} \u8BF7\u8010\u5FC3\u7B49\u5F85\uFF0CBot \u5C06\u6309\u987A\u5E8F\u5904\u7406\u4EFB\u52A1\u3002

`;
    }
  }
  if (queue.folderName) {
    message += `\u{1F4C1} \u6587\u4EF6\u5939: ${queue.folderName}
`;
  }
  message += `\u{1F4CA} \u8FDB\u5EA6: ${completed}/${total}
`;
  message += `${generateProgressBar(completed, total)}

`;
  queue.files.forEach((file) => {
    let fileIcon = "\u23F3";
    let fileStatus = "\u7B49\u5F85\u4E2D";
    switch (file.status) {
      case "uploading":
        fileIcon = "\u{1F504}";
        fileStatus = "\u4E0A\u4F20\u4E2D...";
        break;
      case "success":
        fileIcon = "\u2705";
        fileStatus = formatBytes2(file.size || 0);
        break;
      case "failed":
        fileIcon = "\u274C";
        fileStatus = file.error || "\u5931\u8D25";
        break;
      case "pending":
        fileIcon = "\u23F3";
        fileStatus = "\u7B49\u5F85\u4E2D";
        break;
      case "queued":
        fileIcon = "\u{1F552}";
        fileStatus = "\u6392\u961F\u4E2D...";
        break;
    }
    const typeEmoji = getTypeEmoji(file.mimeType);
    message += `${fileIcon} ${typeEmoji} ${file.fileName}
`;
    message += `    \u2514 ${fileStatus}
`;
  });
  return message;
}
async function processFileUpload(client2, file, queue) {
  file.status = "queued";
  const attemptUpload = async () => {
    let localFilePath;
    let storedName;
    try {
      const targetDir = queue?.folderPath;
      const result = await downloadAndSaveFile(client2, file.message, file.fileName, targetDir);
      if (!result) {
        file.error = "\u4E0B\u8F7D\u5931\u8D25";
        return false;
      }
      localFilePath = result.filePath;
      storedName = result.storedName;
      const actualSize = result.actualSize;
      const fileType = getFileType(file.mimeType);
      let thumbnailPath = null;
      let dimensions = {};
      try {
        thumbnailPath = await generateThumbnail(localFilePath, storedName, file.mimeType);
        dimensions = await getImageDimensions(localFilePath, file.mimeType);
      } catch (thumbErr) {
        console.warn("\u{1F916} \u751F\u6210\u7F29\u7565\u56FE/\u83B7\u53D6\u5C3A\u5BF8\u5931\u8D25\uFF0C\u7EE7\u7EED\u4E0A\u4F20:", thumbErr);
      }
      const provider = storageManager.getProvider();
      let finalPath = localFilePath;
      let sourceRef = provider.name;
      if (provider.name !== "local") {
        try {
          finalPath = await provider.saveFile(localFilePath, storedName, file.mimeType);
          if (fs7.existsSync(localFilePath)) {
            fs7.unlinkSync(localFilePath);
          }
        } catch (err) {
          console.error("\u4FDD\u5B58\u6587\u4EF6\u5230\u5B58\u50A8\u63D0\u4F9B\u5546\u5931\u8D25:", err);
          throw err;
        }
      }
      const folderName = queue?.folderName || null;
      const activeAccountId = storageManager.getActiveAccountId();
      await query(`
                INSERT INTO files (name, stored_name, type, mime_type, size, path, thumbnail_path, width, height, source, folder, storage_account_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            `, [file.fileName, storedName, fileType, file.mimeType, actualSize, finalPath, thumbnailPath, dimensions.width, dimensions.height, sourceRef, folderName, activeAccountId]);
      file.status = "success";
      file.size = actualSize;
      file.fileType = fileType;
      return true;
    } catch (error) {
      console.error("\u{1F916} \u6587\u4EF6\u4E0A\u4F20\u5931\u8D25:", error);
      file.error = error.message;
      if (localFilePath && fs7.existsSync(localFilePath)) {
        try {
          fs7.unlinkSync(localFilePath);
          console.log(`\u{1F916} \u4E0A\u4F20\u5C1D\u8BD5\u5931\u8D25\uFF0C\u5DF2\u81EA\u52A8\u6E05\u7406\u672C\u5730\u5783\u573E\u7F13\u5B58: ${localFilePath}`);
        } catch (e) {
          console.error("\u{1F916} \u81EA\u52A8\u6E05\u7406\u5783\u573E\u7F13\u5B58\u5931\u8D25:", e);
        }
      }
      return false;
    }
  };
  const queueTask = async () => {
    file.status = "uploading";
    if (queue && queue.statusMsgId && queue.chatId) {
      await runStatusAction(queue.chatId, async () => {
        await safeEditMessage(client2, queue.chatId, {
          message: queue.statusMsgId,
          text: generateBatchStatusMessage(queue)
        });
      });
    }
    const firstAttemptSuccess = await attemptUpload();
    if (!firstAttemptSuccess && !file.retried) {
      file.retried = true;
      file.status = "uploading";
      file.error = void 0;
      if (queue && queue.statusMsgId && queue.chatId) {
        await runStatusAction(queue.chatId, async () => {
          await safeEditMessage(client2, queue.chatId, {
            message: queue.statusMsgId,
            text: generateBatchStatusMessage(queue).replace(file.fileName, `${file.fileName} (\u91CD\u8BD5\u4E2D...)`)
          });
        });
      }
      const retrySuccess = await attemptUpload();
      if (!retrySuccess) {
        file.status = "failed";
      }
    } else if (!firstAttemptSuccess) {
      file.status = "failed";
    }
    if (queue && queue.statusMsgId && queue.chatId) {
      await runStatusAction(queue.chatId, async () => {
        await safeEditMessage(client2, queue.chatId, {
          message: queue.statusMsgId,
          text: generateBatchStatusMessage(queue)
        });
      });
    }
  };
  downloadQueue.add(file.fileName, queueTask).catch((err) => {
    console.error(`Unhandled error in download task for ${file.fileName}:`, err);
  });
}
async function processBatchUpload(client2, mediaGroupId) {
  const queue = mediaGroupQueues.get(mediaGroupId);
  if (!queue || queue.processingStarted) return;
  queue.processingStarted = true;
  const firstMessage = queue.files[0]?.message;
  if (!firstMessage) return;
  let folderName = "";
  for (const file of queue.files) {
    const caption = file.message.message || file.message.text || "";
    if (caption && caption.trim()) {
      folderName = caption.trim();
      break;
    }
  }
  if (!folderName) {
    const now = /* @__PURE__ */ new Date();
    folderName = `batch_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  }
  let sanitizedFolderName = sanitizeFilename(folderName);
  let folderPath = path9.join(UPLOAD_DIR4, sanitizedFolderName);
  if (!fs7.existsSync(folderPath)) {
    try {
      fs7.mkdirSync(folderPath, { recursive: true });
    } catch (err) {
      console.error(`\u{1F916} \u521B\u5EFA\u6279\u91CF\u4E0A\u4F20\u6587\u4EF6\u5939\u5931\u8D25: ${folderPath}`, err);
      const fallbackFolderName = `fallback_${Date.now()}`;
      const fallbackPath = path9.join(UPLOAD_DIR4, fallbackFolderName);
      try {
        if (!fs7.existsSync(fallbackPath)) {
          fs7.mkdirSync(fallbackPath, { recursive: true });
        }
        sanitizedFolderName = fallbackFolderName;
        folderPath = fallbackPath;
      } catch (innerErr) {
        sanitizedFolderName = "";
        folderPath = UPLOAD_DIR4;
      }
    }
  }
  queue.folderName = sanitizedFolderName;
  queue.folderPath = folderPath;
  await runStatusAction(queue.chatId, async () => {
    const stats = downloadQueue.getStats();
    const totalPending = stats.pending + queue.files.length;
    const chatIdStr = queue.chatId.toString();
    const lastMsgId = lastStatusMessageIdMap.get(chatIdStr);
    if (totalPending >= 9) {
      const now = Date.now();
      const lastTime = lastSilentNotificationTimeMap.get(chatIdStr) || 0;
      if (now - lastTime > SILENT_NOTIFICATION_COOLDOWN || !lastMsgId) {
        await deleteLastStatusMessage(client2, queue.chatId);
        const sMsg = await safeReply(firstMessage, {
          message: `\u{1F910} **\u68C0\u6D4B\u5230\u591A\u6587\u4EF6\u4E0A\u4F20\uFF0C\u5DF2\u5207\u6362\u5230\u9759\u9ED8\u6A21\u5F0F**

\u5F53\u524D\u6392\u961F\u4EFB\u52A1: ${totalPending} \u4E2A
Bot \u5C06\u5728\u540E\u53F0\u7EE7\u7EED\u5904\u7406\u6240\u6709\u6587\u4EF6\uFF0C\u8BF7\u8010\u5FC3\u7B49\u5F85\u3002

\u{1F4A1} \u53D1\u9001 /tasks \u67E5\u770B\u5B9E\u65F6\u4EFB\u52A1\u72B6\u6001`
        });
        if (sMsg) {
          updateLastStatusMessageId(queue.chatId, sMsg.id, true);
        }
        lastSilentNotificationTimeMap.set(chatIdStr, now);
      }
    } else {
      await deleteLastStatusMessage(client2, queue.chatId);
      const statusMsg = await safeReply(firstMessage, {
        message: generateBatchStatusMessage(queue)
      });
      if (statusMsg) {
        queue.statusMsgId = statusMsg.id;
        updateLastStatusMessageId(queue.chatId, statusMsg.id, false);
      }
    }
  });
  await Promise.all(queue.files.map((file) => processFileUpload(client2, file, queue)));
  if (queue.statusMsgId && queue.chatId) {
    await runStatusAction(queue.chatId, async () => {
      await safeEditMessage(client2, queue.chatId, {
        message: queue.statusMsgId,
        text: generateBatchStatusMessage(queue)
      });
    });
  } else if (queue.chatId) {
    const chatIdStr = queue.chatId.toString();
    if (lastStatusMessageIsSilent.get(chatIdStr)) {
      const lastMsgId = lastStatusMessageIdMap.get(chatIdStr);
      if (lastMsgId) {
        const successful = queue.files.filter((f) => f.status === "success");
        if (successful.length > 0) {
          const types = Array.from(new Set(successful.map((f) => getTypeEmoji(f.mimeType)))).join(" ");
          const provider = storageManager.getProvider();
          const providerName = provider.name === "onedrive" ? "\u2601\uFE0F OneDrive" : provider.name === "aliyun_oss" ? "\u2601\uFE0F \u963F\u91CC\u4E91 OSS" : provider.name === "s3" ? "\u{1F4E6} S3 \u5B58\u50A8" : provider.name === "webdav" ? "\u{1F310} WebDAV" : "\u{1F4BE} \u672C\u5730";
          await safeEditMessage(client2, queue.chatId, {
            message: lastMsgId,
            text: `\u2705 **\u591A\u6587\u4EF6\u4E0A\u4F20\u5B8C\u6210!**
\u{1F3F7}\uFE0F \u7C7B\u578B: ${types}
\u{1F4CD} \u5B58\u50A8: ${providerName}`
          });
          lastStatusMessageIsSilent.set(chatIdStr, false);
        }
      }
    }
  }
  mediaGroupQueues.delete(mediaGroupId);
}
var pendingCleanups = /* @__PURE__ */ new Map();
async function handleCleanupCallback(cleanupId) {
  const cleanupInfo = pendingCleanups.get(cleanupId);
  if (!cleanupInfo) {
    return { success: false, message: "\u8BE5\u6E05\u7406\u4EFB\u52A1\u5DF2\u8FC7\u671F\u6216\u4E0D\u5B58\u5728" };
  }
  try {
    if (cleanupInfo.localPath && fs7.existsSync(cleanupInfo.localPath)) {
      fs7.unlinkSync(cleanupInfo.localPath);
    }
    pendingCleanups.delete(cleanupId);
    return {
      success: true,
      message: `\u2705 \u5DF2\u6E05\u7406 ${cleanupInfo.fileName} \u7684\u5783\u573E\u7F13\u5B58 (${formatBytes2(cleanupInfo.size)})`
    };
  } catch (error) {
    console.error("\u{1F916} \u6E05\u7406\u5783\u573E\u7F13\u5B58\u5931\u8D25:", error);
    return { success: false, message: `\u6E05\u7406\u5931\u8D25: ${error.message}` };
  }
}
async function handleFileUpload(client2, event) {
  const message = event.message;
  const senderId = message.senderId?.toJSNumber();
  if (!senderId) return;
  if (!isAuthenticated(senderId)) {
    await message.reply({ message: "\u{1F510} \u8BF7\u5148\u53D1\u9001 /start \u9A8C\u8BC1\u5BC6\u7801\u540E\u518D\u4E0A\u4F20\u6587\u4EF6" });
    return;
  }
  const fileInfo = extractFileInfo(message);
  if (!fileInfo) {
    if (message.media) {
      if (message.media.className === "MessageMediaWebPage") return;
      await message.reply({ message: "\u26A0\uFE0F \u62B1\u6B49\uFF0C\u6682\u4E0D\u652F\u6301\u6216\u65E0\u6CD5\u8BC6\u522B\u6B64\u7C7B\u5A92\u4F53\u683C\u5F0F\u8FDB\u884C\u4E0A\u4F20\u3002" });
    }
    return;
  }
  const { fileName, mimeType } = fileInfo;
  const mediaGroupId = message.groupedId?.toString();
  if (mediaGroupId) {
    let queue = mediaGroupQueues.get(mediaGroupId);
    if (!queue) {
      queue = {
        chatId: message.chatId,
        files: [],
        processingStarted: false,
        createdAt: Date.now()
      };
      mediaGroupQueues.set(mediaGroupId, queue);
      setTimeout(() => {
        processBatchUpload(client2, mediaGroupId);
      }, MEDIA_GROUP_DELAY);
    }
    queue.files.push({
      fileName,
      mimeType,
      message,
      status: "pending"
    });
  } else {
    let finalFileName = fileName;
    const caption = message.message || "";
    if (caption && caption.trim()) {
      const ext = path9.extname(fileName);
      const sanitizedCaption = sanitizeFilename(caption.trim());
      if (!sanitizedCaption.toLowerCase().endsWith(ext.toLowerCase()) && ext) {
        finalFileName = `${sanitizedCaption}${ext}`;
      } else {
        finalFileName = sanitizedCaption;
      }
    }
    const typeEmoji = getTypeEmoji(mimeType);
    const totalSize = getEstimatedFileSize(message);
    let statusMsg;
    await runStatusAction(message.chatId, async () => {
      const stats2 = downloadQueue.getStats();
      const chatIdStr = message.chatId.toString();
      const lastMsgId = lastStatusMessageIdMap.get(chatIdStr);
      if (stats2.pending >= 9) {
        const now = Date.now();
        const lastTime = lastSilentNotificationTimeMap.get(chatIdStr) || 0;
        if (now - lastTime > SILENT_NOTIFICATION_COOLDOWN || !lastMsgId) {
          await deleteLastStatusMessage(client2, message.chatId);
          const sMsg = await safeReply(message, {
            message: `\u{1F910} **\u68C0\u6D4B\u5230\u591A\u6587\u4EF6\u4E0A\u4F20\uFF0C\u5DF2\u5207\u6362\u5230\u9759\u9ED8\u6A21\u5F0F**

\u5F53\u524D\u6392\u961F\u4EFB\u52A1: ${stats2.pending} \u4E2A
Bot \u5C06\u5728\u540E\u53F0\u7EE7\u7EED\u5904\u7406\u6240\u6709\u6587\u4EF6\uFF0C\u8BF7\u8010\u5FC3\u7B49\u5F85\u3002

\u{1F4A1} \u53D1\u9001 /tasks \u67E5\u770B\u5B9E\u65F6\u4EFB\u52A1\u72B6\u6001`
          });
          if (sMsg) {
            updateLastStatusMessageId(message.chatId, sMsg.id, true);
          }
          lastSilentNotificationTimeMap.set(chatIdStr, now);
        }
      } else {
        await deleteLastStatusMessage(client2, message.chatId);
        statusMsg = await safeReply(message, {
          message: `\u23F3 \u6B63\u5728\u4E0B\u8F7D\u6587\u4EF6: ${finalFileName}
${generateProgressBar(0, 1)}

${typeEmoji} ${formatBytes2(0)} / ${formatBytes2(totalSize)}`
        });
        if (statusMsg) {
          updateLastStatusMessageId(message.chatId, statusMsg.id, false);
        }
      }
    });
    const stats = downloadQueue.getStats();
    if (statusMsg && (stats.active >= 2 || stats.pending > 0)) {
      await runStatusAction(message.chatId, async () => {
        await safeEditMessage(client2, message.chatId, {
          message: statusMsg.id,
          text: `\u23F3 \u5DF2\u52A0\u5165\u4E0B\u8F7D\u961F\u5217 (\u5F53\u524D\u6392\u961F: ${stats.pending})

\u{1F4C4} \u6587\u4EF6: ${finalFileName}
\u{1F4A1} \u8BF7\u8010\u5FC3\u7B49\u5F85\uFF0CBot \u5C06\u6309\u987A\u5E8F\u5904\u7406\u4EFB\u52A1\u3002`
        });
      });
    }
    let lastUpdateTime = 0;
    const updateInterval = 3e3;
    const onProgress = async (downloaded, total) => {
      if (!statusMsg) return;
      const now = Date.now();
      if (now - lastUpdateTime < updateInterval) return;
      lastUpdateTime = now;
      await runStatusAction(message.chatId, async () => {
        await safeEditMessage(client2, message.chatId, {
          message: statusMsg.id,
          text: `\u23F3 \u6B63\u5728\u4E0B\u8F7D\u6587\u4EF6: ${finalFileName}
${generateProgressBar(downloaded, total)}

${typeEmoji} ${formatBytes2(downloaded)} / ${formatBytes2(total)}`
        });
      });
    };
    let retryCount = 0;
    const maxRetries = 1;
    let lastLocalPath;
    let lastError;
    const attemptSingleUpload = async () => {
      let localFilePath;
      try {
        const result = await downloadAndSaveFile(client2, message, fileName, void 0, onProgress);
        if (!result) {
          lastError = "\u4E0B\u8F7D\u5931\u8D25";
          return false;
        }
        localFilePath = result.filePath;
        lastLocalPath = localFilePath;
        const { actualSize, storedName } = result;
        const fileType = getFileType(mimeType);
        if (statusMsg) {
          await runStatusAction(message.chatId, async () => {
            await safeEditMessage(client2, message.chatId, {
              message: statusMsg.id,
              text: `\u{1F4BE} \u6B63\u5728\u4FDD\u5B58\u6587\u4EF6...
${generateProgressBar(1, 1)}

${typeEmoji} ${finalFileName}`
            });
          });
        }
        let thumbnailPath = null;
        let dimensions = {};
        try {
          thumbnailPath = await generateThumbnail(localFilePath, storedName, mimeType);
          dimensions = await getImageDimensions(localFilePath, mimeType);
        } catch (thumbErr) {
        }
        const provider = storageManager.getProvider();
        let finalPath = localFilePath;
        let sourceRef = provider.name;
        if (provider.name !== "local") {
          try {
            finalPath = await provider.saveFile(localFilePath, storedName, mimeType);
            if (fs7.existsSync(localFilePath)) {
              fs7.unlinkSync(localFilePath);
            }
            lastLocalPath = void 0;
          } catch (err) {
            lastError = err.message;
            throw err;
          }
        }
        const activeAccountId = storageManager.getActiveAccountId();
        await query(`
                    INSERT INTO files (name, stored_name, type, mime_type, size, path, thumbnail_path, width, height, source, folder, storage_account_id)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                `, [finalFileName, storedName, fileType, mimeType, actualSize, finalPath, thumbnailPath, dimensions.width, dimensions.height, sourceRef, null, activeAccountId]);
        if (statusMsg) {
          await runStatusAction(message.chatId, async () => {
            await client2.editMessage(message.chatId, {
              message: statusMsg.id,
              text: `\u2705 \u6587\u4EF6\u4E0A\u4F20\u6210\u529F!
${generateProgressBar(1, 1)}

\u{1F4C4} \u6587\u4EF6\u540D: ${finalFileName}
\u{1F4E6} \u5927\u5C0F: ${formatBytes2(actualSize)}
\u{1F3F7}\uFE0F \u7C7B\u578B: ${fileType}
\u{1F4CD} \u5B58\u50A8: ${provider.name === "onedrive" ? "\u2601\uFE0F OneDrive" : provider.name === "aliyun_oss" ? "\u2601\uFE0F \u963F\u91CC\u4E91 OSS" : provider.name === "s3" ? "\u{1F4E6} S3 \u5B58\u50A8" : provider.name === "webdav" ? "\u{1F310} WebDAV" : "\u{1F4BE} \u672C\u5730"}`
            });
          });
        }
        return true;
      } catch (error) {
        lastError = error instanceof Error ? error.message : "\u672A\u77E5\u9519\u8BEF";
        if (localFilePath && fs7.existsSync(localFilePath)) {
          try {
            fs7.unlinkSync(localFilePath);
          } catch (e) {
          }
        }
        lastLocalPath = void 0;
        return false;
      }
    };
    const singleUploadTask = async () => {
      let success = await attemptSingleUpload();
      if (!success && retryCount < maxRetries) {
        retryCount++;
        if (lastLocalPath && fs7.existsSync(lastLocalPath)) {
          try {
            fs7.unlinkSync(lastLocalPath);
          } catch (e) {
          }
        }
        lastLocalPath = void 0;
        if (statusMsg) {
          await runStatusAction(message.chatId, async () => {
            await client2.editMessage(message.chatId, {
              message: statusMsg.id,
              text: `\u{1F504} \u4E0A\u4F20\u5931\u8D25\uFF0C\u6B63\u5728\u91CD\u8BD5...
${generateProgressBar(0, 1)}

${typeEmoji} ${finalFileName}`
            });
          });
        }
        success = await attemptSingleUpload();
      }
      if (!success) {
        if (statusMsg) {
          await runStatusAction(message.chatId, async () => {
            await client2.editMessage(message.chatId, {
              message: statusMsg.id,
              text: `\u274C \u4E0A\u4F20\u5931\u8D25: ${finalFileName}
\u539F\u56E0: ${lastError || "\u672A\u77E5\u9519\u8BEF"}`
            }).catch(() => {
            });
          });
        } else {
          await safeReply(message, {
            message: `\u274C \u4E0A\u4F20\u5931\u8D25: ${finalFileName}
\u539F\u56E0: ${lastError || "\u672A\u77E5\u9519\u8BEF"}`
          });
        }
      } else {
        const stats2 = downloadQueue.getStats();
        if (stats2.pending === 0 && stats2.active <= 1) {
          const chatIdStr = message.chatId.toString();
          if (lastStatusMessageIsSilent.get(chatIdStr)) {
            const lastMsgId = lastStatusMessageIdMap.get(chatIdStr);
            if (lastMsgId) {
              const provider = storageManager.getProvider();
              const providerName = provider.name === "onedrive" ? "\u2601\uFE0F OneDrive" : provider.name === "aliyun_oss" ? "\u2601\uFE0F \u963F\u91CC\u4E91 OSS" : provider.name === "s3" ? "\u{1F4E6} S3 \u5B58\u50A8" : provider.name === "webdav" ? "\u{1F310} WebDAV" : "\u{1F4BE} \u672C\u5730";
              const typeEmoji2 = getTypeEmoji(mimeType);
              await safeEditMessage(client2, message.chatId, {
                message: lastMsgId,
                text: `\u2705 **\u4E0A\u4F20\u6210\u529F!**
\u{1F3F7}\uFE0F \u7C7B\u578B: ${typeEmoji2}
\u{1F4CD} \u5B58\u50A8: ${providerName}`
              });
              lastStatusMessageIsSilent.set(chatIdStr, false);
            }
          }
        }
      }
    };
    downloadQueue.add(finalFileName, singleUploadTask).catch((err) => {
      console.error(`\u{1F916} \u5355\u6587\u4EF6\u4E0B\u8F7D\u4EFB\u52A1\u5F02\u5E38: ${finalFileName}`, err);
    });
  }
}

// src/services/telegramCommands.ts
init_storage();
var checkDiskSpace2 = checkDiskSpaceModule2.default || checkDiskSpaceModule2;
async function handleStart(message, senderId) {
  if (isAuthenticated(senderId)) {
    await message.reply({
      message: ` \u6B22\u8FCE\u56DE\u6765!

\u60A8\u5DF2\u901A\u8FC7\u9A8C\u8BC1\uFF0C\u53EF\u4EE5\u76F4\u63A5\u4F7F\u7528:

\u{1F4E4} \u53D1\u9001\u6216\u8F6C\u53D1\u4EFB\u610F\u6587\u4EF6\u4E0A\u4F20\uFF08\u652F\u6301\u6700\u59272GB\uFF09
\u{1F4CA} /storage - \u67E5\u770B\u5B58\u50A8\u7A7A\u95F4
\u{1F4CB} /list - \u67E5\u770B\u6700\u8FD1\u4E0A\u4F20
\u2753 /help - \u663E\u793A\u5E2E\u52A9`
    });
  } else {
    passwordInputState.set(senderId, { password: "" });
  }
}
async function handleHelp(message) {
  await message.reply({
    message: `\u{1F4D6} **FoomClous Bot \u5E2E\u52A9**

**\u547D\u4EE4:**
\u251C /start - \u5F00\u59CB/\u9A8C\u8BC1
\u251C /storage - \u67E5\u770B\u5B58\u50A8\u7A7A\u95F4
\u251C /list [n] - \u67E5\u770B\u6700\u8FD1\u4E0A\u4F20 (\u9ED8\u8BA410)
\u251C /tasks - \u67E5\u770B\u4EFB\u52A1\u961F\u5217\u72B6\u6001
\u251C /delete <ID> - \u5220\u9664\u6587\u4EF6
\u2514 /help - \u663E\u793A\u5E2E\u52A9

**\u4E0A\u4F20\u6587\u4EF6:**
\u76F4\u63A5\u53D1\u9001\u6216\u8F6C\u53D1\u4EFB\u610F\u6587\u4EF6\u5373\u53EF\u4E0A\u4F20
\u2728 \u652F\u6301\u6700\u5927 **2GB** \u6587\u4EF6\uFF01`
  });
}
async function handleStorage(message) {
  try {
    const activeAccountId = storageManager.getActiveAccountId();
    const diskPath = os2.platform() === "win32" ? "C:" : "/";
    const diskSpace = await checkDiskSpace2(diskPath);
    const result = await query(`
            SELECT COUNT(*) as file_count, COALESCE(SUM(size), 0) as total_size 
            FROM files 
            WHERE storage_account_id IS NOT DISTINCT FROM $1
        `, [activeAccountId]);
    const foomclousStats = result.rows[0];
    const totalSize = parseInt(foomclousStats.total_size);
    const fileCount = parseInt(foomclousStats.file_count);
    const usedPercent = Math.round((diskSpace.size - diskSpace.free) / diskSpace.size * 100);
    const queueStats = getDownloadQueueStats();
    const queueInfo = `

**\u5F53\u524D\u4E0B\u8F7D\u961F\u5217:**
\u251C \u{1F504} \u6B63\u5728\u5904\u7406: ${queueStats.active}
\u2514 \u23F3 \u7B49\u5F85\u4E2D: ${queueStats.pending}`;
    const reply = `\u{1F4CA} **\u5B58\u50A8\u7A7A\u95F4\u7EDF\u8BA1**

**\u670D\u52A1\u5668\u78C1\u76D8:**
\u251C \u{1F4E6} \u603B\u5BB9\u91CF: ${formatBytes2(diskSpace.size)}
\u251C \u{1F4BE} \u5DF2\u4F7F\u7528: ${formatBytes2(diskSpace.size - diskSpace.free)} (${usedPercent}%)
\u2514 \u{1F4C2} \u53EF\u7528: ${formatBytes2(diskSpace.free)}

**FoomClous \u5B58\u50A8:**
\u251C \u{1F4C1} \u6587\u4EF6\u6570\u91CF: ${fileCount}
\u2514 \u{1F4BE} \u5360\u7528\u7A7A\u95F4: ${formatBytes2(totalSize)}` + queueInfo;
    await message.reply({ message: reply });
  } catch (error) {
    console.error("\u{1F916} \u83B7\u53D6\u5B58\u50A8\u7EDF\u8BA1\u5931\u8D25:", error);
    await message.reply({ message: "\u274C \u83B7\u53D6\u5B58\u50A8\u7EDF\u8BA1\u5931\u8D25" });
  }
}
async function handleList(message, args) {
  try {
    let limit = 10;
    if (args.length > 0) {
      const parsed = parseInt(args[0]);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 50) {
        limit = parsed;
      }
    }
    const activeAccountId = storageManager.getActiveAccountId();
    const result = await query(`
            SELECT id, name, type, size, folder, created_at 
            FROM files 
            WHERE storage_account_id IS NOT DISTINCT FROM $2
            ORDER BY created_at DESC 
            LIMIT $1
        `, [limit, activeAccountId]);
    if (result.rows.length === 0) {
      await message.reply({ message: "\u{1F4ED} \u6682\u65E0\u4E0A\u4F20\u7684\u6587\u4EF6" });
      return;
    }
    let reply = `\u{1F4CB} **\u6700\u8FD1\u4E0A\u4F20\u7684\u6587\u4EF6** (${result.rows.length})

`;
    result.rows.forEach((file, index) => {
      const typeEmoji = getTypeEmoji(file.type === "image" ? "image/" : file.type === "video" ? "video/" : file.type === "audio" ? "audio/" : "other");
      const size = formatBytes2(parseInt(file.size));
      const date = new Date(file.created_at).toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
      let displayName = file.name;
      if (displayName.length > 25) {
        displayName = displayName.substring(0, 22) + "...";
      }
      reply += `${index + 1}. ${typeEmoji} ${displayName}
`;
      reply += `   \u2514 ${size} | ${date}
`;
      if (file.folder) {
        reply += `   \u2514 \u{1F4C1} ${file.folder}
`;
      }
      reply += `   \u2514 ID: \`${file.id.substring(0, 8)}\`

`;
    });
    reply += `
\u{1F4A1} \u5220\u9664\u6587\u4EF6: /delete <ID\u524D8\u4F4D>`;
    await message.reply({ message: reply });
  } catch (error) {
    console.error("\u{1F916} \u83B7\u53D6\u6587\u4EF6\u5217\u8868\u5931\u8D25:", error);
    await message.reply({ message: "\u274C \u83B7\u53D6\u6587\u4EF6\u5217\u8868\u5931\u8D25" });
  }
}
async function handleDelete(message, args) {
  if (args.length === 0) {
    await message.reply({ message: "\u274C \u8BF7\u63D0\u4F9B\u81F3\u5C11 4 \u4F4D\u6587\u4EF6 ID\n\n\u7528\u6CD5: /delete <ID\u524D\u7F00>\n\u793A\u4F8B: /delete a1b2c3d4" });
    return;
  }
  const fileIdPrefix = args[0].trim();
  if (fileIdPrefix.length < 4) {
    await message.reply({ message: "\u274C \u8BF7\u63D0\u4F9B\u81F3\u5C11 4 \u4F4D\u6587\u4EF6 ID" });
    return;
  }
  try {
    const activeAccountId = storageManager.getActiveAccountId();
    const result = await query(`
            SELECT id, name, path, thumbnail_path, source, storage_account_id 
            FROM files 
            WHERE id::text LIKE $1 AND storage_account_id IS NOT DISTINCT FROM $2
            LIMIT 1
        `, [fileIdPrefix + "%", activeAccountId]);
    if (result.rows.length === 0) {
      await message.reply({ message: `\u274C \u672A\u627E\u5230 ID \u4EE5 "${fileIdPrefix}" \u5F00\u5934\u7684\u6587\u4EF6` });
      return;
    }
    const file = result.rows[0];
    if (file.source === "onedrive") {
      try {
        const provider = storageManager.getProvider(`onedrive:${file.storage_account_id}`);
        await provider.deleteFile(file.path);
      } catch (err) {
        console.warn("\u{1F916} OneDrive \u6587\u4EF6\u7269\u7406\u5220\u9664\u5931\u8D25\u6216\u6587\u4EF6\u5DF2\u4E0D\u5B58\u5728:", err);
      }
    } else if (file.path && fs8.existsSync(file.path)) {
      fs8.unlinkSync(file.path);
    }
    if (file.thumbnail_path && fs8.existsSync(file.thumbnail_path)) {
      fs8.unlinkSync(file.thumbnail_path);
    }
    await query(`DELETE FROM files WHERE id = $1`, [file.id]);
    await message.reply({ message: `\u2705 \u6587\u4EF6\u5DF2\u5220\u9664

\u{1F4C4} \u6587\u4EF6\u540D: ${file.name}
\u{1F5D1}\uFE0F ID: ${file.id}` });
  } catch (error) {
    console.error("\u{1F916} \u5220\u9664\u6587\u4EF6\u5931\u8D25:", error);
    await message.reply({ message: `\u274C \u5220\u9664\u6587\u4EF6\u5931\u8D25: ${error.message}` });
  }
}
async function handleTasks(message) {
  try {
    const status = getTaskStatus();
    const activeCount = status.active.length;
    const pendingCount = status.pending.length;
    const historyCount = status.history.length;
    if (activeCount === 0 && pendingCount === 0 && historyCount === 0) {
      await message.reply({ message: "\u{1F4ED} \u5F53\u524D\u6CA1\u6709\u6B63\u5728\u8FDB\u884C\u7684\u4EFB\u52A1\uFF0C\u4E5F\u6CA1\u6709\u5386\u53F2\u8BB0\u5F55\u3002" });
      return;
    }
    let reply = `\u{1F4CB} **\u4EFB\u52A1\u961F\u5217\u72B6\u6001**
`;
    reply += `\u{1F504} \u8FDB\u884C\u4E2D: ${activeCount} | \u23F3 \u7B49\u5F85\u4E2D: ${pendingCount}

`;
    if (activeCount > 0) {
      reply += `**\u{1F504} \u6B63\u5728\u5904\u7406:**
`;
      status.active.forEach((task) => {
        reply += `\u2022 ${task.fileName}
`;
        if (task.totalSize && task.downloadedSize) {
          const progress = Math.round(task.downloadedSize / task.totalSize * 100);
          reply += `  \u2514 ${progress}% (${formatBytes2(task.downloadedSize)}/${formatBytes2(task.totalSize)})
`;
        } else {
          reply += `  \u2514 \u6B63\u5728\u4E0B\u8F7D/\u4E0A\u4F20...
`;
        }
      });
      reply += `
`;
    }
    if (pendingCount > 0) {
      reply += `**\u23F3 \u7B49\u5F85\u961F\u5217 (\u524D 5 \u4E2A):**
`;
      status.pending.slice(0, 5).forEach((task, index) => {
        reply += `${index + 1}. ${task.fileName}
`;
      });
      if (pendingCount > 5) {
        reply += `... \u4EE5\u53CA\u5176\u4ED6 ${pendingCount - 5} \u4E2A\u4EFB\u52A1
`;
      }
      reply += `
`;
    }
    if (historyCount > 0) {
      reply += `**\u{1F552} \u6700\u8FD1\u5B8C\u6210 (\u524D 5 \u4E2A):**
`;
      status.history.slice(0, 5).forEach((task) => {
        const icon = task.status === "success" ? "\u2705" : "\u274C";
        reply += `${icon} ${task.fileName}
`;
        if (task.status === "failed" && task.error) {
          reply += `  \u2514 \u9519\u8BEF: ${task.error}
`;
        }
      });
    }
    await message.reply({ message: reply });
  } catch (error) {
    console.error("\u{1F916} \u83B7\u53D6\u4EFB\u52A1\u5217\u8868\u5931\u8D25:", error);
    await message.reply({ message: "\u274C \u83B7\u53D6\u4EFB\u52A1\u5217\u8868\u5931\u8D25" });
  }
}

// src/services/orphanCleanup.ts
init_db();
import fs9 from "fs";
import path10 from "path";
var UPLOAD_DIR5 = process.env.UPLOAD_DIR || "./data/uploads";
var THUMBNAIL_DIR4 = process.env.THUMBNAIL_DIR || "./data/thumbnails";
function formatBytes3(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs9.existsSync(dirPath)) {
    return arrayOfFiles;
  }
  try {
    const files = fs9.readdirSync(dirPath);
    for (const file of files) {
      const fullPath = path10.join(dirPath, file);
      try {
        const stat = fs9.statSync(fullPath);
        if (stat.isDirectory()) {
          getAllFiles(fullPath, arrayOfFiles);
        } else {
          arrayOfFiles.push({
            name: file,
            path: fullPath,
            size: stat.size
          });
        }
      } catch (e) {
        console.warn(`\u{1F9F9} \u65E0\u6CD5\u8BFB\u53D6\u6587\u4EF6\u72B6\u6001: ${fullPath}`, e);
      }
    }
  } catch (e) {
    console.error(`\u{1F9F9} \u65E0\u6CD5\u8BFB\u53D6\u76EE\u5F55: ${dirPath}`, e);
  }
  return arrayOfFiles;
}
function removeEmptyDirectories(dirPath) {
  if (!fs9.existsSync(dirPath)) return;
  try {
    const files = fs9.readdirSync(dirPath);
    for (const file of files) {
      const fullPath = path10.join(dirPath, file);
      try {
        if (fs9.statSync(fullPath).isDirectory()) {
          removeEmptyDirectories(fullPath);
        }
      } catch (e) {
      }
    }
    const remainingFiles = fs9.readdirSync(dirPath);
    if (remainingFiles.length === 0 && dirPath !== UPLOAD_DIR5) {
      fs9.rmdirSync(dirPath);
      console.log(`\u{1F9F9} \u5220\u9664\u7A7A\u6587\u4EF6\u5939: ${dirPath}`);
    }
  } catch (e) {
    console.warn(`\u{1F9F9} \u5220\u9664\u7A7A\u6587\u4EF6\u5939\u5931\u8D25: ${dirPath}`, e);
  }
}
async function cleanupOrphanFiles() {
  const stats = {
    deletedCount: 0,
    freedBytes: 0,
    freedSpace: "0 B",
    deletedFiles: []
  };
  console.log("\u{1F9F9} \u5F00\u59CB\u626B\u63CF\u5B64\u513F\u6587\u4EF6...");
  try {
    const dbResult = await query("SELECT stored_name FROM files");
    const dbFileSet = new Set(dbResult.rows.map((row) => row.stored_name));
    console.log(`\u{1F9F9} \u6570\u636E\u5E93\u4E2D\u5DF2\u6CE8\u518C\u6587\u4EF6\u6570: ${dbFileSet.size}`);
    const diskFiles = getAllFiles(UPLOAD_DIR5);
    console.log(`\u{1F9F9} \u78C1\u76D8\u4E0A\u6587\u4EF6\u6570: ${diskFiles.length}`);
    for (const file of diskFiles) {
      if (!dbFileSet.has(file.name)) {
        try {
          fs9.unlinkSync(file.path);
          stats.deletedCount++;
          stats.freedBytes += file.size;
          stats.deletedFiles.push(file.name);
          console.log(`\u{1F9F9} \u5220\u9664\u5B64\u513F\u6587\u4EF6: ${file.path} (${formatBytes3(file.size)})`);
        } catch (e) {
          console.error(`\u{1F9F9} \u5220\u9664\u6587\u4EF6\u5931\u8D25: ${file.path}`, e);
        }
      }
    }
    removeEmptyDirectories(UPLOAD_DIR5);
    stats.freedSpace = formatBytes3(stats.freedBytes);
    if (stats.deletedCount > 0) {
      console.log(`\u{1F9F9} \u6E05\u7406\u5B8C\u6210: \u5220\u9664 ${stats.deletedCount} \u4E2A\u5B64\u513F\u6587\u4EF6\uFF0C\u91CA\u653E ${stats.freedSpace}`);
    } else {
      console.log("\u{1F9F9} \u626B\u63CF\u5B8C\u6210: \u6CA1\u6709\u53D1\u73B0\u5B64\u513F\u6587\u4EF6");
    }
  } catch (error) {
    console.error("\u{1F9F9} \u5B64\u513F\u6587\u4EF6\u6E05\u7406\u5931\u8D25:", error);
    throw error;
  }
  return stats;
}
var cleanupInterval = null;
function startPeriodicCleanup(intervalMs = 60 * 60 * 1e3) {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
  cleanupInterval = setInterval(async () => {
    console.log("\u{1F9F9} \u6267\u884C\u5B9A\u671F\u5B64\u513F\u6587\u4EF6\u6E05\u7406...");
    try {
      const stats = await cleanupOrphanFiles();
      if (stats.deletedCount > 0) {
        console.log(`\u{1F9F9} \u5B9A\u671F\u6E05\u7406\u5B8C\u6210: \u5220\u9664 ${stats.deletedCount} \u4E2A\u6587\u4EF6\uFF0C\u91CA\u653E ${stats.freedSpace}`);
      }
    } catch (e) {
      console.error("\u{1F9F9} \u5B9A\u671F\u6E05\u7406\u5931\u8D25:", e);
    }
  }, intervalMs);
  console.log(`\u{1F9F9} \u5DF2\u542F\u52A8\u5B9A\u671F\u6E05\u7406\u4EFB\u52A1 (\u95F4\u9694: ${intervalMs / 1e3 / 60} \u5206\u949F)`);
}

// src/services/telegramBot.ts
init_db();
var SESSION_FILE = process.env.TELEGRAM_SESSION_FILE || "./data/telegram_session.txt";
var client = null;
function generatePasswordKeyboard(currentLength) {
  const display = "\u25CF".repeat(currentLength) + "-".repeat(Math.max(0, 4 - currentLength));
  const displayWithSpaces = display.split("").join(" ");
  return new Api2.ReplyInlineMarkup({
    rows: [
      new Api2.KeyboardButtonRow({
        buttons: [
          new Api2.KeyboardButtonCallback({ text: `\u{1F512}  ${displayWithSpaces}`, data: Buffer.from("pwd_display") })
        ]
      }),
      new Api2.KeyboardButtonRow({
        buttons: [
          new Api2.KeyboardButtonCallback({ text: "1", data: Buffer.from("pwd_1") }),
          new Api2.KeyboardButtonCallback({ text: "2", data: Buffer.from("pwd_2") }),
          new Api2.KeyboardButtonCallback({ text: "3", data: Buffer.from("pwd_3") })
        ]
      }),
      new Api2.KeyboardButtonRow({
        buttons: [
          new Api2.KeyboardButtonCallback({ text: "4", data: Buffer.from("pwd_4") }),
          new Api2.KeyboardButtonCallback({ text: "5", data: Buffer.from("pwd_5") }),
          new Api2.KeyboardButtonCallback({ text: "6", data: Buffer.from("pwd_6") })
        ]
      }),
      new Api2.KeyboardButtonRow({
        buttons: [
          new Api2.KeyboardButtonCallback({ text: "7", data: Buffer.from("pwd_7") }),
          new Api2.KeyboardButtonCallback({ text: "8", data: Buffer.from("pwd_8") }),
          new Api2.KeyboardButtonCallback({ text: "9", data: Buffer.from("pwd_9") })
        ]
      }),
      new Api2.KeyboardButtonRow({
        buttons: [
          new Api2.KeyboardButtonCallback({ text: "\u53D6\u6D88", data: Buffer.from("pwd_clear") }),
          new Api2.KeyboardButtonCallback({ text: "0", data: Buffer.from("pwd_0") }),
          new Api2.KeyboardButtonCallback({ text: "\u232B", data: Buffer.from("pwd_backspace") })
        ]
      })
    ]
  });
}
async function handlePasswordCallback(update) {
  if (!client) return;
  const userId = update.userId.toJSNumber();
  const data = Buffer.from(update.data || []).toString("utf-8");
  if (!data.startsWith("pwd_")) return;
  let state = passwordInputState.get(userId);
  if (!state) {
    state = { password: "" };
    passwordInputState.set(userId, state);
  }
  try {
    if (data === "pwd_display") {
      await client.invoke(new Api2.messages.SetBotCallbackAnswer({ queryId: update.queryId }));
      return;
    }
    if (data === "pwd_backspace") {
      state.password = state.password.slice(0, -1);
    } else if (data === "pwd_clear") {
      state.password = "";
      passwordInputState.delete(userId);
      await client.editMessage(update.peer, {
        message: update.msgId,
        text: "\u5DF2\u53D6\u6D88\u5BC6\u7801\u8F93\u5165\u3002\n\n\u53D1\u9001 /start \u91CD\u65B0\u5F00\u59CB"
      });
      await client.invoke(new Api2.messages.SetBotCallbackAnswer({ queryId: update.queryId }));
      return;
    } else {
      const digit = data.replace("pwd_", "");
      if (/^[0-9]$/.test(digit)) {
        state.password += digit;
        if (state.password.length >= 4) {
          if (verifyPassword2(state.password)) {
            await persistAuthenticatedUser(userId);
            passwordInputState.delete(userId);
            await client.editMessage(update.peer, {
              message: update.msgId,
              text: `\u2705 \u5BC6\u7801\u9A8C\u8BC1\u6210\u529F!

\u73B0\u5728\u60A8\u53EF\u4EE5:
\u{1F4E4} \u53D1\u9001\u6216\u8F6C\u53D1\u4EFB\u610F\u6587\u4EF6\u4E0A\u4F20\uFF08\u652F\u6301\u6700\u59272GB\uFF09
\u{1F4CA} /storage \u67E5\u770B\u5B58\u50A8\u7A7A\u95F4`
            });
            await client.invoke(new Api2.messages.SetBotCallbackAnswer({ queryId: update.queryId, message: "\u2705 \u9A8C\u8BC1\u6210\u529F!" }));
            return;
          }
        }
        if (state.password.length >= 12) {
          state.password = "";
          await client.editMessage(update.peer, {
            message: update.msgId,
            text: "\u274C \u5BC6\u7801\u9519\u8BEF\uFF0C\u8BF7\u91CD\u65B0\u8F93\u5165\uFF1A",
            buttons: generatePasswordKeyboard(0)
          });
          await client.invoke(new Api2.messages.SetBotCallbackAnswer({ queryId: update.queryId, message: "\u274C \u5BC6\u7801\u9519\u8BEF" }));
          return;
        }
      }
    }
    await client.editMessage(update.peer, {
      message: update.msgId,
      text: "\u{1F510} \u8BF7\u4F7F\u7528\u4E0B\u65B9\u952E\u76D8\u8F93\u5165\u5BC6\u7801\uFF1A",
      buttons: generatePasswordKeyboard(state.password.length)
    });
    await client.invoke(new Api2.messages.SetBotCallbackAnswer({ queryId: update.queryId }));
  } catch (error) {
    console.error("\u{1F916} \u5904\u7406\u5BC6\u7801\u56DE\u8C03\u5931\u8D25:", error);
    try {
      await client.invoke(new Api2.messages.SetBotCallbackAnswer({ queryId: update.queryId }));
    } catch (e) {
    }
  }
}
async function handleCleanupButtonCallback(update, cleanupId) {
  if (!client) return;
  try {
    const result = await handleCleanupCallback(cleanupId);
    try {
      await client.editMessage(update.peer, {
        message: update.msgId,
        text: result.message
      });
    } catch (e) {
      console.error("\u{1F916} \u66F4\u65B0\u6E05\u7406\u7ED3\u679C\u6D88\u606F\u5931\u8D25:", e);
    }
    await client.invoke(new Api2.messages.SetBotCallbackAnswer({
      queryId: update.queryId,
      message: result.success ? "\u2705 \u6E05\u7406\u6210\u529F" : "\u274C \u6E05\u7406\u5931\u8D25"
    }));
  } catch (error) {
    console.error("\u{1F916} \u5904\u7406\u6E05\u7406\u56DE\u8C03\u5931\u8D25:", error);
    try {
      await client.invoke(new Api2.messages.SetBotCallbackAnswer({
        queryId: update.queryId,
        message: "\u274C \u6E05\u7406\u5931\u8D25"
      }));
    } catch (e) {
    }
  }
}
async function initTelegramBot() {
  const apiId = parseInt(process.env.TELEGRAM_API_ID || "0");
  const apiHash = process.env.TELEGRAM_API_HASH || "";
  const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
  if (!apiId || !apiHash || !botToken) {
    console.log("\u26A0\uFE0F \u672A\u914D\u7F6E Telegram API \u51ED\u8BC1\uFF0CBot \u672A\u542F\u52A8");
    console.log("   \u9700\u8981\u8BBE\u7F6E: TELEGRAM_API_ID, TELEGRAM_API_HASH, TELEGRAM_BOT_TOKEN");
    return;
  }
  try {
    console.log("\u{1F916} Telegram Bot \u6B63\u5728\u540C\u6B65\u5B58\u50A8\u914D\u7F6E...");
    await storageManager.init();
    const provider = storageManager.getProvider();
    console.log(`\u{1F916} Telegram Bot \u5F53\u524D\u5B58\u50A8\u63D0\u4F9B\u5546: ${provider.name}`);
  } catch (e) {
    console.error("\u{1F916} Telegram Bot \u540C\u6B65\u5B58\u50A8\u914D\u7F6E\u5931\u8D25:", e);
  }
  try {
    const sessionDir = path11.dirname(SESSION_FILE);
    if (!fs10.existsSync(sessionDir)) {
      fs10.mkdirSync(sessionDir, { recursive: true });
    }
    let sessionString = "";
    if (fs10.existsSync(SESSION_FILE)) {
      sessionString = fs10.readFileSync(SESSION_FILE, "utf-8").trim();
    }
    const session = new StringSession(sessionString);
    client = new TelegramClient2(session, apiId, apiHash, {
      connectionRetries: 15,
      retryDelay: 2e3,
      useWSS: false,
      deviceModel: "FoomClous Bot",
      systemVersion: "1.0.0",
      appVersion: "1.0.0",
      floodSleepThreshold: 120
    });
    console.log("\u{1F916} Telegram Bot \u6B63\u5728\u542F\u52A8...");
    await client.start({
      botAuthToken: botToken
    });
    const newSession = client.session.save();
    fs10.writeFileSync(SESSION_FILE, newSession);
    console.log("\u{1F916} Telegram Bot \u5DF2\u8FDE\u63A5!");
    try {
      await query(`
                CREATE TABLE IF NOT EXISTS telegram_auth (
                    user_id BIGINT PRIMARY KEY,
                    authenticated_at TIMESTAMPTZ DEFAULT NOW()
                )
            `);
      await loadAuthenticatedUsers();
    } catch (e) {
      console.error("\u{1F916} \u521D\u59CB\u5316 Telegram \u8BA4\u8BC1\u8868\u5931\u8D25:", e);
    }
    try {
      await client.invoke(new Api2.bots.SetBotCommands({
        scope: new Api2.BotCommandScopeDefault(),
        langCode: "zh",
        commands: [
          new Api2.BotCommand({ command: "start", description: "\u5F00\u59CB\u4F7F\u7528 / \u9A8C\u8BC1\u8EAB\u4EFD" }),
          new Api2.BotCommand({ command: "storage", description: "\u67E5\u770B\u5B58\u50A8\u7A7A\u95F4\u7EDF\u8BA1" }),
          new Api2.BotCommand({ command: "list", description: "\u67E5\u770B\u6700\u8FD1\u4E0A\u4F20\u7684\u6587\u4EF6" }),
          new Api2.BotCommand({ command: "tasks", description: "\u67E5\u770B\u4EFB\u52A1\u961F\u5217\u72B6\u6001" }),
          new Api2.BotCommand({ command: "help", description: "\u83B7\u53D6\u5E2E\u52A9\u4FE1\u606F" })
        ]
      }));
      console.log("\u{1F916} Bot \u547D\u4EE4\u83DC\u5355\u5DF2\u66F4\u65B0");
    } catch (e) {
      console.error("\u{1F916} \u66F4\u65B0 Bot \u547D\u4EE4\u83DC\u5355\u5931\u8D25:", e);
    }
    try {
      const stats = await cleanupOrphanFiles();
      if (stats.deletedCount > 0) {
        console.log(`\u{1F9F9} \u542F\u52A8\u6E05\u7406: \u5220\u9664\u4E86 ${stats.deletedCount} \u4E2A\u5B64\u513F\u6587\u4EF6\uFF0C\u91CA\u653E ${stats.freedSpace}`);
        for (const userId of authenticatedUsers.keys()) {
          try {
            await client.sendMessage(userId, {
              message: `\u{1F9F9} **\u7CFB\u7EDF\u542F\u52A8\u6E05\u7406\u5B8C\u6210**

\u{1F4CA} \u6E05\u7406\u7EDF\u8BA1:
\u2022 \u5220\u9664\u5B64\u513F\u6587\u4EF6: ${stats.deletedCount} \u4E2A
\u2022 \u91CA\u653E\u7A7A\u95F4: ${stats.freedSpace}

\u{1F4A1} \u8FD9\u4E9B\u662F\u4E4B\u524D\u4E0A\u4F20\u5931\u8D25\u6B8B\u7559\u7684\u5783\u573E\u6587\u4EF6`
            });
          } catch (e) {
          }
        }
      }
    } catch (e) {
      console.error("\u{1F9F9} \u542F\u52A8\u6E05\u7406\u5931\u8D25:", e);
    }
    startPeriodicCleanup();
    client.addEventHandler(async (event) => {
      if (!client) return;
      try {
        const message = event.message;
        if (message.out) return;
        if (!message.text && !message.media) return;
        const senderId = message.senderId?.toJSNumber();
        if (!senderId) return;
        const text = message.text || "";
        if (text === "/start") {
          await handleStart(message, senderId);
          if (!isAuthenticated(senderId)) {
            await message.reply({
              message: `\u{1F44B} \u6B22\u8FCE\u4F7F\u7528 FoomClous Bot!

\u{1F510} \u8BF7\u4F7F\u7528\u4E0B\u65B9\u952E\u76D8\u8F93\u5165\u5BC6\u7801\uFF1A`,
              buttons: generatePasswordKeyboard(0)
            });
          }
          return;
        }
        if (text === "/help") {
          await handleHelp(message);
          return;
        }
        if (text === "/storage") {
          if (!isAuthenticated(senderId)) {
            await message.reply({ message: "\u{1F510} \u8BF7\u5148\u53D1\u9001 /start \u9A8C\u8BC1\u5BC6\u7801" });
            return;
          }
          await handleStorage(message);
          return;
        }
        if (text === "/list" || text.startsWith("/list ")) {
          if (!isAuthenticated(senderId)) {
            await message.reply({ message: "\u{1F510} \u8BF7\u5148\u53D1\u9001 /start \u9A8C\u8BC1\u5BC6\u7801" });
            return;
          }
          const args = text.split(" ").slice(1);
          await handleList(message, args);
          return;
        }
        if (text.startsWith("/delete ")) {
          if (!isAuthenticated(senderId)) {
            await message.reply({ message: "\u{1F510} \u8BF7\u5148\u53D1\u9001 /start \u9A8C\u8BC1\u5BC6\u7801" });
            return;
          }
          const args = text.split(" ").slice(1);
          await handleDelete(message, args);
          return;
        }
        if (text === "/tasks" || text === "/task") {
          if (!isAuthenticated(senderId)) {
            await message.reply({ message: "\u{1F510} \u8BF7\u5148\u53D1\u9001 /start \u9A8C\u8BC1\u5BC6\u7801" });
            return;
          }
          await handleTasks(message);
          return;
        }
        if (message.media) {
          await handleFileUpload(client, event);
          return;
        }
        if (!isAuthenticated(senderId) && text && !text.startsWith("/")) {
          await message.reply({ message: "\u2753 \u8BF7\u53D1\u9001 /start \u4F7F\u7528\u952E\u76D8\u8F93\u5165\u5BC6\u7801" });
        }
      } catch (error) {
        console.error("\u{1F916} \u5904\u7406\u6D88\u606F\u65F6\u53D1\u751F\u610F\u5916\u9519\u8BEF:", error);
      }
    }, new NewMessage({ incoming: true }));
    client.addEventHandler(async (update) => {
      if (update.className === "UpdateBotCallbackQuery") {
        const callbackUpdate = update;
        const data = Buffer.from(callbackUpdate.data || []).toString("utf-8");
        if (data.startsWith("pwd_")) {
          await handlePasswordCallback(callbackUpdate);
          return;
        }
        if (data.startsWith("cleanup_")) {
          await handleCleanupButtonCallback(callbackUpdate, data);
          return;
        }
      }
    }, new Raw({}));
    console.log("\u{1F916} Telegram Bot \u542F\u52A8\u6210\u529F! (\u652F\u6301\u6700\u5927 2GB \u6587\u4EF6)");
  } catch (error) {
    console.error("\u{1F916} Telegram Bot \u542F\u52A8\u5931\u8D25:", error);
  }
}

// src/index.ts
dotenv3.config();
var app = express();
app.set("trust proxy", true);
var PORT = process.env.PORT || 51947;
var UPLOAD_DIR6 = process.env.UPLOAD_DIR || "./data/uploads";
var THUMBNAIL_DIR5 = process.env.THUMBNAIL_DIR || "./data/thumbnails";
var CHUNK_DIR2 = process.env.CHUNK_DIR || "./data/chunks";
if (!fs11.existsSync(UPLOAD_DIR6)) {
  fs11.mkdirSync(UPLOAD_DIR6, { recursive: true });
  console.log(`\u{1F4C1} \u521B\u5EFA\u4E0A\u4F20\u76EE\u5F55: ${UPLOAD_DIR6}`);
}
if (!fs11.existsSync(THUMBNAIL_DIR5)) {
  fs11.mkdirSync(THUMBNAIL_DIR5, { recursive: true });
  console.log(`\u{1F4C1} \u521B\u5EFA\u7F29\u7565\u56FE\u76EE\u5F55: ${THUMBNAIL_DIR5}`);
}
if (!fs11.existsSync(CHUNK_DIR2)) {
  fs11.mkdirSync(CHUNK_DIR2, { recursive: true });
  console.log(`\u{1F4C1} \u521B\u5EFA\u5206\u5757\u76EE\u5F55: ${CHUNK_DIR2}`);
}
app.use(cors({
  origin: true,
  // 允许所有来源
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "X-API-Key", "X-Upload-Id", "X-Chunk-Index", "Authorization"]
}));
app.use(express.json());
app.use("/api/auth", auth_default);
app.use("/uploads", requireAuth, express.static(UPLOAD_DIR6, {
  maxAge: "1d",
  etag: true
}));
app.use("/thumbnails", requireAuth, express.static(THUMBNAIL_DIR5, {
  maxAge: "7d",
  etag: true
}));
app.use("/api/files", requireAuthOrSignedUrl, files_default);
app.use("/api/upload", requireAuth, upload_default);
app.use("/api/v1/upload", upload_default);
app.use("/api/chunked", requireAuth, chunkedUpload_default);
app.use("/api/storage", storage_default);
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.use((err, _req, res, _next) => {
  console.error("\u274C \u9519\u8BEF:", err);
  res.status(500).json({ error: err.message || "\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF" });
});
app.listen(PORT, async () => {
  const passwordProtected = !!process.env.ACCESS_PASSWORD_HASH;
  const telegramEnabled = !!process.env.TELEGRAM_BOT_TOKEN && !!process.env.TELEGRAM_API_ID && !!process.env.TELEGRAM_API_HASH;
  try {
    const { storageManager: storageManager2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
    await storageManager2.init();
  } catch (e) {
    console.error("\u5B58\u50A8\u7BA1\u7406\u5668\u521D\u59CB\u5316\u5931\u8D25:", e);
  }
  if (telegramEnabled) {
    await initTelegramBot();
  }
  console.log(`
\u{1F680} FoomClous \u540E\u7AEF\u670D\u52A1\u5DF2\u542F\u52A8
\u{1F4CD} \u7AEF\u53E3: ${PORT}
\u{1F4C1} \u4E0A\u4F20\u76EE\u5F55: ${path12.resolve(UPLOAD_DIR6)}
\u{1F5BC}\uFE0F  \u7F29\u7565\u56FE\u76EE\u5F55: ${path12.resolve(THUMBNAIL_DIR5)}
\u{1F510} \u5BC6\u7801\u4FDD\u62A4: ${passwordProtected ? "\u5DF2\u542F\u7528" : "\u672A\u542F\u7528"}
\u{1F916} Telegram Bot: ${telegramEnabled ? "\u5DF2\u542F\u7528 (\u652F\u63012GB\u6587\u4EF6)" : "\u672A\u542F\u7528"}
    `);
});
var index_default = app;
export {
  index_default as default
};
