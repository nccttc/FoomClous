# FoomClous 存储源配置指南

FoomClous 支持多种存储后端，您可以根据需求选择本地存储或云存储（OneDrive、阿里云 OSS）。

## 1. 本地存储 (Local Storage)

本地存储是默认的存储方式，文件直接保存在服务器硬盘上。

### 配置方法
- **环境变量**:
  - `UPLOAD_DIR`: 文件上传的基础目录（默认：`./data/uploads`）。
  - `THUMBNAIL_DIR`: 缩略图生成的目录（默认：`./data/thumbnails`）。
- **特点**: 无需额外配置，速度快，受限于服务器磁盘容量。

---

## 2. Microsoft OneDrive

支持通过多账户管理功能连接一个或多个 OneDrive 账户。

### 获取凭据 (Azure Portal)
1. 访问 [Azure Portal - App Registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)。
2. 注册新应用：
   - **重定向 URI**: 设置为 Web 类型，地址通常为 `https://您的域名/api/storage/onedrive/callback`。
3. 获取 **Client ID** 和 **Tenant ID**。
4. 在“证书和密码”中创建新的 **Client Secret**。
5. 在“API 权限”中添加 `Files.ReadWrite.All` 和 `offline_access`。

### 在 FoomClous 中配置
1. 前往 **设置 -> 存储设置 -> OneDrive 账户**。
2. 输入 **账户名称**、**Client ID**、**Client Secret**、**Tenant ID**（默认为 `common`）。
3. 点击“添加并授权”，跳转至微软页面进行 OAuth 授权。

---

## 3. 阿里云 OSS (Aliyun Object Storage)

支持将阿里云 OSS 作为高性能、高可靠的云存储后端。

### 获取凭据 (阿里云控制台)
1. 登录 [阿里云控制台](https://oss.console.aliyun.com/)。
2. 创建或进入现有的 **Bucket**。
3. 获取 **Endpoint** / **Region** (如 `oss-cn-hangzhou`)。
4. 在 AccessKey 管理中获取 **AccessKey ID** 和 **AccessKey Secret**。

### 在 FoomClous 中配置
1. 前往 **设置 -> 存储设置 -> 阿里云 OSS**。
2. 输入以下信息：
   - **名称**: 账户别名。
   - **Region**: 所在的地域 ID (如 `oss-cn-shanghai` 或 `cn-shanghai`)。程序会自动提取地域部分。
   - **AccessKey ID**: 阿里云身份凭证。
   - **AccessKey Secret**: 阿里云身份密钥。
   - **Bucket**: 存储桶名称。
3. 点击“添加账户”。

---

## 切换存储源

1. 在 **设置 -> 存储设置** 中，您可以看到所有已配置的账户。
2. 点击账户旁边的 **“激活”** 按钮即可切换。
3. 切换后，后续的新上传文件将保存至新激活的存储源中。旧文件仍保留在原存储源，且可以正常访问。
