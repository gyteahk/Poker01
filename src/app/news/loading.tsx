export default function NewsLoading() {
  return (
    <div className="page">
      <div className="shell">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-line" />
        <div className="news-list" style={{ marginTop: "2rem" }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="news-card skeleton-card">
              <div className="skeleton skeleton-media" />
              <div className="news-card-body">
                <div className="skeleton skeleton-line short" />
                <div className="skeleton skeleton-line" />
                <div className="skeleton skeleton-line" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
