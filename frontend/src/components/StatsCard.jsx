function StatsCard({ icon: Icon, label, value, subtext, color = "#4f46e5", bg = "#eef2ff" }) {
  return (
    <div className="stat-card">
      <div className="stat-icon-wrapper" style={{ background: bg, color: color }}>
        {Icon && <Icon size={26} />}
      </div>
      <div className="stat-info">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
        {subtext && (
          <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
}

export default StatsCard;
