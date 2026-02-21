# Docker Hub 閮ㄧ讲鎸囧崡 馃惓

---
[杩斿洖鏂囨。涓績](./README.md)

## 姒傝堪

鏈」鐩彁渚涗袱涓?Docker 闀滃儚锛屽彲閫氳繃 Docker Hub 鑾峰彇锛?- `foomclous-frontend`: 鍓嶇搴旂敤锛圢ginx + React锛?- `foomclous-backend`: 鍚庣鏈嶅姟锛圢ode.js + Express锛?
## 蹇€熷紑濮?
### 浣跨敤 Docker Compose 閮ㄧ讲

1. 鍒涘缓 `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  # 鍓嶇
  frontend:
    image: <浣犵殑鐢ㄦ埛鍚?/foomclous-frontend:latest
    container_name: foomclous-frontend
    ports:
      - "47832:80"
    environment:
      - VITE_API_URL=https://your-domain.com
    networks:
      - foomclous-network
    restart: unless-stopped

  # 鍚庣
  backend:
    image: <浣犵殑鐢ㄦ埛鍚?/foomclous-backend:latest
    container_name: foomclous-backend
    ports:
      - "51947:51947"
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      - DATABASE_URL=postgresql://foomclous:${DB_PASSWORD:-foomclous123}@postgres:5432/foomclous
      - PORT=51947
      - UPLOAD_DIR=/data/uploads
      - THUMBNAIL_DIR=/data/thumbnails
      - CHUNK_DIR=/data/chunks
      - CORS_ORIGIN=https://your-domain.com
      - ACCESS_PASSWORD_HASH=${ACCESS_PASSWORD_HASH:-}
      - DOMAIN=your-domain.com
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN:-}
      - TELEGRAM_API_ID=${TELEGRAM_API_ID:-}
      - TELEGRAM_API_HASH=${TELEGRAM_API_HASH:-}
    volumes:
      - file-storage:/data
    networks:
      - foomclous-network
    restart: unless-stopped

  # 鏁版嵁搴?  postgres:
    image: postgres:16-alpine
    container_name: foomclous-postgres
    environment:
      - POSTGRES_DB=foomclous
      - POSTGRES_USER=foomclous
      - POSTGRES_PASSWORD=${DB_PASSWORD:-foomclous123}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    networks:
      - foomclous-network
    restart: unless-stopped
    healthcheck:
      test: [ "CMD-SHELL", "pg_isready -U foomclous -d foomclous" ]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  file-storage:
    driver: local
  postgres-data:
    driver: local

networks:
  foomclous-network:
    driver: bridge
```

2. 鍒涘缓鏁版嵁搴撳垵濮嬪寲鏂囦欢 `init.sql`:

```sql
-- 鏂囦欢琛?CREATE TABLE IF NOT EXISTS files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    path VARCHAR(500) NOT NULL,
    thumbnail_path VARCHAR(500),
    folder_id UUID REFERENCES files(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    access_count INTEGER DEFAULT 0,
    storage_provider VARCHAR(50) DEFAULT 'local',
    is_deleted BOOLEAN DEFAULT FALSE
);

-- API Key 琛?CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- 绯荤粺璁剧疆琛?CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 鍒涘缓绱㈠紩
CREATE INDEX IF NOT EXISTS idx_files_folder_id ON files(folder_id);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);
CREATE INDEX IF NOT EXISTS idx_files_original_name ON files(original_name);
```

3. 鍒涘缓 `.env` 鏂囦欢:

```env
DB_PASSWORD=your_secure_password
ACCESS_PASSWORD_HASH=your_hashed_password
DOMAIN=your-domain.com
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
```

4. 鍚姩鏈嶅姟:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 鎵嬪姩浣跨敤 Docker 闀滃儚

#### 鎷夊彇闀滃儚

```bash
docker pull <浣犵殑鐢ㄦ埛鍚?/foomclous-frontend:latest
docker pull <浣犵殑鐢ㄦ埛鍚?/foomclous-backend:latest
```

#### 杩愯鍓嶇

```bash
docker run -d \
  --name foomclous-frontend \
  -p 47832:80 \
  -e VITE_API_URL=https://your-domain.com \
  <浣犵殑鐢ㄦ埛鍚?/foomclous-frontend:latest
```

#### 杩愯鍚庣

