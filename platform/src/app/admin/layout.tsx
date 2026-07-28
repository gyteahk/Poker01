import { AdminNav } from "@/components/AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-body">
      <div className="stack" style={{ gap: "0.75rem" }}>
        <section className="page-title-bar">
          <h1>cyber888 後台</h1>
          <p className="muted">會員、充提、流水與提現審核</p>
        </section>
        <AdminNav />
        {children}
      </div>
    </div>
  );
}
