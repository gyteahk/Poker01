# NOWPayments 接駁（cyber888）

官方文件：https://documenter.getpostman.com/view/7907941/2s93JusNJt

## 環境變數（只放 `.env`，勿 commit）

- `NOWPAYMENTS_API_KEY`
- `NOWPAYMENTS_IPN_SECRET`
- `NOWPAYMENTS_PUBLIC_KEY`（可選／widget）
- `USDT_GATEWAY_CALLBACK_URL` = `https://你的域名/api/deposit/webhook`
- `ALLOW_DEPOSIT_SIMULATE=true` 僅本機開發

## 開單參數（純 USDT）

- `price_currency` / `pay_currency` = `usdttrc20`
- `is_fixed_rate` = `false`（目標走 **0.5% without exchange**）
- `is_fee_paid_by_user` = `false`
- 入帳：IPN `actually_paid`（轉幾多入幾多）

## 本機限制

IPN **唔會**打去 localhost。未設公開 callback 時仍可「模擬入帳」測試帳本。
正式測 IPN：部署 HTTPS 或用 tunnel（ngrok 等）把 callback 指到 `/api/deposit/webhook`。
