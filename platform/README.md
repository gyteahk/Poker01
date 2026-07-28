# cyber888.win Platform MVP

博彩平台最小可行產品（與宣傳站分離），品牌：**cyber888.win**。

## 已定範圍

- USDT-TRC20 入金（payment gateway **stub**，可換真接）
- 提現：**人手審核**（預留 ≤1000 自動）
- 遊戲大廳：老虎機／真人／打魚／牌類／撲克（provider stub）
- 體育：**足球** 1X2（獨立 sports stub）
- 帳本流水 + idempotency（防重複入帳）

## 啟動

```bash
cd platform
npm install
npm run db:setup
npm run dev
```

開啟 http://localhost:3001

### 預設管理員

- Email: `admin@cyber888.win`
- Password: `admin123456`（見 `.env`）

## 建議試跑流程

1. 註冊一般會員 → 錢包 → 產生入金地址 →「模擬鏈上確認」
2. 去遊戲大廳啟動一款遊戲（stub）
3. 去足球下一注（會鎖碼）
4. 申請提現 → 用管理員登入 `/admin` 批准或拒絕

## 換真接時改邊度

| 模組 | 檔案 |
|------|------|
| USDT gateway | `src/lib/providers/usdt-gateway.ts` + webhook |
| 綜合遊戲 | `src/lib/providers/games.ts` |
| 體育／足球 | `src/lib/providers/sports.ts` + 結算 worker |

宣傳站（repo root）繼續跑 port 3000；本平台用 **3001**。
