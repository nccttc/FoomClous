# 椤圭洰缁撴瀯鎬昏 馃彈锔?
FoomClous 閲囩敤鍓嶅悗绔垎绂绘灦鏋勶紝閫氳繃绉诲姩绔弸濂界殑 Web 鐣岄潰鍜?Telegram 鏈哄櫒浜烘彁渚涗簯瀛樺偍涓浆鏈嶅姟銆?
## 馃搨 鐩綍缁撴瀯

```text
FoomClous/
鈹溾攢鈹€ backend/                # 鍚庣 (Node.js + Express + TypeScript)
鈹?  鈹溾攢鈹€ src/
鈹?  鈹?  鈹溾攢鈹€ routes/         # API 璺敱 (鏂囦欢銆佸瓨鍌ㄩ厤缃€佽璇併€佸垎浜?
鈹?  鈹?  鈹溾攢鈹€ services/       # 鏍稿績涓氬姟閫昏緫 (瀛樺偍鎻愪緵鍟嗐€乀elegram 鏈哄櫒浜恒€佹暟鎹簱)
鈹?  鈹?  鈹溾攢鈹€ middleware/     # 涓棿浠?(璁よ瘉銆侀敊璇鐞?
鈹?  鈹?  鈹斺攢鈹€ index.ts        # 鍏ュ彛鏂囦欢
鈹?  鈹溾攢鈹€ uploads/            # 鏈湴涓婁紶涓存椂鐩綍 (Local Provider 瀛樺偍鍦?
鈹?  鈹斺攢鈹€ package.json
鈹?鈹溾攢鈹€ frontend/               # 鍓嶇 (React + Vite + Tailwind CSS)
鈹?  鈹溾攢鈹€ src/
鈹?  鈹?  鈹溾攢鈹€ components/     # UI 缁勪欢 (Layout, UI 鍩虹缁勪欢, 鍔熻兘椤甸潰)
鈹?  鈹?  鈹溾攢鈹€ services/       # API 瀹㈡埛绔?(涓庡悗绔€氫俊)
鈹?  鈹?  鈹溾攢鈹€ hooks/          # 鑷畾涔?React Hooks (涓婚銆佽璇?
鈹?  鈹?  鈹斺攢鈹€ App.tsx         # 搴旂敤涓诲叆鍙?鈹?  鈹斺攢鈹€ package.json
鈹?鈹溾攢鈹€ deploy/                 # 閮ㄧ讲閰嶇疆 (Nginx, Certbot 绛?
鈹溾攢鈹€ docs/                   # 椤圭洰鏂囨。涓績 (GitHub Pages 婧?
鈹溾攢鈹€ docker-compose.yml      # Docker 缂栨帓閰嶇疆
鈹斺攢鈹€ init.sql                # 鏁版嵁搴撳垵濮嬪寲鑴氭湰
```

## 馃殌 鎶€鏈爤

### 鍚庣
- **Runtime**: Node.js
- **Framework**: Express
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase)
- **Networking**: Axios (鐢ㄤ簬 Telegram & Cloud API)
- **Storage Libs**: `webdav`, `@aws-sdk/client-s3`, `ali-oss`

### 鍓嶇
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS / Vanilla CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **I18n**: react-i18next

## 馃攧 鏁版嵁娴佸悜

1. **涓婁紶娴佺▼**锛氬鎴风 -> 鍚庣 (涓存椂缂撳瓨) -> 瀛樺偍鎻愪緵鍟?(Cloud/Local)銆?2. **涓嬭浇娴佺▼**锛氬鎴风 -> 鍚庣 -> (濡傛灉鏄?Cloud锛屽垯鐢熸垚绛惧悕 URL / 濡傛灉鏄?Local锛屽垯娴佸紡浼犺緭)銆?3. **Bot 浜や簰**锛歍elegram URL -> 鍚庣 (涓嬭浇鍒颁复鏃舵枃浠? -> 鍚庣 (鎺ㄩ€佸埌瀛樺偍婧? -> 鏇存柊 Bot 娑堟伅銆?
---
[杩斿洖鏂囨。涓績](./README.md)