```bash
docker run -d \
  --name foomclous-backend \
  -p 51947:51947 \
  -e DATABASE_URL=postgresql://foomclous:password@postgres:5432/foomclous \
  -e PORT=51947 \
  -e UPLOAD_DIR=/data/uploads \
  -e THUMBNAIL_DIR=/data/thumbnails \
  -e CHUNK_DIR=/data/chunks \
  -e CORS_ORIGIN=https://your-domain.com \
  -v foomclous-data:/data \
  --network foomclous-network \
  <浣犵殑鐢ㄦ埛鍚?/foomclous-backend:latest
```

## GitHub Actions 鑷姩鏋勫缓

### 閰嶇疆 Secrets

鍦?GitHub 浠撳簱鐨?Settings > Secrets and variables > Actions 涓坊鍔犱互涓?Secrets:

| Secret 鍚嶇О | 璇存槑 | 绀轰緥 |
|-------------|------|------|
| `DOCKER_USERNAME` | Docker Hub 鐢ㄦ埛鍚?| `johndoe` |
| `DOCKER_PASSWORD` | Docker Hub 瀵嗙爜鎴?Access Token | `dckr_pat_...` |
| `IMAGE_NAME` | Docker Hub 闀滃儚鍚嶇О | `johndoe/foomclous` |

### 瑙﹀彂鏋勫缓

宸ヤ綔娴佷細鍦ㄤ互涓嬫儏鍐典笅鑷姩瑙﹀彂锛?- 鎺ㄩ€佸埌 `main` 鎴?`master` 鍒嗘敮
- 鎺ㄩ€佹爣绛撅紙濡?`v1.0.0`锛?- 鎵嬪姩瑙﹀彂锛堝湪 Actions 椤甸潰鐐瑰嚮 "Run workflow"锛?
### 鐗堟湰鏍囩

鎺ㄩ€佹椂鑷姩鐢熸垚鐨勬爣绛剧ず渚嬶細
- `latest` - 鏈€鏂扮増鏈?- `v1.2.3` - 瀹屾暣鐗堟湰鍙?- `v1.2` - 涓荤増鏈?娆＄増鏈?- `v1` - 涓荤増鏈?- `sha-abc123` - Git commit SHA

### Docker Hub Access Token

