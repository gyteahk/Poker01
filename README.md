# POKER01

Colorful bilingual (中文 / English) **一站式 Poker 資訊站** promo site.

## Features

- Brand: **POKER01**
- Mini games + **今日決策**（每小時一輪 + 倒數）
- **時事快睇**（RSS + DeepSeek 寫文 + Gemini 封面；歸檔持久化）
- **Poker小百科**
- WhatsApp / Telegram 聯絡；ClubGG 加入連結

## Run locally

```bash
npm install
cp .env.example .env.local
# put DEEPSEEK_API_KEY + GEMINI_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy on Netlify

1. Push repo to GitHub, create a Netlify site from that repo.
2. Build settings are in `netlify.toml` (`@netlify/plugin-nextjs`).
3. Set environment variables in Netlify UI:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Your real HTTPS domain, e.g. `https://poker01.com` |
| `DEEPSEEK_API_KEY` | News writing |
| `GEMINI_API_KEY` | Cover images |

4. **Persistence**: news archive, cover binaries, and daily vote tallies use **Netlify Blobs** (`poker01` store) in production, with a local `data/` fallback for `next dev`.
5. After first deploy, open `/news` once (or wait for traffic) so the archive can cold-start.

## PWA

- Manifest: `public/manifest.webmanifest`
- Icons: `public/icons/`（`npm run icons:pwa` 由 logo 產生）
- Service worker via `@ducanh2912/next-pwa`（production build 先啟用；`next dev` 預設關閉）
- Offline fallback: `/offline`

手機用 Safari／Chrome 打開 `https://poker01.club` 後可「加到主畫面」。

