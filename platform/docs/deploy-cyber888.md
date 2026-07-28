# cyber888.vip 部署準備

本平台係 **Next.js + Prisma**，有伺服器 session、webhook、帳本寫入。  
**唔建議**用純靜態／無持久磁碟嘅 serverless + SQLite。

## 建議架構（MVP 上線）

| 項目 | 建議 |
|------|------|
| 域名 | `cyber888.vip`（A／CNAME 指到主機） |
| 應用 | Node 跑 `next start`（VPS／Railway／Render／Fly） |
| 資料庫 | **PostgreSQL**（上線必換；本機開發可繼續 SQLite） |
| HTTPS | Cloudflare 或主機憑證 |
| 環境 | 獨立 production `.env`，唔好用開發密鑰 |

## 你要準備／交嚟嘅嘢

1. 域名 `cyber888.vip` 嘅 DNS 控制權（Cloudflare 最好）  
2. 一部主機或 PaaS 帳號（任揀一種）：  
   - **VPS**（例如 Ubuntu 22.04，2GB RAM 起）  
   - 或 Railway／Render／Fly  
3. PostgreSQL（PaaS 通常一鍵加；VPS 可 Docker `postgres:16`）  
4. 一組強密碼：`SESSION_SECRET`、`ADMIN_BOOTSTRAP_PASSWORD`、之後 gateway secret  

有以上就可以叫我幫你寫具體部署指令／接 DNS。

## Production 環境變數

```env
DATABASE_URL="postgresql://USER:PASS@HOST:5432/cyber888?schema=public"
SESSION_SECRET="至少32字元隨機字串"
USDT_GATEWAY_WEBHOOK_SECRET="之後接 gateway 再填"
ADMIN_BOOTSTRAP_EMAIL="admin@cyber888.vip"
ADMIN_BOOTSTRAP_PASSWORD="強密碼"
NODE_ENV="production"
```

可選：

```env
NEXT_PUBLIC_SITE_URL="https://cyber888.vip"
USDT_GATEWAY_BASE_URL=
USDT_GATEWAY_API_KEY=
USDT_GATEWAY_CALLBACK_URL="https://cyber888.vip/api/deposit/webhook"
```

## 切換 Postgres（上線前）

1. 改 `prisma/schema.prisma`：

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. 設好 `DATABASE_URL` 後：

```bash
cd platform
npx prisma db push
npm run db:seed
npm run build
npm run start
```

本機開發可繼續用 SQLite；上線用 Postgres（建議開 git branch 或用 schema 雙環境文件）。

## VPS 快速流程（概要）

```bash
# 主機上
git clone <你的 repo>
cd Poker01/platform
cp .env.example .env   # 改成 production 值 + Postgres URL
npm ci
npx prisma db push
npm run db:seed
npm run build
# 用 pm2 / systemd 常駐：
npx pm2 start npm --name cyber888 -- start
```

反代（Nginx／Caddy）把 `cyber888.vip` → `127.0.0.1:3001`，並開 HTTPS。

## Cloudflare

- DNS：`@`／`www` 指到主機 IP（或 CNAME 到 PaaS）  
- SSL：Full（strict）若源站有憑證  
- Webhook：暫時唔好開太激進 Bot Fight，以免 gateway callback 被擋；可先 allow `/api/deposit/webhook`

## 上線檢查清單

- [ ] HTTPS 正常  
- [ ] 註冊／登入／session cookie（`Secure`）  
- [ ] 管理員可入 `/admin`  
- [ ] 入金 webhook URL 可從外網 POST（接 gateway 後測）  
- [ ] 備份 Postgres  
- [ ] 改走預設 `admin123456`

## 而家未自動部署嘅原因

未有你嘅主機／DNS／Postgres 憑證前，只準備文件同流程。  
你提供：**主機類型（VPS 定 Railway 等）+ 域名是否已指向**，就可以進入實際部署步驟。
