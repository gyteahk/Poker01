import Link from "next/link";

export default function WhyUsdtPage() {
  return (
    <div className="app-body">
      <section className="page-title-bar">
        <h1>點解用 USDT-TRC20</h1>
        <p className="muted">入金同提現用同一種穩定幣，流程更直觀</p>
      </section>
      <div className="card stack" style={{ maxWidth: 640 }}>
        <p className="muted" style={{ margin: 0 }}>
          USDT 係與美元掛鈎的穩定幣；TRC20 指 Tron 網絡上的版本，轉帳通常較快、手續費較低。
        </p>
        <ul className="feature-list">
          <li>入帳以實際到帳金額為準（唔係固定報價鎖死）</li>
          <li>請只轉 USDT-TRC20，唔好轉其他鏈或其他幣</li>
          <li>最低入金建議約 15 USDT（視通道要求）</li>
          <li>通道目標手續費約 0.5% 檔；網絡費由鏈上決定</li>
        </ul>
        <Link className="btn" href="/wallet">
          去錢包入金
        </Link>
      </div>
    </div>
  );
}
