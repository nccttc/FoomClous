# Docker 鍨冨溇娓呯悊鎸囧崡 馃Ч

---
[杩斿洖鏂囨。涓績](./README.md)

鏈枃妗ｆ彁渚涗簡娓呯悊 FoomClous 椤圭洰 Docker 鍨冨溇鏂囦欢鐨勮缁嗘寚鍗椼€?
## 馃搵 鐩綍

- [蹇€熸竻鐞哴(#蹇€熸竻鐞?
- [鍒嗘娓呯悊](#鍒嗘娓呯悊)
- [娓呯悊璇存槑](#娓呯悊璇存槑)
- [娉ㄦ剰浜嬮」](#娉ㄦ剰浜嬮」)

---

## 馃殌 蹇€熸竻鐞?
### 鏂规硶 1锛氫娇鐢ㄦ竻鐞嗚剼鏈紙鎺ㄨ崘锛?
```bash
# 1. 璧嬩簣鑴氭湰鎵ц鏉冮檺
chmod +x docker-cleanup.sh

# 2. 杩愯娓呯悊鑴氭湰
./docker-cleanup.sh
```

### 鏂规硶 2锛氫竴閿竻鐞嗘墍鏈夋湭浣跨敤璧勬簮

```bash
# 鈿狅笍 璀﹀憡锛氳繖浼氬垹闄ゆ墍鏈夋湭浣跨敤鐨勫鍣ㄣ€侀暅鍍忋€佺綉缁滃拰鍗?docker system prune -a --volumes -f
```

---

## 馃敡 鍒嗘娓呯悊

### 1. 鍋滄骞跺垹闄ゅ鍣?
```bash
# 鍋滄骞跺垹闄?docker-compose 绠＄悊鐨勫鍣?docker-compose down

# 鍒犻櫎鎵€鏈夊仠姝㈢殑瀹瑰櫒
docker container prune -f
```

### 2. 娓呯悊闀滃儚

```bash
# 鏌ョ湅鎵€鏈夐暅鍍?docker images

# 鍒犻櫎鏈娇鐢ㄧ殑闀滃儚
docker image prune -a -f

# 鍒犻櫎鐗瑰畾闀滃儚锛堝彲閫夛級
docker rmi <闀滃儚ID>
```

### 3. 娓呯悊鍗?
```bash
# 鏌ョ湅鎵€鏈夊嵎
docker volume ls

# 鍒犻櫎鏈娇鐢ㄧ殑鍗凤紙鈿狅笍 浼氬垹闄ゆ暟鎹紒锛?docker volume prune -f

# 鍒犻櫎鐗瑰畾鍗凤紙鍙€夛級
docker volume rm <鍗峰悕>
```

### 4. 娓呯悊缃戠粶

```bash
# 鏌ョ湅鎵€鏈夌綉缁?docker network ls

# 鍒犻櫎鏈娇鐢ㄧ殑缃戠粶
docker network prune -f
```

### 5. 娓呯悊鏋勫缓缂撳瓨

```bash
# 鍒犻櫎鎵€鏈夋瀯寤虹紦瀛?docker builder prune -a -f
```

---

## 馃搳 娓呯悊璇存槑

### 鍚勭被璧勬簮璇存槑

| 璧勬簮绫诲瀷 | 璇存槑 | 鏄惁鍒犻櫎鏁版嵁 |
|---------|------|------------|
| **瀹瑰櫒** | 杩愯涓殑搴旂敤瀹炰緥 | 鉂?鍚?|
| **闀滃儚** | 鏋勫缓鐨勫簲鐢ㄩ暅鍍?| 鉂?鍚?|
| **鍗?* | 鎸佷箙鍖栨暟鎹瓨鍌?| 鈿狅笍 **鏄?* |
| **缃戠粶** | 瀹瑰櫒闂撮€氫俊缃戠粶 | 鉂?鍚?|
| **鏋勫缓缂撳瓨** | Docker 鏋勫缓鏃剁殑缂撳瓨灞?| 鉂?鍚?|

### 鏈」鐩娇鐢ㄧ殑鍗?
鏍规嵁 `docker-compose.yml`锛屾湰椤圭洰浣跨敤浠ヤ笅鍗凤細

- **`file-storage`**: 瀛樺偍涓婁紶鐨勬枃浠躲€佺缉鐣ュ浘鍜屽垎鍧楁暟鎹?  - `/data/uploads` - 涓婁紶鐨勬枃浠?  - `/data/thumbnails` - 缂╃暐鍥?  - `/data/chunks` - 鍒嗗潡鏁版嵁

- **`postgres-data`**: PostgreSQL 鏁版嵁搴撴暟鎹?  - `/var/lib/postgresql/data` - 鏁版嵁搴撴枃浠?
鈿狅笍 **璀﹀憡**锛氬垹闄よ繖浜涘嵎浼氬鑷存墍鏈変笂浼犵殑鏂囦欢鍜屾暟鎹簱鏁版嵁涓㈠け锛?
---

## 鈿狅笍 娉ㄦ剰浜嬮」

### 1. 鏁版嵁澶囦唤

鍦ㄦ竻鐞嗗嵎涔嬪墠锛岃纭繚宸插浠介噸瑕佹暟鎹細

```bash
# 澶囦唤鏁版嵁搴?docker-compose exec postgres pg_dump -U foomclous foomclous > backup.sql

# 澶囦唤鏂囦欢瀛樺偍锛堝湪瀹夸富鏈轰笂锛?docker run --rm -v foomclous_file-storage:/data -v $(pwd):/backup alpine tar czf /backup/file-storage-backup.tar.gz /data
```

### 2. 淇濈暀鐗瑰畾鍗?
濡傛灉鍙兂娓呯悊闀滃儚鍜岀紦瀛橈紝鑰屼笉鍒犻櫎鏁版嵁鍗凤細

```bash
# 涓嶄娇鐢?--volumes 鍙傛暟
docker system prune -a -f
```

### 3. 鏌ョ湅纾佺洏浣跨敤鎯呭喌

娓呯悊鍓嶅悗鍙互鏌ョ湅纾佺洏浣跨敤鎯呭喌锛?
```bash
# 鏌ョ湅 Docker 纾佺洏浣跨敤
docker system df

# 璇︾粏淇℃伅
docker system df -v
```

### 4. 閲嶆柊鍚姩椤圭洰

娓呯悊鍚庨噸鏂板惎鍔ㄩ」鐩細

```bash
# 閲嶆柊鏋勫缓骞跺惎鍔?docker-compose up -d --build

# 鎴栬€呭彧鍚姩锛堝鏋滈暅鍍忚繕鍦級
docker-compose up -d
```

---

## 馃攳 甯歌闂

### Q1: 娓呯悊鍚庨」鐩棤娉曞惎鍔紵

**A**: 濡傛灉鍒犻櫎浜嗛暅鍍忥紝闇€瑕侀噸鏂版瀯寤猴細

```bash
docker-compose up -d --build
```

### Q2: 鏁版嵁涓㈠け浜嗘€庝箞鍔烇紵

**A**: 濡傛灉璇垹浜嗗嵎锛屽彧鑳戒粠澶囦唤鎭㈠锛?
```bash
# 鎭㈠鏁版嵁搴?docker-compose exec -T postgres psql -U foomclous foomclous < backup.sql

# 鎭㈠鏂囦欢瀛樺偍
docker run --rm -v foomclous_file-storage:/data -v $(pwd):/backup alpine tar xzf /backup/file-storage-backup.tar.gz -C /
```

### Q3: 濡備綍鍙竻鐞嗙壒瀹氶」鐩殑璧勬簮锛?
**A**: 浣跨敤 docker-compose 鍛戒护锛?
```bash
# 鍋滄骞跺垹闄ゅ鍣ㄣ€佺綉缁滐紙淇濈暀鍗凤級
docker-compose down

# 鍋滄骞跺垹闄ゅ鍣ㄣ€佺綉缁溿€佸嵎锛堚殸锔?鍒犻櫎鏁版嵁锛?docker-compose down -v

# 鍋滄骞跺垹闄ゅ鍣ㄣ€佺綉缁溿€佸嵎銆侀暅鍍?docker-compose down -v --rmi all
```

### Q4: 纾佺洏绌洪棿涓嶈冻锛屽浣曞揩閫熼噴鏀撅紵

**A**: 鎸変紭鍏堢骇娓呯悊锛?
```bash
# 1. 鍏堟竻鐞嗘瀯寤虹紦瀛橈紙閫氬父鍗犵敤鏈€澶氾級
docker builder prune -a -f

# 2. 娓呯悊鏈娇鐢ㄧ殑闀滃儚
docker image prune -a -f

# 3. 娓呯悊鍋滄鐨勫鍣?docker container prune -f

# 4. 鏈€鍚庤€冭檻娓呯悊鍗凤紙浼氬垹闄ゆ暟鎹級
docker volume prune -f
```

---

## 馃搱 鐩戞帶纾佺洏浣跨敤

瀹氭湡妫€鏌?Docker 纾佺洏浣跨敤鎯呭喌锛?
```bash
# 绠€鍗曟煡鐪?docker system df

# 璇︾粏鏌ョ湅
docker system df -v

# 鏌ョ湅鐗瑰畾绫诲瀷
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
docker volume ls --format "table {{.Name}}\t{{.Driver}}\t{{.Mountpoint}}"
```

---

## 馃洝锔?鏈€浣冲疄璺?
1. **瀹氭湡娓呯悊**锛氬缓璁瘡鏈堟竻鐞嗕竴娆℃瀯寤虹紦瀛樺拰鏈娇鐢ㄧ殑闀滃儚
2. **澶囦唤鏁版嵁**锛氭竻鐞嗗嵎涔嬪墠鍔″繀澶囦唤鏁版嵁
3. **鐩戞帶纾佺洏**锛氬畾鏈熸鏌?Docker 纾佺洏浣跨敤鎯呭喌
4. **浣跨敤 .dockerignore**锛氬噺灏戞瀯寤轰笂涓嬫枃澶у皬
5. **澶氶樁娈垫瀯寤?*锛氫紭鍖栭暅鍍忓ぇ灏?
---

## 馃摎 鐩稿叧鍛戒护鍙傝€?
```bash
# 鏌ョ湅甯姪
docker system --help
docker image --help
docker volume --help
docker container --help

# 鏌ョ湅璇︾粏淇℃伅
docker inspect <瀹瑰櫒/闀滃儚/鍗?

# 瀹炴椂鐩戞帶
docker stats
```