鎺ㄨ崘浣跨敤 Access Token 鑰屼笉鏄瘑鐮侊細
1. 鐧诲綍 [Docker Hub](https://hub.docker.com/)
2. 杩涘叆 Account Settings > Security
3. 鐐瑰嚮 "New Access Token"
4. 杈撳叆鎻忚堪鍜屾潈闄愶紙Read, Write, Delete锛?5. 澶嶅埗鐢熸垚鐨?token

## 鏈湴鏋勫缓鍜屾帹閫?
### 鏋勫缓闀滃儚

```bash
# 鏋勫缓 Backend
docker build -t your-username/foomclous-backend:latest ./backend

# 鏋勫缓 Frontend
docker build -t your-username/foomclous-frontend:latest ./frontend
```

### 鎺ㄩ€佸埌 Docker Hub

```bash
# 鐧诲綍
docker login

# 鎺ㄩ€?docker push your-username/foomclous-backend:latest
docker push your-username/foomclous-frontend:latest
```

## 闀滃儚淇℃伅

| 闀滃儚 | 鍩虹闀滃儚 | 澶у皬 | 璇存槑 |
|------|---------|------|------|
| `foomclous-frontend` | `nginx:alpine` | ~30MB | 闈欐€佹枃浠舵湇鍔?|
| `foomclous-backend` | `node:20-alpine` | ~150MB | API 鏈嶅姟 |

### 鐜鍙橀噺

#### Backend

| 鍙橀噺 | 蹇呴渶 | 榛樿鍊?| 璇存槑 |
|------|------|--------|------|
| `DATABASE_URL` | 鏄?| - | PostgreSQL 杩炴帴瀛楃涓?|
| `PORT` | 鍚?| `51947` | 鏈嶅姟绔彛 |
| `UPLOAD_DIR` | 鍚?| `/data/uploads` | 涓婁紶鏂囦欢鐩綍 |
| `THUMBNAIL_DIR` | 鍚?| `/data/thumbnails` | 缂╃暐鍥剧洰褰?|
| `CHUNK_DIR` | 鍚?| `/data/chunks` | 鍒嗗潡涓婁紶涓存椂鐩綍 |
| `CORS_ORIGIN` | 鏄?| - | CORS 鍏佽鐨勬簮 |
| `ACCESS_PASSWORD_HASH` | 鍚?| - | 璁块棶瀵嗙爜鍝堝笇 |
| `DOMAIN` | 鍚?| - | 鍩熷悕 |
| `TELEGRAM_BOT_TOKEN` | 鍚?| - | Telegram Bot Token |
| `TELEGRAM_API_ID` | 鍚?| - | Telegram API ID |
| `TELEGRAM_API_HASH` | 鍚?| - | Telegram API Hash |

#### Frontend

| 鍙橀噺 | 蹇呴渶 | 榛樿鍊?| 璇存槑 |
|------|------|--------|------|
| `VITE_API_URL` | 鏄?| - | 鍚庣 API 鍦板潃 |

## 绔彛鏄犲皠

| 鏈嶅姟 | 瀹瑰櫒绔彛 | 瀹夸富鏈虹鍙?| 璇存槑 |
|------|---------|-----------|------|
| Frontend | 80 | 47832 | HTTP |
| Backend | 51947 | 51947 | API |

## 鏁版嵁鎸佷箙鍖?
浣跨敤 Docker Volume 鎸佷箙鍖栨暟鎹細

```bash
# 鏌ョ湅鍗?docker volume ls

# 澶囦唤鍗?docker run --rm -v foomclous-data:/data -v $(pwd):/backup alpine tar czf /backup/foomclous-data-backup.tar.gz /data

# 鎭㈠鍗?docker run --rm -v foomclous-data:/data -v $(pwd):/backup alpine tar xzf /backup/foomclous-data-backup.tar.gz -C /
```

## Nginx 鍙嶅悜浠ｇ悊閰嶇疆

濡傛灉浣犳湁鍩熷悕锛屽彲浠ラ厤缃?Nginx 鍙嶅悜浠ｇ悊锛?
```nginx
# 鍓嶇
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:47832;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 鍚庣 API
server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:51947;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 500M;
    }
}
```

## 甯歌闂

### 1. 闀滃儚鎷夊彇澶辫触

```bash
# 閲嶆柊鐧诲綍 Docker Hub
docker login
```

### 2. 鏁版嵁搴撹繛鎺ュけ璐?
妫€鏌?`DATABASE_URL` 鐜鍙橀噺鍜岀綉缁滈厤缃槸鍚︽纭€?
### 3. 涓婁紶鏂囦欢澶辫触

妫€鏌ュ瓨鍌ㄧ洰褰曟潈闄愬拰纾佺洏绌洪棿銆?
### 4. 鏌ョ湅鏃ュ織

```bash
# 鏌ョ湅鎵€鏈夊鍣ㄦ棩蹇?docker-compose logs -f

# 鏌ョ湅鐗瑰畾瀹瑰櫒鏃ュ織
docker logs -f foomclous-backend
docker logs -f foomclous-frontend
```

## 鏇存柊闀滃儚

```bash
# 鎷夊彇鏈€鏂伴暅鍍?docker-compose pull

# 閲嶆柊鍒涘缓瀹瑰櫒
docker-compose up -d
```

## 鍋滄鍜屾竻鐞?
```bash
# 鍋滄瀹瑰櫒
docker-compose down

# 鍋滄骞跺垹闄ゅ嵎锛堣鍛婏細浼氬垹闄ゆ暟鎹紒锛?docker-compose down -v
```

## 瀹夊叏寤鸿

1. **浣跨敤寮哄瘑鐮?*锛氭暟鎹簱鍜岃闂瘑鐮佸簲浣跨敤寮哄瘑鐮?2. **瀹氭湡鏇存柊**锛氬畾鏈熸媺鍙栨渶鏂伴暅鍍忔洿鏂?3. **HTTPS**锛氱敓浜х幆澧冨繀椤讳娇鐢?HTTPS
4. **闃茬伀澧?*锛氶檺鍒朵笉蹇呰鐨勭鍙ｈ闂?5. **澶囦唤**锛氬畾鏈熷浠芥暟鎹嵎
6. **鏃ュ織鐩戞帶**锛氱洃鎺у鍣ㄦ棩蹇楀彂鐜板紓甯?
## 鏀寔

濡傛湁闂锛岃鎻愪氦 Issue 鎴栬仈绯荤淮鎶よ€呫€?
