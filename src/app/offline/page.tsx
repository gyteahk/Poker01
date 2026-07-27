import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "離線中",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="page">
      <div className="shell" style={{ textAlign: "center", paddingTop: "4rem" }}>
        <h1 className="page-title">暫時離線</h1>
        <p className="lead">
          網絡未連上。小遊戲同已開啟過嘅頁面可能仍然可用；時事同今日決策要有網絡先更新。
        </p>
        <p style={{ marginTop: "1.5rem" }}>
          <Link href="/" className="btn btn-gold">
            返回首頁
          </Link>
        </p>
      </div>
    </div>
  );
}
